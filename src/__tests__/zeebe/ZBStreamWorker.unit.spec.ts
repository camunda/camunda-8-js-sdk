import { EventEmitter } from 'events'

import { LosslessDto } from '../../lib'
import { allowAny } from '../../test-support/testTags'
import {
	ZBStreamWorker,
	drainRetryDelayMs,
	isTransientActivationError,
} from '../../zeebe/lib/ZBStreamWorker'

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
		completeJob: vi.fn().mockResolvedValue(undefined),
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
		// Pin the reconnect jitter at the top of its range so the backoff
		// delays below are the exact exponential curve (100ms, 200ms, ...).
		streamReconnect: { random: () => 1 - Number.EPSILON },
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
		'reconnect delays are jittered across [0, cap] with the default random source',
		async () => {
			// No pinned `random`: the delay must be a random value in
			// [0, initialDelayMs], not always the cap.
			const { worker, grpcClient, created } = setup()
			await worker.streamJobs({
				...baseReq,
				streamReconnect: { initialDelayMs: 1000, maxDelayMs: 8000 },
			})
			created[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(999)
			// The jittered delay may or may not have elapsed yet…
			await vi.advanceTimersByTimeAsync(1)
			// …but by 1000ms (the cap) it always has.
			expect(opens(grpcClient)).toBe(2)
			await worker.close()
		}
	)

	unitTest(
		'a deterministic random source gives deterministic reconnect delays',
		async () => {
			const { worker, grpcClient } = setup(
				Array.from({ length: 6 }, () => ({ error: new Error('down') }))
			)
			// A scripted random source: delays are floor(r * (cap + 1)) with caps
			// 100, 200, 400, 500, 500 → 50, 100, 200, 250, 250.
			const random = vi.fn(() => 0.5)
			await worker.streamJobs({
				...baseReq,
				streamReconnect: { initialDelayMs: 100, maxDelayMs: 500, random },
			})
			expect(opens(grpcClient)).toBe(1)

			for (const [i, delay] of [50, 100, 200, 250, 250].entries()) {
				await vi.advanceTimersByTimeAsync(delay - 1)
				expect(opens(grpcClient)).toBe(i + 1)
				await vi.advanceTimersByTimeAsync(1)
				expect(opens(grpcClient)).toBe(i + 2)
			}
			expect(random).toHaveBeenCalled()
			await worker.close()
		}
	)

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
				streamReconnect: {
					initialDelayMs: 100,
					maxDelayMs: 500,
					random: () => 1 - Number.EPSILON,
				},
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
				streamReconnect: {
					initialDelayMs: 100,
					maxDelayMs: 10_000,
					random: () => 1 - Number.EPSILON,
				},
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
				streamReconnect: {
					initialDelayMs: 100,
					maxDelayMs: 10_000,
					random: () => 1 - Number.EPSILON,
				},
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
				streamReconnect: {
					initialDelayMs: 100,
					maxDelayMs: 1000,
					random: () => 1 - Number.EPSILON,
				},
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
				streamReconnect: {
					initialDelayMs: 10,
					random: () => 1 - Number.EPSILON,
				},
				backlogRetry: { minDelayMs: 10 },
			})
			const sent = grpcClient.streamActivatedJobsStream.mock.calls[0][0]
			expect(Object.keys(sent)).toEqual(
				expect.not.arrayContaining([
					'onStreamError',
					'onStreamEnd',
					'onStreamReconnect',
					'streamReconnect',
					'backlogRetry',
				])
			)
			await worker.close()
		}
	)
})

/**
 * The stream only pushes jobs that become activatable after it opens. Jobs
 * that already exist (a backlog) are picked up by the poll. A poll that
 * returns a full batch means more jobs are probably waiting, so the worker
 * must poll again as soon as that batch is handled — not wait a whole
 * `pollInterval` (30 s by default) per batch. Otherwise a backlog drains at
 * only `pollMaxJobsToActivate` jobs per `pollInterval`.
 */
const fakeJob = (key: number) => ({
	key: String(key),
	type: 'test-task',
	processInstanceKey: '1',
	bpmnProcessId: 'p',
	processDefinitionVersion: 1,
	processDefinitionKey: '1',
	elementId: 'e',
	elementInstanceKey: '1',
	customHeaders: {},
	worker: 'test-worker',
	retries: 3,
	deadline: '0',
	variables: {},
	tenantId: '<default>',
})

const fakeBatch = (size: number, offset: number) =>
	Array.from({ length: size }, (_, i) => fakeJob(offset + i))

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker drains a backlog without waiting a pollInterval per full batch',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			// Two full batches of 3, then a partial batch, then nothing.
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockResolvedValueOnce(fakeBatch(3, 3))
				.mockResolvedValueOnce(fakeBatch(1, 6))
				.mockResolvedValue([])
			const handled: string[] = []

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					handled.push(job.key)
					return job.complete()
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
			})

			// Let the background drain run, without advancing the sidecar timer.
			await vi.advanceTimersByTimeAsync(0)

			// Full batches trigger an immediate re-poll; the partial batch ends the drain.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)
			expect(handled).toHaveLength(7)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker waits for a batch to be handled before polling again',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(2, 0))
				.mockResolvedValue([])
			const pending: Array<() => void> = []

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				// Handlers stay in flight until the test releases them.
				taskHandler: (job) =>
					new Promise((resolve) => {
						pending.push(() => resolve(job.complete()))
					}),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 30000,
			})

			await vi.advanceTimersByTimeAsync(0)
			// The full batch is still being handled: no second poll yet.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pending).toHaveLength(2)

			pending.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker stops draining the backlog when the stream handle is closed',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			// Full batches forever: only the handle close may stop the drain.
			zbClient.activateJobs.mockImplementation(() =>
				Promise.resolve(fakeBatch(2, 0))
			)
			const pending: Array<() => void> = []

			const handle = await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				// Handlers stay in flight until the test releases them.
				taskHandler: (job) =>
					new Promise((resolve) => {
						pending.push(() => resolve(job.complete()))
					}),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 30000,
			})

			await vi.advanceTimersByTimeAsync(0)
			// The first full batch is in flight; the drain is waiting on it.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pending).toHaveLength(2)

			// Close the handle while the full batch is still being handled, then
			// release the handlers: the drain must stop instead of polling again.
			handle.close()
			pending.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Regression tests for the drain/reconnect single-flight guarantee.
 *
 * The drain flag used to be set only when a poll response arrived, so a
 * reconnect backfill that landed while a sidecar activation was still pending
 * started a second activation, and both responses launched independent drains
 * — exceeding the one-polled-batch limit and letting either drain clear the
 * flag while the other was still running. The flag is now reserved *before*
 * the activation call in both entry paths.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker runs no overlapping drains when a reconnect lands during a pending activation',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})

			// The sidecar activation stays pending until the test releases it.
			let releaseSidecar: (jobs: unknown[]) => void = () => {}
			zbClient.activateJobs
				.mockResolvedValueOnce([]) // initial backfill
				.mockImplementationOnce(
					() =>
						new Promise((resolve) => {
							releaseSidecar = resolve
						})
				)
				.mockResolvedValue([]) // reconnect backfill + anything later

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
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1) // initial backfill

			// Fire the sidecar poll: its activation is now pending (unresolved).
			await vi.advanceTimersByTimeAsync(1000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// The stream dies and reconnects while the sidecar activation is
			// still pending. The reconnect backfill must not start a second
			// activation: it is deferred to the pending activation's drain.
			createdStreams[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000) // reconnect delay
			expect(grpcClient.streamActivatedJobsStream).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// Release the sidecar activation. Its drain honours the deferred
			// backfill: exactly one more activation, and no concurrent drains.
			releaseSidecar([])
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * A reconnect backfill that arrived while a drain was still awaiting a
 * partial batch's handlers used to be dropped: once the handlers settled, the
 * drain exited without polling for jobs created while the stream was down.
 * With recurring polling disabled (pollInterval 0 or -1) those jobs were
 * stranded indefinitely. The in-flight drain now runs the deferred backfill
 * before exiting.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker preserves a reconnect backfill while a partial batch is still draining',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})

			// Initial backfill: a partial batch (1 < pollMaxJobsToActivate 2)
			// whose handler stays in flight until the test releases it.
			const pending: Array<() => void> = []
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(1, 0))
				.mockResolvedValueOnce(fakeBatch(1, 1)) // the deferred backfill
				.mockResolvedValue([])

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) =>
					new Promise((resolve) => {
						pending.push(() => resolve(job.complete()))
					}),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 0, // recurring polling disabled: no sidecar safety net
			})
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pending).toHaveLength(1)

			// The stream dies and reconnects while the partial batch's handler is
			// still in flight. The backfill must not be dropped.
			createdStreams[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000) // reconnect delay
			expect(grpcClient.streamActivatedJobsStream).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(0)
			// Still draining the partial batch: the backfill is deferred, not run.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			// Release the handler: the drain runs the deferred backfill before
			// exiting, even though the batch was partial.
			pending.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * A taskHandler that throws *synchronously* used to escape handleJob before
 * Promise.resolve could catch it: jobs.map(handleJob) aborted at the throwing
 * job, later jobs in the batch were never dispatched, and the drain released
 * its reservation without awaiting the handlers already started — allowing
 * the next polled batch to overlap them. The handler is now invoked inside a
 * promise continuation, so a synchronous throw rejects that job's promise and
 * is logged, while the rest of the batch is dispatched and awaited.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker dispatches the whole batch when a handler throws synchronously',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			// One full batch (2 == pollMaxJobsToActivate), then nothing.
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(2, 0))
				.mockResolvedValue([])

			// The first job's handler stays pending until the test releases it;
			// the second job's handler throws synchronously.
			let releaseFirst: () => void = () => {}
			const handled: string[] = []
			const taskHandler = vi.fn(
				(job: { key: string; complete: () => void }) => {
					handled.push(job.key)
					if (job.key === '0') {
						return new Promise<void>((resolve) => {
							releaseFirst = () => {
								job.complete()
								resolve()
							}
						})
					}
					throw new Error('sync boom')
				}
			)

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				taskHandler: taskHandler as any,
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 1000,
			})
			await vi.advanceTimersByTimeAsync(0)

			// Both jobs were dispatched: the synchronous throw on job 1 did not
			// abort the map before job 0's handler started, nor skip job 1.
			expect(taskHandler).toHaveBeenCalledTimes(2)
			expect(handled).toEqual(['0', '1'])

			// The drain is still awaiting the pending first handler: the full
			// batch has not triggered the follow-up poll yet (backpressure).
			await vi.advanceTimersByTimeAsync(1000)
			const callsBeforeRelease = zbClient.activateJobs.mock.calls.length

			// Release the pending handler. The drain now finishes the batch and
			// polls again (the batch was full); the next batch is empty.
			releaseFirst()
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs.mock.calls.length).toBeGreaterThan(
				callsBeforeRelease
			)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * A reconnect backfill deferred while a drain's activation was pending used
 * to be discarded by runDrain's finally when that activation rejected — even
 * though the handle was still open. With recurring polling disabled
 * (pollInterval 0 or -1) jobs created during the outage were stranded
 * indefinitely. The finally now re-runs the deferred backfill after releasing
 * the reservation, unless the handle is closed.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker re-runs a deferred backfill when the in-flight activation fails',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})

			// Initial backfill: a partial batch whose handler stays in flight
			// until the test releases it. The drain's follow-up activation then
			// rejects, and the re-run backfill must still poll.
			const pending: Array<() => void> = []
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(1, 0)) // initial backfill (partial)
				.mockRejectedValueOnce(new Error('activation failed')) // drain re-poll
				.mockResolvedValueOnce(fakeBatch(1, 1)) // the re-run backfill
				.mockResolvedValue([])

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) =>
					new Promise((resolve) => {
						pending.push(() => resolve(job.complete()))
					}),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 0, // recurring polling disabled: no sidecar safety net
			})
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pending).toHaveLength(1)

			// The stream dies and reconnects while the partial batch's handler is
			// still in flight: the backfill is deferred to the in-flight drain.
			createdStreams[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000) // reconnect delay
			expect(grpcClient.streamActivatedJobsStream).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			// Release the handler: the drain honours the deferred backfill, but
			// that activation rejects. The deferred backfill must not be dropped
			// — the handle is still open, so it is re-run after the reservation
			// is released.
			pending.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * With backlogRetry: false, a failed deferred backfill must not be re-run
 * immediately by runDrain's finally: the caller opted out of retrying failed
 * backlog activations, so recovery is left to the next sidecar poll.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker with backlogRetry: false does not re-run a failed deferred backfill',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})

			const pending: Array<() => void> = []
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(1, 0)) // initial backfill (partial)
				.mockRejectedValueOnce(new Error('activation failed')) // deferred backfill
				.mockResolvedValue([])

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) =>
					new Promise((resolve) => {
						pending.push(() => resolve(job.complete()))
					}),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 60_000,
				backlogRetry: false,
			})
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			createdStreams[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000) // reconnect delay
			expect(grpcClient.streamActivatedJobsStream).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			// Release the handler: the deferred backfill runs and fails. It is
			// not re-run immediately; the sidecar poll recovers it later.
			pending.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(1000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			await vi.advanceTimersByTimeAsync(60_000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Regression tests for https://github.com/camunda/camunda-8-js-sdk/issues/882
 *
 * A temporary activation failure (e.g. RESOURCE_EXHAUSTED under broker
 * backpressure) abandoned the backlog drain until the next sidecar poll, a
 * whole pollInterval (30s by default) later. It is now retried with a short
 * exponential backoff while the handle is open.
 */
const resourceExhausted = () =>
	Object.assign(
		new Error(
			"8 RESOURCE_EXHAUSTED: Expected to activate jobs of type 'test-task', but no jobs available and at least one broker returned 'RESOURCE_EXHAUSTED'. Please try again later."
		),
		{ code: 8 }
	)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker retries a backlog activation that fails with RESOURCE_EXHAUSTED',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockRejectedValueOnce(resourceExhausted())
				.mockRejectedValueOnce(resourceExhausted())
				.mockResolvedValueOnce(fakeBatch(1, 3))
				.mockResolvedValue([])
			const handled: string[] = []

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					handled.push(job.key)
					return job.complete()
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
				// Pin the retry jitter at the top of its range: the delays are
				// then the exact base curve, 50ms then 80ms.
				backlogRetry: { random: () => 1 - Number.EPSILON },
			})

			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
			// Well under a pollInterval: 50ms then 80ms backoff.
			await vi.advanceTimersByTimeAsync(200)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(4)
			expect(handled).toHaveLength(4)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker does not retry a non-transient backlog activation failure',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockRejectedValueOnce(
					Object.assign(new Error('3 INVALID_ARGUMENT: bad'), { code: 3 })
				)
				.mockResolvedValue([])

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
			})

			await vi.advanceTimersByTimeAsync(10_000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker with backlogRetry: false does not retry a transient backlog activation failure',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockRejectedValueOnce(resourceExhausted())
				.mockResolvedValue([])

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
				backlogRetry: false,
			})

			// The transient failure ends the drain; only the next sidecar poll
			// (30s later) picks the backlog up again.
			await vi.advanceTimersByTimeAsync(10_000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(20_000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker follows the configured backlogRetry options',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockRejectedValueOnce(resourceExhausted())
				.mockRejectedValueOnce(resourceExhausted())
				.mockResolvedValueOnce(fakeBatch(1, 3))
				.mockResolvedValue([])

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
				// A slower, wider policy: 1s, doubling, no jitter.
				backlogRetry: {
					minDelayMs: 1000,
					maxDelayMs: 10_000,
					factor: 2,
					jitter: 0,
				},
			})

			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
			// First retry after exactly 1000ms — not the default ~50ms.
			await vi.advanceTimersByTimeAsync(999)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
			await vi.advanceTimersByTimeAsync(1)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)
			// Second retry after exactly 2000ms.
			await vi.advanceTimersByTimeAsync(1999)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)
			await vi.advanceTimersByTimeAsync(1)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(4)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker jitters backlog retries across [0, cap] with an injected random source',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockRejectedValueOnce(resourceExhausted())
				.mockResolvedValueOnce(fakeBatch(1, 3))
				.mockResolvedValue([])

			// Pinned at the bottom of the full-jitter range: the retry fires
			// immediately rather than after the 50ms base delay.
			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
				backlogRetry: { random: () => 0 },
			})

			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker stops retrying a backlog activation when the handle is closed',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockRejectedValue(resourceExhausted())

			const handle = await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 0,
			})

			await vi.advanceTimersByTimeAsync(1_000)
			const calls = zbClient.activateJobs.mock.calls.length
			expect(calls).toBeGreaterThan(2)
			handle.close()
			// The pending backoff timer must be cancelled immediately on close,
			// not left to expire naturally (it would keep the process alive).
			await vi.advanceTimersByTimeAsync(0)
			expect(vi.getTimerCount()).toBe(0)
			await vi.advanceTimersByTimeAsync(60_000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(calls)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'drainRetryDelayMs follows the Java backoff curve with full jitter by default',
	() => {
		// A deterministic random source gives deterministic delays: pinned at
		// the top of the full-jitter range, the delay is the exact base curve.
		const max = { random: () => 1 - Number.EPSILON }
		expect(drainRetryDelayMs(1, max)).toBe(50)
		expect(drainRetryDelayMs(2, max)).toBe(80)
		expect(drainRetryDelayMs(100, max)).toBe(5000)
		// Pinned at the bottom, the delay is 0: full jitter spreads retries
		// across the whole [0, cap] window.
		expect(drainRetryDelayMs(1, { random: () => 0 })).toBe(0)
		expect(drainRetryDelayMs(100, { random: () => 0 })).toBe(0)
		// jitter: 0.1 restores the Java client's ±10% band.
		expect(drainRetryDelayMs(1, { jitter: 0.1, random: () => 0.5 })).toBe(50)
		expect(drainRetryDelayMs(2, { jitter: 0.1, random: () => 0.5 })).toBe(80)
		expect(drainRetryDelayMs(100, { jitter: 0.1, random: () => 0.5 })).toBe(
			5000
		)
		expect(drainRetryDelayMs(100, { jitter: 0.1, random: () => 1 })).toBe(5500)
		// jitter: 0 is the plain exponential curve.
		expect(drainRetryDelayMs(2, { jitter: 0, random: () => 0 })).toBe(80)
		// The curve itself is configurable.
		expect(
			drainRetryDelayMs(3, {
				minDelayMs: 100,
				maxDelayMs: 1000,
				factor: 2,
				random: () => 1 - Number.EPSILON,
			})
		).toBe(400)
		expect(
			drainRetryDelayMs(100, {
				minDelayMs: 100,
				maxDelayMs: 1000,
				factor: 2,
				random: () => 1 - Number.EPSILON,
			})
		).toBe(1000)
		expect(isTransientActivationError(resourceExhausted())).toBe(true)
		expect(isTransientActivationError(new Error('14 UNAVAILABLE: x'))).toBe(
			true
		)
		expect(isTransientActivationError(new Error('boom'))).toBe(false)
		// A numeric code is authoritative over the message text
		const denied = Object.assign(
			new Error(
				"7 PERMISSION_DENIED: not authorized for job type 'UNAVAILABLE'"
			),
			{ code: 7 }
		)
		expect(isTransientActivationError(denied)).toBe(false)
		// Without a code, only the leading status prefix counts
		expect(
			isTransientActivationError(
				new Error("7 PERMISSION_DENIED: job type 'DEADLINE_EXCEEDED'")
			)
		).toBe(false)
		expect(
			isTransientActivationError(new Error('8 RESOURCE_EXHAUSTED: busy'))
		).toBe(true)
	}
)

/**
 * Regression tests for the backfill retry gap.
 *
 * `backfill()` called `activate()` directly, so the first activation of the
 * initial backfill and of a reconnect backfill bypassed `backlogRetry` — a
 * transient failure (RESOURCE_EXHAUSTED, UNAVAILABLE, DEADLINE_EXCEEDED)
 * rejected `streamJobs()` startup, or abandoned the reconnect backfill and
 * stranded jobs created while the stream was down when recurring polling was
 * disabled. The first activation now goes through `activateWithRetry()`.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker retries a transient failure on the first startup backfill activation',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockRejectedValueOnce(resourceExhausted()) // first startup activation
				.mockRejectedValueOnce(resourceExhausted()) // first retry
				.mockResolvedValue([])

			// streamJobs awaits the backfill's first activation, which now
			// retries through activateWithRetry — and that retry waits on a
			// (fake) timer. Start it without awaiting so the retry timers can
			// be advanced, then await the startup once it has recovered.
			const started = worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollInterval: 0,
				// Pin the retry jitter at the top of its range: the delays are
				// then the exact base curve, 50ms then 80ms.
				backlogRetry: { random: () => 1 - Number.EPSILON },
			})
			// Attach a no-op catch immediately so a rejection is never
			// unhandled if the test fails before awaiting `started`.
			started.catch(() => {})

			// Let the stream open and the first activation fail transiently.
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			// 50ms backoff, then the first retry (also fails transiently).
			await vi.advanceTimersByTimeAsync(50)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
			// 80ms backoff, then the second retry (which succeeds): startup
			// recovers rather than rejecting.
			await vi.advanceTimersByTimeAsync(80)
			await started
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker retries a transient failure on the reconnect backfill activation',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})
			zbClient.activateJobs
				.mockResolvedValueOnce([]) // initial backfill
				.mockRejectedValueOnce(resourceExhausted()) // reconnect backfill
				.mockResolvedValue([]) // reconnect backfill retry + anything later

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
				// Disable the sidecar poll so only backfill polls are counted: a
				// stranded reconnect backfill would leave these jobs unreachable.
				pollInterval: 0,
				// Pin the reconnect jitter at the top of its range so the
				// reconnect delay is the exact 1000ms initial backoff.
				streamReconnect: { random: () => 1 - Number.EPSILON },
				// Pin the retry jitter at the top of its range: the reconnect
				// backfill retry delay is then the exact 50ms base.
				backlogRetry: { random: () => 1 - Number.EPSILON },
			})
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1) // initial backfill

			// The stream dies and is re-opened after the 1000ms reconnect backoff.
			createdStreams[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000)
			expect(grpcClient.streamActivatedJobsStream).toHaveBeenCalledTimes(2)
			// The reconnect backfill's first activation fails transiently.
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// It must be retried after the 50ms backoff rather than abandoned.
			await vi.advanceTimersByTimeAsync(50)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Regression tests for https://github.com/camunda/camunda-8-js-sdk/issues/891
 *
 * The backlog drain waited for every handler in a polled batch to settle
 * before activating again, so the slowest job set the pace for the whole
 * batch. The worker now tracks jobs in flight against `maxJobsActive` and
 * activates more as soon as fewer than 30% of that capacity is in use, like
 * the Java client's JobWorkerImpl.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker activates more jobs before a slow job in the batch finishes',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(10, 0))
				.mockResolvedValueOnce(fakeBatch(5, 10))
				.mockResolvedValue([])
			let releaseSlow: () => void = () => {}
			const handled: string[] = []

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					handled.push(job.key)
					if (job.key === '0') {
						// The slow job: stays in flight until released.
						return new Promise((resolve) => {
							releaseSlow = () => resolve(job.complete())
						})
					}
					return job.complete()
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 10,
				pollInterval: 30000,
			})
			await vi.advanceTimersByTimeAsync(0)

			// The slow job is still in flight, yet the next activation already
			// ran — as soon as fewer than 30% of the capacity was in use — and
			// asked only for the free capacity.
			expect(zbClient.activateJobs.mock.calls.length).toBeGreaterThanOrEqual(2)
			const second = zbClient.activateJobs.mock.calls[1][0].maxJobsToActivate
			expect(second).toBeGreaterThanOrEqual(8)
			expect(second).toBeLessThan(10)
			expect(handled).toHaveLength(15)

			releaseSlow()
			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker never holds more polled jobs in flight than maxJobsActive',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			let offset = 0
			// An endless backlog: every poll is filled to the requested size.
			zbClient.activateJobs.mockImplementation(
				async ({ maxJobsToActivate }: { maxJobsToActivate: number }) => {
					const batch = fakeBatch(maxJobsToActivate, offset)
					offset += maxJobsToActivate
					return batch
				}
			)
			let inFlight = 0
			let maxSeen = 0
			const handle = await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: async (job) => {
					inFlight++
					maxSeen = Math.max(maxSeen, inFlight)
					// Varying handler durations.
					await new Promise((r) => setTimeout(r, (Number(job.key) % 7) * 10))
					inFlight--
					return job.complete()
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 8,
				maxJobsActive: 12,
				pollInterval: 30000,
			})

			await vi.advanceTimersByTimeAsync(2_000)
			expect(offset).toBeGreaterThan(100)
			expect(maxSeen).toBeLessThanOrEqual(12)
			for (const [req] of zbClient.activateJobs.mock.calls) {
				expect(req.maxJobsToActivate).toBeGreaterThan(0)
				expect(req.maxJobsToActivate).toBeLessThanOrEqual(8)
			}

			handle.close()
			const calls = zbClient.activateJobs.mock.calls.length
			await vi.advanceTimersByTimeAsync(2_000)
			// Nothing is activated after close.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(calls)
			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Regression tests for PR #894 review: backlog / backfill signals must not be
 * lost when recurring polling is disabled (pollInterval 0).
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker keeps the backlog when stream jobs fill capacity during a retry wait',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(2, 0)) // full: backlog pending
				.mockRejectedValueOnce(resourceExhausted()) // retried after a wait
				.mockResolvedValueOnce(fakeBatch(1, 2)) // resumed backlog poll
				.mockResolvedValue([])
			const held: Array<() => void> = []
			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) =>
					Number(job.key) >= 100
						? new Promise((resolve) => {
								held.push(() => resolve(job.complete()))
							})
						: job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				maxJobsActive: 2,
				pollInterval: 0,
				backlogRetry: { random: () => 1 - Number.EPSILON },
			})
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// During the retry wait, stream jobs arrive. No request is on the
			// wire, so they start in the idle slots and the retry finds no
			// free capacity.
			for (const key of ['100', '101']) {
				createdStreams[0].emit('data', {
					key,
					retries: 3,
					variables: '{}',
					customHeaders: '{}',
				})
			}
			await vi.advanceTimersByTimeAsync(0)
			expect(held).toHaveLength(2)
			// The retry wait elapses with no free capacity: no request is
			// sent, and the backlog signal is kept.
			await vi.advanceTimersByTimeAsync(2000)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// Capacity frees up: the backlog poll resumes.
			held.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)
			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker services a backfill deferred behind a failed backlog activation',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})
			let rejectPoll: (e: Error) => void = () => {}
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(2, 0)) // full: backlog pending
				.mockImplementationOnce(
					() =>
						new Promise((_, reject) => {
							rejectPoll = reject
						})
				) // backlog poll, rejected later
				.mockResolvedValueOnce(fakeBatch(1, 2)) // the deferred backfill
				.mockResolvedValue([])
			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => job.complete(),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 0,
			})
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// Reconnect while the backlog poll is pending: backfill deferred.
			createdStreams[0].emit('error', new Error('boom'))
			await vi.advanceTimersByTimeAsync(1000)
			expect(grpcClient.streamActivatedJobsStream).toHaveBeenCalledTimes(2)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// The backlog poll fails non-transiently: the deferred backfill runs.
			rejectPoll(new Error('activation failed'))
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)
			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Regression test for PR #894 review: both delivery paths must share the
 * `maxJobsActive` limit. A poll can request up to the free capacity, then
 * stream jobs can arrive before the activation response lands; dispatching
 * both started more concurrent handlers than `maxJobsActive`. Stream jobs
 * are now buffered while the worker is at capacity — including the capacity
 * an in-flight activation will consume — and started as handlers settle.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker buffers stream jobs that arrive during a pending activation',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})
			let resolvePoll: (jobs: Array<{ key: string }>) => void = () => {}
			zbClient.activateJobs.mockImplementationOnce(
				() =>
					new Promise((resolve) => {
						resolvePoll = resolve as typeof resolvePoll
					})
			)
			let inFlight = 0
			let maxSeen = 0
			const held: Array<() => void> = []
			// Not awaited yet: streamJobs() awaits the initial backfill
			// activation, which this test keeps pending until below.
			const handlePromise = worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					inFlight++
					maxSeen = Math.max(maxSeen, inFlight)
					return new Promise((resolve) => {
						held.push(() => {
							inFlight--
							resolve(job.complete())
						})
					})
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				maxJobsActive: 2,
				pollInterval: 0,
			})
			await vi.advanceTimersByTimeAsync(0)
			// The initial backfill poll is in flight; it will ask for 2 jobs.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)

			// Two stream jobs arrive before the activation response lands.
			// With the activation's capacity already spoken for, both are
			// buffered instead of starting handlers past the limit.
			for (const key of ['100', '101']) {
				createdStreams[0].emit('data', {
					key,
					retries: 3,
					variables: '{}',
					customHeaders: '{}',
				})
			}
			await vi.advanceTimersByTimeAsync(0)
			expect(held).toHaveLength(0)

			// The activation returns the 2 jobs it asked for. Old code ran 4
			// handlers concurrently here (2 polled + 2 streamed); now the
			// streamed jobs stay buffered at capacity.
			resolvePoll(fakeBatch(2, 0))
			await vi.advanceTimersByTimeAsync(0)
			// Fail fast on the old code instead of hanging on held handlers.
			expect(maxSeen).toBeLessThanOrEqual(2)
			expect(held).toHaveLength(2)
			expect(maxSeen).toBe(2)

			// Buffered stream jobs start as handlers settle — the limit holds.
			held.splice(0, 1)[0]()
			await vi.advanceTimersByTimeAsync(0)
			expect(held).toHaveLength(2)
			expect(maxSeen).toBe(2)
			held.splice(0).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(maxSeen).toBeLessThanOrEqual(2)
			await handlePromise
			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Round-4 review findings on the stream buffer: it must be bounded by
 * transport backpressure, a closed handle must not start buffered or polled
 * handlers, and a rejected activation must not strand buffered jobs.
 */
const setupBufferedWorker = async (
	activation: () => Promise<Array<{ key: string }>>
) => {
	vi.useFakeTimers()
	const createdStreams: Array<
		ReturnType<typeof createMockStream> & {
			pause: ReturnType<typeof vi.fn>
			resume: ReturnType<typeof vi.fn>
		}
	> = []
	const { worker, grpcClient, zbClient } = createWorker()
	grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
		const s = Object.assign(createMockStream(), {
			pause: vi.fn(),
			resume: vi.fn(),
		})
		createdStreams.push(s)
		return s
	})
	zbClient.activateJobs.mockImplementationOnce(activation)
	const started: string[] = []
	const held: Array<() => void> = []
	const handlePromise = worker.streamJobs({
		type: 'test-task',
		worker: 'test-worker',
		timeout: 30000,
		tenantIds: ['<default>'],
		taskHandler: (job) => {
			started.push(job.key)
			return new Promise((resolve) => {
				held.push(() => resolve(job.complete()))
			})
		},
		inputVariableDto: LosslessDto,
		customHeadersDto: LosslessDto,
		pollMaxJobsToActivate: 2,
		maxJobsActive: 2,
		pollInterval: 0,
	})
	// Swallow here; tests that care await it explicitly.
	handlePromise.catch(() => {})
	await vi.advanceTimersByTimeAsync(0)
	const emit = (key: string) =>
		createdStreams[0].emit('data', {
			key,
			retries: 3,
			variables: '{}',
			customHeaders: '{}',
		})
	return {
		worker,
		zbClient,
		createdStreams,
		started,
		held,
		handlePromise,
		emit,
	}
}

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker pauses the stream while the buffer is full and resumes as it drains',
	async () => {
		try {
			let resolvePoll: (jobs: Array<{ key: string }>) => void = () => {}
			const ctx = await setupBufferedWorker(
				() =>
					new Promise((resolve) => {
						resolvePoll = resolve
					})
			)
			ctx.emit('100')
			expect(ctx.createdStreams[0].pause).not.toHaveBeenCalled()
			ctx.emit('101')
			// Buffer reached maxJobsActive: transport backpressure kicks in.
			expect(ctx.createdStreams[0].pause).toHaveBeenCalledTimes(1)
			resolvePoll([])
			await vi.advanceTimersByTimeAsync(0)
			// Empty activation: buffered jobs start, the stream resumes.
			expect(ctx.started).toEqual(['100', '101'])
			expect(ctx.createdStreams[0].resume).toHaveBeenCalledTimes(1)
			ctx.held.splice(0).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			await ctx.worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker starts no handlers when closed while an activation is pending',
	async () => {
		try {
			let resolvePoll: (jobs: Array<{ key: string }>) => void = () => {}
			const ctx = await setupBufferedWorker(
				() =>
					new Promise((resolve) => {
						resolvePoll = resolve
					})
			)
			ctx.emit('100')
			const closing = ctx.worker.close()
			resolvePoll(fakeBatch(2, 0))
			await vi.advanceTimersByTimeAsync(0)
			await closing
			expect(ctx.started).toEqual([])
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker starts buffered stream jobs when the activation rejects',
	async () => {
		try {
			let rejectPoll: (e: Error) => void = () => {}
			const ctx = await setupBufferedWorker(
				() =>
					new Promise((_, reject) => {
						rejectPoll = reject
					})
			)
			ctx.emit('100')
			expect(ctx.started).toEqual([])
			rejectPoll(new Error('INVALID_ARGUMENT: nope'))
			await vi.advanceTimersByTimeAsync(0)
			expect(ctx.started).toEqual(['100'])
			ctx.held.splice(0).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			await ctx.worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Round-5 review finding: a handler settling while a poll is pending must not
 * start buffered stream jobs in the slots reserved for that poll, or the
 * worker exceeds `maxJobsActive` when the poll returns.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker does not drain buffered jobs into slots reserved by a pending poll',
	async () => {
		vi.useFakeTimers()
		try {
			const createdStreams: Array<ReturnType<typeof createMockStream>> = []
			const { worker, grpcClient, zbClient } = createWorker()
			grpcClient.streamActivatedJobsStream.mockImplementation(async () => {
				const s = createMockStream()
				createdStreams.push(s)
				return s
			})
			let resolvePoll: (jobs: Array<{ key: string }>) => void = () => {}
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(10, 0)) // full: backlog pending
				.mockImplementationOnce(
					() =>
						new Promise((resolve) => {
							resolvePoll = resolve as typeof resolvePoll
						})
				) // backlog poll, held pending
				.mockResolvedValue([])
			let inFlight = 0
			let maxSeen = 0
			const held: Array<() => void> = []
			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					inFlight++
					maxSeen = Math.max(maxSeen, inFlight)
					return new Promise((resolve) => {
						held.push(() => {
							inFlight--
							resolve(job.complete())
						})
					})
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 10,
				maxJobsActive: 10,
				pollInterval: 0,
			})
			await vi.advanceTimersByTimeAsync(0)
			expect(held).toHaveLength(10)

			// Settle 8 handlers: below the threshold, the backlog poll asks for 8.
			held.splice(0, 8).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			// Stream jobs arrive during the pending poll: buffered.
			for (const key of ['100', '101']) {
				createdStreams[0].emit('data', {
					key,
					retries: 3,
					variables: '{}',
					customHeaders: '{}',
				})
			}
			await vi.advanceTimersByTimeAsync(0)
			// A handler settles while the poll is still pending: the buffered
			// jobs must stay buffered, the freed slot belongs to the poll.
			held.splice(0, 1)[0]()
			await vi.advanceTimersByTimeAsync(0)
			expect(inFlight).toBe(1)

			resolvePoll(fakeBatch(8, 10))
			await vi.advanceTimersByTimeAsync(0)
			expect(maxSeen).toBeLessThanOrEqual(10)
			held.splice(0).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			held.splice(0).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(maxSeen).toBeLessThanOrEqual(10)
			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * Round-6 review findings: the capacity reservation must not be held during
 * a poll's retry backoff (buffered jobs would idle beside free slots), and
 * buffered stream jobs whose activation deadline passed must not be started.
 */
test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker starts buffered stream jobs during a poll retry backoff',
	async () => {
		try {
			let rejectPoll: (e: Error) => void = () => {}
			const ctx = await setupBufferedWorker(
				() =>
					new Promise((_, reject) => {
						rejectPoll = reject
					})
			)
			ctx.zbClient.activateJobs.mockImplementation(() => new Promise(() => {}))
			ctx.emit('100')
			expect(ctx.started).toEqual([])
			rejectPoll(resourceExhausted())
			await vi.advanceTimersByTimeAsync(0)
			// No request on the wire: the buffered job uses the idle slot.
			expect(ctx.started).toEqual(['100'])
			const callsBefore = ctx.zbClient.activateJobs.mock.calls.length
			await vi.advanceTimersByTimeAsync(10_000)
			// The retry recalculates the free capacity (1 of 2 in flight).
			const retry = ctx.zbClient.activateJobs.mock.calls[callsBefore]
			expect(retry?.[0].maxJobsToActivate).toBe(1)
			await ctx.worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker discards buffered stream jobs whose deadline has passed',
	async () => {
		try {
			let resolvePoll: (jobs: Array<{ key: string }>) => void = () => {}
			const ctx = await setupBufferedWorker(
				() =>
					new Promise((resolve) => {
						resolvePoll = resolve
					})
			)
			ctx.zbClient.activateJobs.mockResolvedValue([])
			ctx.createdStreams[0].emit('data', {
				key: '100',
				retries: 3,
				deadline: String(Date.now() + 1000),
				variables: '{}',
				customHeaders: '{}',
			})
			ctx.createdStreams[0].emit('data', {
				key: '101',
				retries: 3,
				deadline: String(Date.now() + 60_000),
				variables: '{}',
				customHeaders: '{}',
			})
			const callsBefore = ctx.zbClient.activateJobs.mock.calls.length
			await vi.advanceTimersByTimeAsync(2000)
			resolvePoll([])
			await vi.advanceTimersByTimeAsync(0)
			// The expired job is dropped; the live one starts.
			expect(ctx.started).toEqual(['101'])
			// A fresh backlog poll is arranged for the discarded job once
			// capacity frees up.
			ctx.held.splice(0).forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(ctx.zbClient.activateJobs.mock.calls.length).toBeGreaterThan(
				callsBefore
			)
			await ctx.worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)
