import { LosslessDto } from '../../lib'
import { allowAny } from '../../test-support/testTags'
import { StatefulLogInterceptor } from '../../zeebe/lib/StatefulLogInterceptor'
import { ZBStreamWorker } from '../../zeebe/lib/ZBStreamWorker'
import { ZBGrpc } from '../../zeebe/lib/interfaces-1.0'
import { ZeebeGrpcClient } from '../../zeebe'

import { FakeStreamTransport } from './conformance/FakeStreamTransport'

/**
 * Behaviour of the stream lifecycle in ZBStreamWorker that the conformance
 * suite does not pin down: what is passed to the backfill poll, what is logged,
 * the boundaries of the backoff reset, jitter, and the failure paths of the data
 * handler. Written against a fake transport that is a real `Readable`; mutation
 * testing (npm run test:mutation) is what showed these gaps.
 */

const BACKOFF = { initialDelayMs: 1_000, maxDelayMs: 8_000 }

const setup = (zbClientOverrides: Record<string, unknown> = {}) => {
	const transport = new FakeStreamTransport()
	const log = {
		logInfo: vi.fn(),
		logDebug: vi.fn(),
		logError: vi.fn(),
	}
	const zbClient = {
		activateJobs: vi.fn().mockResolvedValue([]),
		failJob: vi.fn().mockResolvedValue(undefined),
		...zbClientOverrides,
	}
	const worker = new ZBStreamWorker({
		grpcClient: {
			streamActivatedJobsStream: transport.open,
			close: async () => undefined,
		} as unknown as ZBGrpc,
		log: log as unknown as StatefulLogInterceptor,
		zbClient: zbClient as unknown as ZeebeGrpcClient,
	})
	const streamJobs = (
		options: Partial<Parameters<ZBStreamWorker['streamJobs']>[0]> = {}
	) =>
		worker.streamJobs({
			type: 'details-task',
			worker: 'details-worker',
			timeout: 30_000,
			tenantIds: ['<default>'],
			taskHandler: () => undefined as never,
			inputVariableDto: LosslessDto,
			customHeadersDto: LosslessDto,
			pollInterval: 0,
			streamReconnect: BACKOFF,
			...options,
		})
	const internals = worker as unknown as {
		streams: unknown[]
		reconnectTimers: Set<unknown>
	}
	return { transport, log, zbClient, worker, streamJobs, internals }
}

const job = (overrides: Record<string, unknown> = {}) => ({
	key: '42',
	type: 'details-task',
	processInstanceKey: '1',
	retries: 3,
	variables: '{}',
	customHeaders: '{}',
	...overrides,
})

const settle = () => vi.advanceTimersByTimeAsync(0)

describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker stream lifecycle details',
	() => {
		beforeEach(() => {
			vi.useFakeTimers()
		})
		afterEach(() => {
			vi.useRealTimers()
		})

		test('logs when it is constructed without a client', () => {
			const log = { logInfo: vi.fn(), logDebug: vi.fn(), logError: vi.fn() }
			new ZBStreamWorker({
				grpcClient: {} as unknown as ZBGrpc,
				log: log as unknown as StatefulLogInterceptor,
				zbClient: undefined as unknown as ZeebeGrpcClient,
			})
			expect(log.logError).toHaveBeenCalledWith('Missing ZBClient')
		})

		test('the backfill poll asks for a non-blocking activation with the stream request', async () => {
			const { zbClient, streamJobs, worker } = setup()
			await streamJobs({ pollMaxJobsToActivate: 7, fetchVariable: ['foo'] })
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(zbClient.activateJobs).toHaveBeenCalledWith(
				expect.objectContaining({
					type: 'details-task',
					worker: 'details-worker',
					timeout: 30_000,
					maxJobsToActivate: 7,
					tenantIds: ['<default>'],
					fetchVariable: ['foo'],
					requestTimeout: -1,
				})
			)
			await worker.close()
		})

		test('jobs from the backfill poll are handed to the task handler', async () => {
			const taskHandler = vi.fn()
			const { zbClient, streamJobs, worker } = setup()
			zbClient.activateJobs.mockResolvedValue([job(), job({ key: '43' })])
			await streamJobs({ taskHandler })
			expect(taskHandler.mock.calls.map(([j]) => j.key)).toEqual(['42', '43'])
			await worker.close()
		})

		test('a throwing or rejecting callback is logged, by name, and does not stop recovery', async () => {
			const { transport, log, streamJobs, worker } = setup()
			const handle = await streamJobs({
				onStreamError: () => {
					throw new Error('sync callback bug')
				},
				onStreamEnd: async () => {
					throw new Error('async callback bug')
				},
				onStreamReconnect: () => {
					throw new Error('reconnect callback bug')
				},
			})

			transport.latest.serverError(new Error('boom'))
			await settle()
			expect(log.logError).toHaveBeenCalledWith(
				'Exception in onStreamError callback of stream worker: sync callback bug'
			)
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			expect(log.logError).toHaveBeenCalledWith(
				'Exception in onStreamReconnect callback of stream worker: reconnect callback bug'
			)
			expect(transport.opens, 're-opened despite the throwing callbacks').toBe(
				2
			)

			transport.latest.serverEnd()
			await settle()
			expect(log.logError).toHaveBeenCalledWith(
				'Exception in onStreamEnd callback of stream worker: async callback bug'
			)
			handle.close()
			await worker.close()
		})

		test('failures of the stream are logged with the job type', async () => {
			const { transport, log, streamJobs, worker } = setup()
			await streamJobs()

			transport.latest.serverError(new Error('boom'))
			await settle()
			expect(log.logError).toHaveBeenCalledWith(
				'Job stream for details-task failed: boom'
			)
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			transport.latest.serverEnd()
			await settle()
			expect(log.logError).toHaveBeenCalledWith(
				'Job stream for details-task ended'
			)

			transport.failNextOpen(new Error('no route'))
			await vi.advanceTimersByTimeAsync(2 * BACKOFF.initialDelayMs)
			expect(log.logError).toHaveBeenCalledWith(
				'Failed to open job stream for details-task: no route'
			)
			await worker.close()
		})

		test('a dead stream is dropped from the worker, and the new one is tracked', async () => {
			const { transport, internals, streamJobs, worker } = setup()
			await streamJobs()
			expect(internals.streams).toHaveLength(1)

			transport.latest.serverError(new Error('boom'))
			await settle()
			expect(internals.streams, 'the dead stream is dropped').toHaveLength(0)
			expect(internals.reconnectTimers.size).toBe(1)

			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			expect(internals.streams).toHaveLength(1)
			expect(internals.reconnectTimers.size).toBe(0)

			await worker.close()
			expect(internals.streams).toHaveLength(0)
		})

		test('an error and an end for the same dead stream schedule one re-open', async () => {
			const { transport, streamJobs, worker } = setup()
			await streamJobs()
			const stream = transport.latest

			// A real stream emits `error` then `close`; make it end as well.
			stream.serverError(new Error('boom'))
			stream.push(null)
			await settle()
			await vi.advanceTimersByTimeAsync(10 * BACKOFF.maxDelayMs)
			// One re-open (the new stream stays up): opens is 2, not 3.
			expect(transport.opens).toBe(2)
			await worker.close()
		})

		test('the backoff restarts after a stream that stayed up for the maximum delay, not before', async () => {
			const { transport, streamJobs, worker } = setup()
			const attempts: number[] = []
			await streamJobs({ onStreamReconnect: (n) => void attempts.push(n) })

			// Dies one millisecond short of the maximum delay: not healthy yet.
			await vi.advanceTimersByTimeAsync(BACKOFF.maxDelayMs - 1)
			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			expect(attempts).toEqual([1])

			// This one stays up for exactly the maximum delay: healthy, so the
			// next failure starts again from attempt 1.
			await vi.advanceTimersByTimeAsync(BACKOFF.maxDelayMs)
			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			expect(attempts).toEqual([1, 1])
			await worker.close()
		})

		test('a stream that delivered a job restarts the backoff', async () => {
			const taskHandler = vi.fn()
			const { transport, streamJobs, worker } = setup()
			const attempts: number[] = []
			await streamJobs({
				taskHandler,
				onStreamReconnect: (n) => void attempts.push(n),
			})

			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			expect(attempts).toEqual([1])

			transport.latest.serverSend(job())
			await settle()
			expect(taskHandler).toHaveBeenCalledTimes(1)
			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			expect(attempts, 'attempt restarted at 1').toEqual([1, 1])
			await worker.close()
		})

		test('a stream that has not delivered anything keeps the backoff growing', async () => {
			const { transport, streamJobs, worker } = setup()
			const attempts: number[] = []
			await streamJobs({ onStreamReconnect: (n) => void attempts.push(n) })

			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(2 * BACKOFF.initialDelayMs)
			expect(attempts).toEqual([1, 2])
			await worker.close()
		})

		test('a payload that cannot be parsed fails the job, with one retry fewer', async () => {
			const taskHandler = vi.fn()
			const { transport, zbClient, streamJobs, worker } = setup()
			await streamJobs({ taskHandler })

			transport.latest.serverSend(job({ variables: 'not json', retries: 3 }))
			await settle()

			expect(taskHandler).not.toHaveBeenCalled()
			expect(zbClient.failJob).toHaveBeenCalledWith({
				jobKey: '42',
				errorMessage: expect.stringContaining('Error parsing variable payload'),
				retries: 2,
				retryBackOff: 0,
			})
			await worker.close()
		})

		test('failing to fail the job is logged, not an unhandled rejection', async () => {
			const { transport, log, zbClient, streamJobs, worker } = setup()
			zbClient.failJob.mockRejectedValue(new Error('gateway said no'))
			const unhandled: unknown[] = []
			const onUnhandled = (e: unknown) => unhandled.push(e)
			process.on('unhandledRejection', onUnhandled)
			try {
				await streamJobs()
				transport.latest.serverSend(job({ variables: 'not json' }))
				await settle()
				await settle()

				expect(log.logError).toHaveBeenCalledWith(
					'Failed to fail job 42 after a payload parse error: gateway said no'
				)
				expect(unhandled).toEqual([])
			} finally {
				process.off('unhandledRejection', onUnhandled)
				await worker.close()
			}
		})

		test('a task handler that rejects is logged, and the stream keeps running', async () => {
			const { transport, log, streamJobs, worker } = setup()
			const handle = await streamJobs({
				taskHandler: async () => {
					throw new Error('handler bug')
				},
			})

			transport.latest.serverSend(job())
			await settle()

			expect(log.logError).toHaveBeenCalledWith(
				'Unhandled exception in stream worker task handler for job 42: handler bug'
			)
			expect(handle.state).toEqual({ status: 'open' })
			await worker.close()
		})

		test('jitter delays opening the stream by a random period up to the given value', async () => {
			const random = vi.spyOn(Math, 'random').mockReturnValue(0.5)
			try {
				const { transport, streamJobs, worker } = setup()
				const opened = streamJobs({ jitter: 1_000 })
				await vi.advanceTimersByTimeAsync(499)
				expect(transport.opens, 'not opened before the jitter elapses').toBe(0)
				await vi.advanceTimersByTimeAsync(1)
				await opened
				expect(transport.opens).toBe(1)
				await worker.close()
			} finally {
				random.mockRestore()
			}
		})

		test('with reconnection disabled, a failed first open rejects and an open failure later closes the handle', async () => {
			const first = setup()
			first.transport.failNextOpen(new Error('cannot open'))
			await expect(
				first.streamJobs({ streamReconnect: false })
			).rejects.toThrow('cannot open')

			const later = setup()
			const handle = await later.streamJobs({ streamReconnect: false })
			later.transport.latest.serverEnd()
			await settle()
			expect(handle.state).toEqual({
				status: 'closed',
				reason: { kind: 'stream-failed', failure: { kind: 'end' } },
			})
			await first.worker.close()
			await later.worker.close()
		})

		test('the sidecar poll keeps running while the stream is down, and stops on close', async () => {
			const { transport, zbClient, streamJobs, worker } = setup()
			const handle = await streamJobs({ pollInterval: 5_000 })
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			transport.latest.serverError(new Error('boom'))
			await vi.advanceTimersByTimeAsync(5_000)
			// A sidecar poll fired (the reconnect at 1s also backfills).
			expect(zbClient.activateJobs.mock.calls.length).toBeGreaterThanOrEqual(3)

			handle.close()
			const callsAtClose = zbClient.activateJobs.mock.calls.length
			await vi.advanceTimersByTimeAsync(60_000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(callsAtClose)
			await worker.close()
		})
	}
)
