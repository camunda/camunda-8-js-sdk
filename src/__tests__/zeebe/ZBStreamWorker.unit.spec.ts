import { EventEmitter } from 'events'

import { LosslessDto } from '../../lib'
import { allowAny } from '../../test-support/testTags'
import { ZBStreamWorker } from '../../zeebe/lib/ZBStreamWorker'

/**
 * Regression test for https://github.com/camunda/camunda-8-js-sdk/issues/828
 *
 * `ZBStreamWorker` appended every scheduled sidecar poll timer to
 * `pollTimers` and only emptied the array in `close()`. A long-lived worker
 * retained one dead timer per poll cycle per stream. The fix removes the
 * timer that just fired before the next one is scheduled, so the array holds
 * only live timers — one per stream.
 */

// A minimal stand-in for a gRPC ClientReadableStream.
const createMockStream = () => {
	const emitter = new EventEmitter()
	return Object.assign(emitter, {
		cancel: vi.fn(),
		destroy: vi.fn(),
	})
}

const createWorker = () => {
	const grpcClient = {
		streamActivatedJobsStream: vi.fn().mockResolvedValue(createMockStream()),
		close: vi.fn().mockResolvedValue(undefined),
	}
	const zbClient = {
		activateJobs: vi.fn().mockResolvedValue([]),
		failJob: vi.fn().mockResolvedValue(undefined),
	}
	const log = {
		logInfo: vi.fn(),
		logDebug: vi.fn(),
		logError: vi.fn(),
	}
	const worker = new ZBStreamWorker({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		grpcClient: grpcClient as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		log: log as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		zbClient: zbClient as any,
	})
	return { worker, grpcClient, zbClient }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pollTimerCount = (worker: ZBStreamWorker) =>
	(worker as unknown as { pollTimers: unknown[] }).pollTimers.length

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker does not leak poll timers across sidecar poll cycles',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: () => {
					throw new Error('should not be called — no jobs activated')
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollInterval: 1000,
			})

			// The initial backfill poll ran during streamJobs(); exactly one
			// live sidecar timer is scheduled.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pollTimerCount(worker)).toBe(1)

			// Run several poll cycles. Each cycle fires the pending timer, runs
			// the poll, and schedules the next timer.
			for (let cycle = 0; cycle < 5; cycle++) {
				await vi.advanceTimersByTimeAsync(1000)
				expect(pollTimerCount(worker)).toBe(1)
			}
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(6)

			// close() cancels the remaining live timer and empties the array.
			await worker.close()
			expect(pollTimerCount(worker)).toBe(0)
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker tracks at most one live timer per stream',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker } = createWorker()

			const streamReq = {
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: () => {
					throw new Error('should not be called — no jobs activated')
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollInterval: 1000,
			}

			await worker.streamJobs({ ...streamReq, type: 'test-task-1' })
			await worker.streamJobs({ ...streamReq, type: 'test-task-2' })
			expect(pollTimerCount(worker)).toBe(2)

			await vi.advanceTimersByTimeAsync(1000)
			expect(pollTimerCount(worker)).toBe(2)

			await vi.advanceTimersByTimeAsync(1000)
			expect(pollTimerCount(worker)).toBe(2)

			await worker.close()
			expect(pollTimerCount(worker)).toBe(0)
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Dead job stream detection and recovery (SUPPORT-35255).
 *
 * `streamJobs` used to attach only an `error` handler that logged to the
 * console. A stream that errored, or was ended by the server, was never
 * re-opened and the caller was never told, so the worker silently degraded to
 * the low-frequency sidecar poll. It now notifies the caller and re-opens the
 * stream with exponential backoff.
 */
describe('ZBStreamWorker dead stream recovery', () => {
	type MockStream = ReturnType<typeof createMockStream>

	const baseReq = {
		type: 'test-task',
		worker: 'test-worker',
		timeout: 30000,
		tenantIds: ['<default>'],
		taskHandler: () => {
			throw new Error('should not be called — no jobs activated')
		},
		inputVariableDto: LosslessDto,
		customHeadersDto: LosslessDto,
		// Disable the sidecar poll so only backfill polls are counted
		pollInterval: 0,
	}

	// Each call to streamActivatedJobsStream resolves the next queued result
	// (a mock stream, or `{ error }`); once the queue is empty, a fresh stream.
	const setup = (
		queued: Array<MockStream | { error: unknown } | undefined> = []
	) => {
		const created: MockStream[] = []
		const { worker, grpcClient, zbClient } = createWorker()
		grpcClient.streamActivatedJobsStream.mockReset()
		grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
			const next = queued.length > 0 ? queued.shift() : createMockStream()
			if (next && 'cancel' in next) created.push(next)
			return next
		})
		return { worker, grpcClient, zbClient, created }
	}

	const opens = (grpcClient: ReturnType<typeof setup>['grpcClient']) =>
		grpcClient.streamActivatedJobsStream.mock.calls.length

	const unitTest = test.runIf(allowAny([{ deployment: 'unit-test' }]))

	beforeEach(() => {
		vi.useFakeTimers()
	})
	afterEach(() => {
		vi.useRealTimers()
	})

	unitTest(
		'stream error notifies the caller and re-opens after the initial delay',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamError = vi.fn()
			const onStreamReconnect = vi.fn()
			await worker.streamJobs({ ...baseReq, onStreamError, onStreamReconnect })
			expect(opens(grpcClient)).toBe(1)

			const err = new Error('UNAVAILABLE')
			created[0].emit('error', err)
			expect(onStreamError).toHaveBeenCalledTimes(1)
			expect(onStreamError).toHaveBeenCalledWith(err)
			// Not re-opened until the backoff elapses
			expect(opens(grpcClient)).toBe(1)

			await vi.advanceTimersByTimeAsync(999)
			expect(opens(grpcClient)).toBe(1)
			await vi.advanceTimersByTimeAsync(1)
			expect(opens(grpcClient)).toBe(2)
			expect(onStreamReconnect).toHaveBeenCalledTimes(1)
			expect(onStreamReconnect).toHaveBeenCalledWith(1)
			await worker.close()
		}
	)

	unitTest(
		'stream end notifies onStreamEnd (not onStreamError) and re-opens',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamError = vi.fn()
			const onStreamEnd = vi.fn()
			await worker.streamJobs({ ...baseReq, onStreamError, onStreamEnd })

			created[0].emit('end')
			expect(onStreamEnd).toHaveBeenCalledTimes(1)
			expect(onStreamError).not.toHaveBeenCalled()

			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)
			await worker.close()
		}
	)

	unitTest('stream close without end or error is also recovered', async () => {
		const { worker, grpcClient, created } = setup()
		const onStreamEnd = vi.fn()
		await worker.streamJobs({ ...baseReq, onStreamEnd })

		created[0].emit('close')
		expect(onStreamEnd).toHaveBeenCalledTimes(1)
		await vi.advanceTimersByTimeAsync(1000)
		expect(opens(grpcClient)).toBe(2)
		await worker.close()
	})

	unitTest('removes the dead stream from the tracked streams', async () => {
		const { worker, created } = setup()
		const tracked = () =>
			(worker as unknown as { streams: unknown[] }).streams.length
		await worker.streamJobs(baseReq)
		expect(tracked()).toBe(1)

		created[0].emit('error', new Error('boom'))
		expect(tracked()).toBe(0)

		await vi.advanceTimersByTimeAsync(1000)
		expect(tracked()).toBe(1)
		await worker.close()
	})

	unitTest('runs a backfill poll after the stream is re-opened', async () => {
		const { worker, zbClient, created } = setup()
		await worker.streamJobs(baseReq)
		expect(zbClient.activateJobs).toHaveBeenCalledTimes(1) // initial backfill

		created[0].emit('error', new Error('boom'))
		// No poll while the stream is down and no reconnect has happened yet
		expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

		await vi.advanceTimersByTimeAsync(1000)
		expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
		await worker.close()
	})

	unitTest(
		'a failing backfill poll after reconnect does not stop recovery',
		async () => {
			const { worker, grpcClient, zbClient, created } = setup()
			await worker.streamJobs(baseReq)
			zbClient.activateJobs.mockRejectedValue(new Error('poll failed'))

			created[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)

			// The re-opened stream is live: a later failure is still recovered
			// (the stream produced no data, so the backoff has doubled to 2s)
			created[1].emit('error', new Error('boom again'))
			await vi.advanceTimersByTimeAsync(2000)
			expect(opens(grpcClient)).toBe(3)
			await worker.close()
		}
	)

	unitTest(
		'an {error} result from the stream open is retried until it succeeds',
		async () => {
			const { worker, grpcClient, zbClient, created } = setup([
				{ error: new Error('no auth token') },
				{ error: new Error('still no auth token') },
			])
			const onStreamError = vi.fn()
			const onStreamReconnect = vi.fn()

			// Does not throw a TypeError (stream.on is not a function)
			const handle = await worker.streamJobs({
				...baseReq,
				onStreamError,
				onStreamReconnect,
			})
			expect(handle.close).toBeTypeOf('function')
			expect(onStreamError).toHaveBeenCalledTimes(1)
			expect(onStreamError.mock.calls[0][0].message).toBe('no auth token')
			// No stream, so no backfill poll yet
			expect(zbClient.activateJobs).not.toHaveBeenCalled()

			await vi.advanceTimersByTimeAsync(1000) // attempt 1: fails again
			expect(opens(grpcClient)).toBe(2)
			expect(onStreamError).toHaveBeenCalledTimes(2)

			await vi.advanceTimersByTimeAsync(2000) // attempt 2: succeeds
			expect(opens(grpcClient)).toBe(3)
			expect(created).toHaveLength(1)
			expect(onStreamError).toHaveBeenCalledTimes(2)
			expect(onStreamReconnect.mock.calls.map((c) => c[0])).toEqual([1, 2])
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1) // backfill

			// And the stream that finally opened is wired up for recovery
			// It produced no data, so the backoff continues from the 3rd attempt
			created[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(4000)
			expect(opens(grpcClient)).toBe(4)
			await worker.close()
		}
	)

	unitTest(
		'an undefined result from the stream open (client closing) is treated as a failed open',
		async () => {
			const { worker, grpcClient } = setup([undefined])
			const onStreamError = vi.fn()
			await worker.streamJobs({ ...baseReq, onStreamError })
			expect(onStreamError).toHaveBeenCalledTimes(1)
			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)
			await worker.close()
		}
	)

	unitTest(
		'a rejected stream open is treated as a failed open and retried',
		async () => {
			const { worker, grpcClient } = setup()
			grpcClient.streamActivatedJobsStream.mockRejectedValueOnce(
				new Error('rejected')
			)
			const onStreamError = vi.fn()
			await worker.streamJobs({ ...baseReq, onStreamError })
			expect(onStreamError).toHaveBeenCalledTimes(1)
			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)
			await worker.close()
		}
	)

	unitTest(
		'backoff doubles on consecutive failures up to maxDelayMs',
		async () => {
			const failures = Array.from({ length: 6 }, () => ({
				error: new Error('down'),
			}))
			const { worker, grpcClient } = setup(failures)
			await worker.streamJobs({
				...baseReq,
				streamReconnect: { initialDelayMs: 100, maxDelayMs: 500 },
			})
			expect(opens(grpcClient)).toBe(1)

			// Delays: 100, 200, 400, 500 (capped), 500
			const expectedDelays = [100, 200, 400, 500, 500]
			for (const [i, delay] of expectedDelays.entries()) {
				await vi.advanceTimersByTimeAsync(delay - 1)
				expect(opens(grpcClient)).toBe(i + 1)
				await vi.advanceTimersByTimeAsync(1)
				expect(opens(grpcClient)).toBe(i + 2)
			}
			await worker.close()
		}
	)

	unitTest(
		'backoff resets after a re-opened stream delivers a job',
		async () => {
			const { worker, grpcClient, created } = setup([
				{ error: new Error('down') },
				{ error: new Error('down') },
			])
			const onStreamReconnect = vi.fn()
			await worker.streamJobs({
				...baseReq,
				onStreamReconnect,
				streamReconnect: { initialDelayMs: 100, maxDelayMs: 10_000 },
			})
			await vi.advanceTimersByTimeAsync(100) // attempt 1 fails
			await vi.advanceTimersByTimeAsync(200) // attempt 2 succeeds
			expect(created).toHaveLength(1)
			expect(opens(grpcClient)).toBe(3)

			// The stream delivers a job, then dies: restart from the initial delay
			created[0].emit('data', {
				key: '1',
				retries: 3,
				variables: '{}',
				customHeaders: '{}',
			})
			created[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(99)
			expect(opens(grpcClient)).toBe(3)
			await vi.advanceTimersByTimeAsync(1)
			expect(opens(grpcClient)).toBe(4)
			expect(onStreamReconnect.mock.calls.map((c) => c[0])).toEqual([1, 2, 1])
			await worker.close()
		}
	)

	unitTest(
		'backoff does not reset for a stream that dies immediately without data',
		async () => {
			const { worker, grpcClient, created } = setup()
			await worker.streamJobs({
				...baseReq,
				streamReconnect: { initialDelayMs: 100, maxDelayMs: 10_000 },
			})
			// Flapping: each stream opens, then errors straight away
			created[0].emit('error', new Error('flap'))
			await vi.advanceTimersByTimeAsync(100)
			expect(opens(grpcClient)).toBe(2)
			created[1].emit('error', new Error('flap'))
			await vi.advanceTimersByTimeAsync(199)
			expect(opens(grpcClient)).toBe(2) // second delay is 200, not 100
			await vi.advanceTimersByTimeAsync(1)
			expect(opens(grpcClient)).toBe(3)
			await worker.close()
		}
	)

	unitTest(
		'backoff resets for a stream that stayed up for at least maxDelayMs',
		async () => {
			const { worker, grpcClient, created } = setup()
			await worker.streamJobs({
				...baseReq,
				streamReconnect: { initialDelayMs: 100, maxDelayMs: 1000 },
			})
			created[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(100)
			expect(opens(grpcClient)).toBe(2)

			await vi.advanceTimersByTimeAsync(5000) // healthy and idle
			created[1].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(100)
			expect(opens(grpcClient)).toBe(3)
			await worker.close()
		}
	)

	unitTest(
		'error followed by end/close on the same stream schedules a single reopen',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamError = vi.fn()
			const onStreamEnd = vi.fn()
			const onStreamReconnect = vi.fn()
			await worker.streamJobs({
				...baseReq,
				onStreamError,
				onStreamEnd,
				onStreamReconnect,
			})

			created[0].emit('error', new Error('boom'))
			created[0].emit('end')
			created[0].emit('close')
			expect(onStreamError).toHaveBeenCalledTimes(1)
			expect(onStreamEnd).not.toHaveBeenCalled()

			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)
			expect(onStreamReconnect).toHaveBeenCalledTimes(1)
			// Nothing further queued
			await vi.advanceTimersByTimeAsync(60_000)
			expect(opens(grpcClient)).toBe(2)
			expect(
				(worker as unknown as { reconnectTimers: Set<unknown> }).reconnectTimers
					.size
			).toBe(0)
			await worker.close()
		}
	)

	unitTest(
		'a late event from an already-replaced stream does not trigger another reopen',
		async () => {
			const { worker, grpcClient, created } = setup()
			await worker.streamJobs(baseReq)
			created[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)

			created[0].emit('close') // stale stream
			await vi.advanceTimersByTimeAsync(60_000)
			expect(opens(grpcClient)).toBe(2)
			await worker.close()
		}
	)

	unitTest(
		'worker close() cancels a pending reconnect: no reopen, no further callbacks',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamReconnect = vi.fn()
			const onStreamError = vi.fn()
			await worker.streamJobs({ ...baseReq, onStreamReconnect, onStreamError })

			created[0].emit('error', new Error('boom'))
			expect(onStreamError).toHaveBeenCalledTimes(1)
			await worker.close()

			await vi.advanceTimersByTimeAsync(120_000)
			expect(opens(grpcClient)).toBe(1)
			expect(onStreamReconnect).not.toHaveBeenCalled()
			expect(vi.getTimerCount()).toBe(0)
		}
	)

	unitTest(
		'closing the worker does not report the stream it cancels itself as dead',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamError = vi.fn()
			const onStreamEnd = vi.fn()
			await worker.streamJobs({ ...baseReq, onStreamError, onStreamEnd })

			// grpc-js emits an error and a close event when a stream is cancelled
			created[0].cancel.mockImplementation(() => {
				created[0].emit('error', new Error('1 CANCELLED'))
				created[0].emit('close')
			})
			await worker.close()
			expect(created[0].cancel).toHaveBeenCalled()
			expect(onStreamError).not.toHaveBeenCalled()
			expect(onStreamEnd).not.toHaveBeenCalled()
			await vi.advanceTimersByTimeAsync(60_000)
			expect(opens(grpcClient)).toBe(1)
		}
	)

	unitTest(
		'handle close() stops reconnect for that stream and cancels it',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamReconnect = vi.fn()
			const handle = await worker.streamJobs({ ...baseReq, onStreamReconnect })

			handle.close()
			expect(created[0].cancel).toHaveBeenCalled()
			expect(created[0].destroy).toHaveBeenCalled()

			// A late error from the cancelled stream is not a dead stream
			created[0].emit('error', new Error('1 CANCELLED'))
			await vi.advanceTimersByTimeAsync(60_000)
			expect(opens(grpcClient)).toBe(1)
			expect(onStreamReconnect).not.toHaveBeenCalled()
		}
	)

	unitTest(
		'handle close() while a reconnect is pending clears the timer',
		async () => {
			const { worker, grpcClient, created } = setup()
			const handle = await worker.streamJobs(baseReq)
			created[0].emit('error', new Error('boom'))
			handle.close()

			await vi.advanceTimersByTimeAsync(60_000)
			expect(opens(grpcClient)).toBe(1)
			expect(vi.getTimerCount()).toBe(0)
		}
	)

	unitTest(
		'a stream that finishes opening after close() is cancelled, not used',
		async () => {
			const { worker, grpcClient, zbClient } = setup()
			const late = createMockStream()
			let resolveOpen: (s: MockStream) => void = () => {}
			grpcClient.streamActivatedJobsStream.mockImplementationOnce(
				() => new Promise<MockStream>((resolve) => (resolveOpen = resolve))
			)
			const pending = worker.streamJobs(baseReq)
			await worker.close()
			resolveOpen(late)
			await pending

			expect(late.cancel).toHaveBeenCalled()
			expect(late.destroy).toHaveBeenCalled()
			expect(zbClient.activateJobs).not.toHaveBeenCalled()
		}
	)

	unitTest(
		'with streamReconnect: false the callback fires but the stream is not re-opened',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamError = vi.fn()
			const onStreamEnd = vi.fn()
			const onStreamReconnect = vi.fn()
			await worker.streamJobs({
				...baseReq,
				streamReconnect: false,
				onStreamError,
				onStreamEnd,
				onStreamReconnect,
			})

			created[0].emit('error', new Error('boom'))
			expect(onStreamError).toHaveBeenCalledTimes(1)
			created[0].emit('end')
			expect(onStreamEnd).not.toHaveBeenCalled() // already dead

			await vi.advanceTimersByTimeAsync(120_000)
			expect(opens(grpcClient)).toBe(1)
			expect(onStreamReconnect).not.toHaveBeenCalled()
			await worker.close()
		}
	)

	unitTest(
		'with streamReconnect: false, onStreamEnd still fires on end',
		async () => {
			const { worker, grpcClient, created } = setup()
			const onStreamEnd = vi.fn()
			await worker.streamJobs({
				...baseReq,
				streamReconnect: false,
				onStreamEnd,
			})
			created[0].emit('end')
			expect(onStreamEnd).toHaveBeenCalledTimes(1)
			await vi.advanceTimersByTimeAsync(120_000)
			expect(opens(grpcClient)).toBe(1)
			await worker.close()
		}
	)

	unitTest(
		'with streamReconnect: false a failed initial open rejects with the underlying error',
		async () => {
			const { worker, grpcClient } = setup([{ error: new Error('no token') }])
			const onStreamError = vi.fn()
			await expect(
				worker.streamJobs({
					...baseReq,
					streamReconnect: false,
					onStreamError,
				})
			).rejects.toThrow('no token')
			expect(onStreamError).toHaveBeenCalledTimes(1)
			await vi.advanceTimersByTimeAsync(120_000)
			expect(opens(grpcClient)).toBe(1)
			await worker.close()
		}
	)

	unitTest(
		'a callback that throws does not break the reconnect (or crash)',
		async () => {
			const { worker, grpcClient, created } = setup()
			const boom = () => {
				throw new Error('callback exploded')
			}
			const onStreamError = vi.fn(boom)
			const onStreamEnd = vi.fn(boom)
			const onStreamReconnect = vi.fn(boom)
			await worker.streamJobs({
				...baseReq,
				onStreamError,
				onStreamEnd,
				onStreamReconnect,
			})

			expect(() => created[0].emit('error', new Error('boom'))).not.toThrow()
			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(grpcClient)).toBe(2)

			expect(() => created[1].emit('end')).not.toThrow()
			await vi.advanceTimersByTimeAsync(2000)
			expect(opens(grpcClient)).toBe(3)

			expect(onStreamError).toHaveBeenCalledTimes(1)
			expect(onStreamEnd).toHaveBeenCalledTimes(1)
			expect(onStreamReconnect).toHaveBeenCalledTimes(2)
			await worker.close()
		}
	)

	unitTest(
		'async callbacks that reject are observed (no unhandled rejection) and recovery continues',
		async () => {
			const unhandled: unknown[] = []
			const onUnhandled = (reason: unknown) => unhandled.push(reason)
			process.on('unhandledRejection', onUnhandled)
			try {
				const { worker, grpcClient, created } = setup()
				const logError = (
					worker as unknown as {
						logger: { logError: ReturnType<typeof vi.fn> }
					}
				).logger.logError
				const boom = (name: string) => async () => {
					throw new Error(`${name} rejected`)
				}
				const onStreamError = vi.fn(boom('onStreamError'))
				const onStreamEnd = vi.fn(boom('onStreamEnd'))
				const onStreamReconnect = vi.fn(boom('onStreamReconnect'))
				await worker.streamJobs({
					...baseReq,
					onStreamError,
					onStreamEnd,
					onStreamReconnect,
				})

				created[0].emit('error', new Error('boom'))
				await vi.advanceTimersByTimeAsync(1000)
				expect(opens(grpcClient)).toBe(2)

				created[1].emit('end')
				await vi.advanceTimersByTimeAsync(2000)
				expect(opens(grpcClient)).toBe(3)

				// Let any (wrongly) unobserved rejection surface
				await vi.advanceTimersByTimeAsync(0)
				vi.useRealTimers()
				await new Promise<void>((resolve) => setImmediate(resolve))

				expect(unhandled).toEqual([])
				expect(onStreamError).toHaveBeenCalledTimes(1)
				expect(onStreamEnd).toHaveBeenCalledTimes(1)
				expect(onStreamReconnect).toHaveBeenCalledTimes(2)
				for (const name of [
					'onStreamError',
					'onStreamEnd',
					'onStreamReconnect',
				]) {
					expect(logError).toHaveBeenCalledWith(
						`Exception in ${name} callback of stream worker: ${name} rejected`
					)
				}
				await worker.close()
			} finally {
				process.off('unhandledRejection', onUnhandled)
			}
		}
	)

	unitTest('async callbacks that resolve work as sync ones do', async () => {
		const { worker, grpcClient, created } = setup()
		const logError = (
			worker as unknown as { logger: { logError: ReturnType<typeof vi.fn> } }
		).logger.logError
		const onStreamError = vi.fn(async () => {})
		const onStreamEnd = vi.fn(async () => {})
		const onStreamReconnect = vi.fn(async () => {})
		await worker.streamJobs({
			...baseReq,
			onStreamError,
			onStreamEnd,
			onStreamReconnect,
		})

		created[0].emit('error', new Error('boom'))
		await vi.advanceTimersByTimeAsync(1000)
		created[1].emit('end')
		await vi.advanceTimersByTimeAsync(2000)

		expect(opens(grpcClient)).toBe(3)
		expect(onStreamError).toHaveBeenCalledTimes(1)
		expect(onStreamEnd).toHaveBeenCalledTimes(1)
		expect(onStreamReconnect).toHaveBeenCalledTimes(2)
		expect(logError).not.toHaveBeenCalledWith(
			expect.stringContaining('callback of stream worker')
		)
		await worker.close()
	})

	describe('close() while a reconnect open is pending', () => {
		// Kill the first stream, advance to the reconnect attempt, and leave
		// that open pending until `settle` is called.
		const setupPendingReconnectOpen = async () => {
			const ctx = setup()
			const onStreamError = vi.fn()
			const onStreamReconnect = vi.fn()
			const handle = await ctx.worker.streamJobs({
				...baseReq,
				onStreamError,
				onStreamReconnect,
			})
			let settle!: (result: unknown, mode: 'resolve' | 'reject') => void
			ctx.grpcClient.streamActivatedJobsStream.mockImplementation(
				() =>
					new Promise((resolve, reject) => {
						settle = (result, mode) =>
							mode === 'resolve' ? resolve(result) : reject(result)
					})
			)
			ctx.created[0].emit('error', new Error('boom'))
			expect(onStreamError).toHaveBeenCalledTimes(1)
			await vi.advanceTimersByTimeAsync(1000)
			expect(opens(ctx.grpcClient)).toBe(2) // reconnect open is now pending
			return { ...ctx, handle, onStreamError, onStreamReconnect, settle }
		}

		const expectQuiet = async (
			ctx: Awaited<ReturnType<typeof setupPendingReconnectOpen>>
		) => {
			await vi.advanceTimersByTimeAsync(0)
			expect(ctx.onStreamError).toHaveBeenCalledTimes(1) // only the original
			expect(vi.getTimerCount()).toBe(0) // no retry scheduled
			await vi.advanceTimersByTimeAsync(120_000)
			expect(opens(ctx.grpcClient)).toBe(2)
			expect(ctx.onStreamReconnect).toHaveBeenCalledTimes(1)
			expect(ctx.onStreamError).toHaveBeenCalledTimes(1)
		}

		unitTest(
			'handle close(), then the open rejects: no onStreamError, no retry',
			async () => {
				const ctx = await setupPendingReconnectOpen()
				ctx.handle.close()
				ctx.settle(new Error('UNAVAILABLE'), 'reject')
				await expectQuiet(ctx)
			}
		)

		unitTest(
			'handle close(), then the open returns { error }: no onStreamError, no retry',
			async () => {
				const ctx = await setupPendingReconnectOpen()
				ctx.handle.close()
				ctx.settle({ error: new Error('UNAVAILABLE') }, 'resolve')
				await expectQuiet(ctx)
			}
		)

		unitTest(
			'worker close(), then the open rejects: no onStreamError, no retry',
			async () => {
				const ctx = await setupPendingReconnectOpen()
				await ctx.worker.close()
				ctx.settle(new Error('UNAVAILABLE'), 'reject')
				await expectQuiet(ctx)
			}
		)

		unitTest(
			'worker close(), then the open returns { error }: no onStreamError, no retry',
			async () => {
				const ctx = await setupPendingReconnectOpen()
				await ctx.worker.close()
				ctx.settle({ error: new Error('UNAVAILABLE') }, 'resolve')
				await expectQuiet(ctx)
			}
		)

		unitTest(
			'control: without close(), a failed reconnect open is reported and retried',
			async () => {
				const ctx = await setupPendingReconnectOpen()
				ctx.settle({ error: new Error('UNAVAILABLE') }, 'resolve')
				await vi.advanceTimersByTimeAsync(0)
				expect(ctx.onStreamError).toHaveBeenCalledTimes(2)
				expect(vi.getTimerCount()).toBe(1)
				ctx.handle.close()
			}
		)
	})

	unitTest(
		'recovery options are not passed through to the gRPC stream request',
		async () => {
			const { worker, grpcClient } = setup()
			await worker.streamJobs({
				...baseReq,
				onStreamError: vi.fn(),
				onStreamEnd: vi.fn(),
				onStreamReconnect: vi.fn(),
				streamReconnect: { initialDelayMs: 10 },
			})
			const sent = grpcClient.streamActivatedJobsStream.mock.calls[0][0]
			expect(Object.keys(sent)).toEqual(
				expect.not.arrayContaining([
					'onStreamError',
					'onStreamEnd',
					'onStreamReconnect',
					'streamReconnect',
				])
			)
			await worker.close()
		}
	)
})
