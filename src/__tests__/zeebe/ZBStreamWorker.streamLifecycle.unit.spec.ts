import { LosslessDto } from '../../lib'
import { allowAny } from '../../test-support/testTags'
import { StatefulLogInterceptor } from '../../zeebe/lib/StatefulLogInterceptor'
import {
	DEFAULT_STREAM_INACTIVITY_TIMEOUT_MS,
	DEFAULT_STREAM_TIMEOUT_MS,
	ZBStreamWorker,
	resolveStreamDeadline,
	streamDeadlineMs,
} from '../../zeebe/lib/ZBStreamWorker'
import { ZBGrpc } from '../../zeebe/lib/interfaces-1.0'
import { ZeebeGrpcClient } from '../../zeebe'

import { FakeStreamTransport } from './conformance/FakeStreamTransport'

/**
 * The stream-lifecycle safeguards of ZBStreamWorker: the max stream lifetime
 * (`streamTimeout`, default 8 h) and the inactivity watchdog
 * (`streamInactivityTimeout`, default 10 min), both jittered, both
 * configurable and both disableable — parity with the Camunda Java client's
 * `JobWorkerBuilderImpl` (camunda/camunda-8-js-sdk#900).
 */

// Deterministic reconnect backoff: a recycled or watchdog-cancelled stream is
// re-opened after exactly `initialDelayMs`.
const BACKOFF = {
	initialDelayMs: 1_000,
	maxDelayMs: 8_000,
	random: () => 1 - Number.EPSILON,
}

// Deterministic deadline jitter, pinned at the top of the range: the jittered
// deadline is exactly the configured value.
const NO_JITTER = () => 1 - Number.EPSILON

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
			// The deadlines under test are opted into per test.
			streamTimeout: false,
			streamInactivityTimeout: false,
			...options,
		})
	const internals = worker as unknown as {
		streams: unknown[]
		lifecycleTimers: Set<unknown>
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
	'ZBStreamWorker stream lifetime and inactivity watchdog',
	() => {
		beforeEach(() => {
			vi.useFakeTimers()
		})
		afterEach(() => {
			vi.useRealTimers()
		})

		describe('streamDeadlineMs / resolveStreamDeadline', () => {
			test('the deadline is a uniform spread over [0.9 ×, 1.0 ×] of the configured value', () => {
				expect(streamDeadlineMs(10_000, () => 0)).toBe(9_000)
				expect(streamDeadlineMs(10_000, () => 0.5)).toBe(9_500)
				expect(streamDeadlineMs(10_000, () => 1 - Number.EPSILON)).toBe(10_000)
			})

			test('the jittered deadlines of many workers are spread across the window', () => {
				// Draw from a deterministic uniform sequence, as a fleet of workers
				// each drawing from Math.random would.
				const draws: number[] = []
				for (let i = 0; i < 1_000; i++) {
					draws.push(streamDeadlineMs(DEFAULT_STREAM_TIMEOUT_MS, Math.random))
				}
				const min = Math.min(...draws)
				const max = Math.max(...draws)
				expect(min).toBeGreaterThanOrEqual(0.9 * DEFAULT_STREAM_TIMEOUT_MS)
				expect(max).toBeLessThanOrEqual(DEFAULT_STREAM_TIMEOUT_MS)
				// A uniform spread over a 10% window of 8 h fills it: with 1000
				// draws the observed range covers (almost) the whole window, and
				// the draws are not clustered at one end.
				expect(max - min).toBeGreaterThan(0.09 * DEFAULT_STREAM_TIMEOUT_MS)
				const below = draws.filter(
					(d) => d < 0.95 * DEFAULT_STREAM_TIMEOUT_MS
				).length
				expect(below).toBeGreaterThan(300)
				expect(below).toBeLessThan(700)
			})

			test('resolveStreamDeadline: undefined and {} mean the default, false and non-positive disable', () => {
				expect(resolveStreamDeadline(undefined, 8)).toEqual({
					timeoutMs: 8,
					random: Math.random,
				})
				expect(resolveStreamDeadline({}, 8)).toEqual({
					timeoutMs: 8,
					random: Math.random,
				})
				expect(resolveStreamDeadline(false, 8)).toBeUndefined()
				expect(resolveStreamDeadline(0, 8)).toBeUndefined()
				expect(resolveStreamDeadline(-1, 8)).toBeUndefined()
				expect(resolveStreamDeadline(5, 8)?.timeoutMs).toBe(5)
				expect(resolveStreamDeadline({ timeoutMs: 5 }, 8)?.timeoutMs).toBe(5)
			})
		})

		describe('max stream lifetime', () => {
			test('a stream that reaches its max lifetime is replaced: the new stream opens before the old one is cancelled', async () => {
				const { transport, log, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				expect(transport.opens).toBe(1)
				const oldStream = transport.latest

				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens, 'a replacement stream was opened').toBe(2)
				expect(
					oldStream.cancelled,
					'the expired stream was cancelled after its replacement opened'
				).toBe(true)
				expect(log.logDebug).toHaveBeenCalledWith(
					expect.stringContaining('max lifetime')
				)
				// No failure was reported and no reconnect was scheduled: a recycle
				// is not a stream failure.
				expect(log.logError).not.toHaveBeenCalled()
				await worker.close()
			})

			test('jobs keep flowing across a recycle, with none lost or duplicated', async () => {
				const handled: string[] = []
				const { transport, zbClient, streamJobs, worker } = setup()
				await streamJobs({
					taskHandler: (j) => {
						handled.push(j.key)
						return undefined as never
					},
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})

				transport.latest.serverSend(job({ key: '1' }))
				await settle()
				await vi.advanceTimersByTimeAsync(60_000) // recycle
				transport.latest.serverSend(job({ key: '2' }))
				await settle()

				expect(handled).toEqual(['1', '2'])
				// One startup backfill, plus one recycle backfill covering the
				// window before the server registered the replacement.
				expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)
				await worker.close()
			})

			test('the recycled stream gets its own lifetime: recycling repeats', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens).toBe(2)
				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens).toBe(3)
				await worker.close()
			})

			test('the lifetime deadline is jittered', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					// 0.5 → deadline is 95% of the configured value.
					streamTimeout: { timeoutMs: 60_000, random: () => 0.5 },
				})
				await vi.advanceTimersByTimeAsync(56_999)
				expect(
					transport.opens,
					'not recycled before the jittered deadline'
				).toBe(1)
				await vi.advanceTimersByTimeAsync(1)
				expect(transport.opens).toBe(2)
				await worker.close()
			})

			test('disabled with false: a stream lives past the default lifetime', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({ streamTimeout: false })
				await vi.advanceTimersByTimeAsync(DEFAULT_STREAM_TIMEOUT_MS)
				expect(transport.opens, 'no recycle when disabled').toBe(1)
				await worker.close()
			})

			test('a failed re-open during a recycle keeps the old stream alive and reports the failure, without scheduling a reconnect', async () => {
				const { transport, log, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				const oldStream = transport.latest
				transport.failNextOpen(new Error('no route'))

				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens).toBe(2)
				expect(oldStream.cancelled, 'the old stream is left running').toBe(
					false
				)
				expect(log.logError).toHaveBeenCalledWith(
					'Failed to open job stream for details-task: no route'
				)
				// The old stream is still live: no reconnect is scheduled on top of
				// it (a successful retry would open a second subscription and run
				// an unwanted backfill). No further open happens until the
				// original stream ends. (Advance less than one full lifetime, so
				// this window closes before the old stream's next recycle.)
				await vi.advanceTimersByTimeAsync(50_000)
				expect(
					transport.opens,
					'no reconnect while the original stream is live'
				).toBe(2)
				// The old stream still works, and its eventual death is recovered
				// by the normal reconnect path.
				oldStream.serverError(new Error('14 UNAVAILABLE: gone'))
				await settle()
				await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
				expect(transport.opens, 'the dead stream is recovered').toBe(3)
				await worker.close()
			})

			test('close() during a recycle cancels the replacement and never revives the old stream', async () => {
				const { transport, streamJobs, worker, internals } = setup()
				const handle = await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				const deferred = transport.deferNextOpen()
				const oldStream = transport.latest

				await vi.advanceTimersByTimeAsync(60_000) // recycle starts, open pending
				expect(transport.opens).toBe(2)
				handle.close()
				const lateStream = transport.newStream()
				deferred.resolve(lateStream)
				await settle()

				expect(lateStream.cancelled, 'the late replacement is cancelled').toBe(
					true
				)
				expect(
					oldStream.cancelled,
					'the old stream is cancelled by close'
				).toBe(true)
				await vi.advanceTimersByTimeAsync(10 * 60_000)
				expect(transport.opens, 'no further opens after close').toBe(2)
				expect(internals.lifecycleTimers.size).toBe(0)
				await worker.close()
			})

			test('close() cancels the lifetime timer', async () => {
				const { transport, streamJobs, worker, internals } = setup()
				const handle = await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				expect(internals.lifecycleTimers.size).toBeGreaterThan(0)
				handle.close()
				expect(internals.lifecycleTimers.size).toBe(0)
				await vi.advanceTimersByTimeAsync(120_000)
				expect(transport.opens).toBe(1)
				await worker.close()
			})

			test('a stream that fails while its recycle replacement is opening gets exactly one replacement and a backfill', async () => {
				const { transport, zbClient, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				const original = transport.latest
				const deferred = transport.deferNextOpen()

				// The lifetime fires: the recycle's replacement open is pending.
				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens).toBe(2)

				// The original stream fails during the handoff. Its close handler
				// must not start a concurrent reconnect: the pending open is its
				// replacement.
				original.serverError(new Error('14 UNAVAILABLE: gone'))
				await settle()
				expect(transport.opens, 'no concurrent reconnect open').toBe(2)

				// The pending open completes the recovery; the replacement is the
				// only live stream.
				const replacement = transport.newStream()
				deferred.resolve(replacement)
				await settle()
				expect(original.cancelled, 'the failed stream was disposed').toBe(true)
				expect(transport.opens, 'still exactly one replacement').toBe(2)

				// The dead stream missed jobs: the recovery backfills, like a
				// reconnect (one initial backfill + one recovery backfill).
				await vi.advanceTimersByTimeAsync(0)
				expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

				// No further open is scheduled, and both streams are tracked so
				// close() disposes everything. (Advance less than one full
				// lifetime, so this window closes before the replacement's own
				// recycle at 60 s.)
				await vi.advanceTimersByTimeAsync(50_000)
				expect(transport.opens).toBe(2)
				await worker.close()
			})

			test('a second stream failure while a reconnect open is in flight queues one follow-up, never a concurrent open', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})

				// The first stream dies; the reconnect backoff starts.
				transport.latest.serverError(new Error('boom'))
				await settle()
				expect(transport.opens).toBe(1)

				// The backoff fires: the reconnect open is pending (deferred).
				const deferred = transport.deferNextOpen()
				await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
				expect(transport.opens, 'the reconnect open started').toBe(2)

				// The reconnect succeeds — and the new stream fails while a
				// recycle's replacement open is in flight. The failure must
				// queue a follow-up, not race a second open.
				const second = transport.newStream()
				deferred.resolve(second)
				await settle()
				const third = transport.deferNextOpen()
				await vi.advanceTimersByTimeAsync(60_000) // recycle of `second` starts
				expect(transport.opens).toBe(3)
				second.serverError(new Error('boom again'))
				await settle()
				expect(
					transport.opens,
					'no concurrent open while the recycle open is pending'
				).toBe(3)

				// The pending open resolves to an error: the queued follow-up
				// recovers the dead stream, exactly once.
				third.resolve({ error: new Error('no route') })
				await settle()
				await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
				expect(transport.opens, 'the follow-up recovered the stream').toBe(4)
				await worker.close()
			})
			test('a recycle runs one backfill poll to cover the handoff gap before the replacement is registered', async () => {
				const { zbClient, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
				await vi.advanceTimersByTimeAsync(60_000) // recycle
				expect(
					zbClient.activateJobs,
					'the handoff gap is backfilled'
				).toHaveBeenCalledTimes(2)
				await worker.close()
			})

			test('with reconnect disabled, an original that fails during a recycle open leaves no live replacement or timers', async () => {
				const { transport, streamJobs, worker, internals } = setup()
				const handle = await streamJobs({
					streamReconnect: false,
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
				})
				const original = transport.latest
				// Keep the watchdog quiet until the recycle.
				const deferred = transport.deferNextOpen()
				for (let t = 0; t < 60_000; t += 20_000) {
					original.serverSend(job({ key: String(t) }))
					await vi.advanceTimersByTimeAsync(20_000)
				}
				expect(transport.opens).toBe(2)
				original.serverError(new Error('14 UNAVAILABLE: gone'))
				await settle()
				const replacement = transport.newStream()
				deferred.resolve(replacement)
				await settle()

				expect(handle.state.status).toBe('closed')
				await expect(handle.done).resolves.toMatchObject({
					kind: 'stream-failed',
				})
				expect(replacement.cancelled, 'the replacement is disposed').toBe(true)
				expect(internals.lifecycleTimers.size, 'no timers left').toBe(0)
				await vi.advanceTimersByTimeAsync(10 * 60_000)
				expect(transport.opens).toBe(2)
				await worker.close()
			})
		})

		describe('inactivity watchdog', () => {
			test('the watchdog fires after N ms of silence: the stream is cancelled and recreated', async () => {
				const { transport, log, streamJobs, worker } = setup()
				await streamJobs({
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
				})
				const stalled = transport.latest

				await vi.advanceTimersByTimeAsync(30_000)
				expect(stalled.cancelled, 'the stalled stream was cancelled').toBe(true)
				expect(log.logDebug).toHaveBeenCalledWith(
					expect.stringContaining('delivered no job')
				)
				// The cancel goes through the normal failure path: re-opened after
				// the reconnect backoff, then a backfill poll.
				await vi.advanceTimersByTimeAsync(BACKOFF.initialDelayMs)
				expect(transport.opens, 'the stream was recreated').toBe(2)
				await worker.close()
			})

			test('the watchdog resets on every received job', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
				})

				// A job every 29 s keeps the stream alive indefinitely.
				for (let i = 0; i < 5; i++) {
					await vi.advanceTimersByTimeAsync(29_000)
					transport.latest.serverSend(job())
					await settle()
				}
				expect(transport.opens, 'an active stream is never recycled').toBe(1)

				// Stop feeding it: the watchdog fires 30 s after the last job.
				await vi.advanceTimersByTimeAsync(30_000)
				expect(transport.latest.cancelled).toBe(true)
				await worker.close()
			})

			test('the watchdog deadline is jittered', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					// 0.5 → deadline is 95% of the configured value.
					streamInactivityTimeout: { timeoutMs: 30_000, random: () => 0.5 },
				})
				await vi.advanceTimersByTimeAsync(28_499)
				expect(transport.latest.cancelled, 'not fired yet').toBe(false)
				await vi.advanceTimersByTimeAsync(1)
				expect(transport.latest.cancelled).toBe(true)
				await worker.close()
			})

			test('disabled with false: a silent stream is left alone', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({ streamInactivityTimeout: false })
				await vi.advanceTimersByTimeAsync(
					DEFAULT_STREAM_INACTIVITY_TIMEOUT_MS * 2
				)
				expect(transport.latest.cancelled).toBe(false)
				expect(transport.opens).toBe(1)
				await worker.close()
			})

			test('the watchdog must be less than the max lifetime: it is clamped and a warning is logged', async () => {
				const { transport, log, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				expect(log.logError).toHaveBeenCalledWith(
					expect.stringContaining(
						'streamInactivityTimeout (60000ms) must be less than streamTimeout (60000ms)'
					)
				)
				// Clamped to 90% of the lifetime: the watchdog fires first.
				await vi.advanceTimersByTimeAsync(54_000)
				expect(transport.latest.cancelled, 'the clamped watchdog fired').toBe(
					true
				)
				await worker.close()
			})

			test('a watchdog firing while a recycle is opening does not start a second re-open', async () => {
				const { transport, streamJobs, worker } = setup()
				// Watchdog deadline (57 s) lands inside the lifetime recycle's
				// pending open (starts at 60 s).
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 60_000, random: () => 0.05 },
				})
				const deferred = transport.deferNextOpen()
				const first = transport.latest

				// The watchdog fires at 57 s, before the lifetime: the stalled
				// stream is cancelled and the reconnect path starts an open —
				// which is the deferred one.
				await vi.advanceTimersByTimeAsync(57_000)
				expect(first.cancelled, 'the stalled stream was cancelled').toBe(true)
				expect(transport.opens, 'the watchdog started one re-open').toBe(2)

				// The lifetime timer fires at 60 s while the re-open is in flight:
				// it must not start a second open on top.
				await vi.advanceTimersByTimeAsync(3_000)
				expect(transport.opens, 'no second re-open').toBe(2)

				// The pending open completes the recovery.
				deferred.resolve(transport.newStream())
				await settle()
				expect(transport.opens, 'still exactly one re-open').toBe(2)
				await worker.close()
			})

			test('the watchdog is suspended while backpressure has paused the stream, and re-armed when reading resumes', async () => {
				// maxJobsActive 1: the second pushed job fills the buffer and the
				// stream is paused while the first handler runs.
				let finishFirst: () => void = () => undefined
				const handled: string[] = []
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					maxJobsActive: 1,
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
					taskHandler: (j) => {
						handled.push(j.key)
						if (j.key === '1') {
							return new Promise<void>((resolve) => {
								finishFirst = resolve
							}) as never
						}
						return undefined as never
					},
				})
				const paused = transport.latest

				// Job 1 starts; job 2 is buffered and pauses the stream.
				paused.serverSend(job({ key: '1' }))
				await settle()
				paused.serverSend(job({ key: '2' }))
				await settle()
				expect(handled).toEqual(['1'])

				// The handler holds the buffer full well beyond the watchdog
				// deadline. The silence is deliberate (backpressure), not a stall:
				// the healthy stream must not be recycled.
				await vi.advanceTimersByTimeAsync(10 * 30_000)
				expect(
					paused.cancelled,
					'a stream paused by backpressure is not recycled'
				).toBe(false)
				expect(transport.opens, 'no replacement was opened').toBe(1)

				// The handler settles: the buffered job runs, the stream resumes,
				// and the watchdog is re-armed from the resume.
				finishFirst()
				await settle()
				expect(handled).toEqual(['1', '2'])
				await vi.advanceTimersByTimeAsync(29_999)
				expect(paused.cancelled, 'not fired before the re-armed deadline').toBe(
					false
				)
				await vi.advanceTimersByTimeAsync(1)
				expect(
					paused.cancelled,
					'the re-armed watchdog fires on silence after the resume'
				).toBe(true)
				await worker.close()
			})

			test('a watchdog expiring while a recycle open is pending is deferred, so a failed replacement leaves the original protected', async () => {
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 20_000, random: NO_JITTER },
				})
				const original = transport.latest
				const deferred = transport.deferNextOpen()
				for (let t = 0; t < 3; t++) {
					await vi.advanceTimersByTimeAsync(19_000)
					original.serverSend(job({ key: String(t) }))
					await settle()
				}
				// t = 57 s; watchdog due at 77 s. Lifetime fires at 60 s.
				await vi.advanceTimersByTimeAsync(3_000)
				expect(transport.opens).toBe(2)
				// The watchdog expires at 77 s while the open is still pending.
				await vi.advanceTimersByTimeAsync(20_000)
				expect(original.cancelled).toBe(false)
				// The replacement fails: the original must still be guarded.
				deferred.resolve({ error: new Error('no route') } as never)
				await settle()
				expect(original.cancelled).toBe(false)
				await vi.advanceTimersByTimeAsync(20_000)
				expect(
					original.cancelled,
					'the deferred watchdog recycles the silent original'
				).toBe(true)
				await worker.close()
			})

			test('a stream whose lifetime expires while paused by backpressure is recycled only after reading resumes', async () => {
				let finishFirst: () => void = () => undefined
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					maxJobsActive: 1,
					streamTimeout: { timeoutMs: 100_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
					taskHandler: (j) => {
						if (j.key === '1') {
							return new Promise<void>((resolve) => {
								finishFirst = resolve
							}) as never
						}
						return undefined as never
					},
				})
				const first = transport.latest
				first.serverSend(job({ key: '1' }))
				await settle()
				first.serverSend(job({ key: '2' }))
				await settle()
				await vi.advanceTimersByTimeAsync(100_000) // lifetime with full buffer
				expect(
					transport.opens,
					'a paused stream is not recycled: unread jobs would be lost'
				).toBe(1)
				expect(first.cancelled).toBe(false)
				await vi.advanceTimersByTimeAsync(90_000)
				expect(first.cancelled, 'the watchdog leaves it alone too').toBe(false)
				// Reading resumes: the deferred recycle now runs.
				finishFirst()
				await settle()
				expect(transport.opens, 'recycled once reading resumed').toBe(2)
				expect(first.cancelled).toBe(true)
				await worker.close()
			})

			test('a replacement opened while the buffer is full stays paused without the watchdog recycling it', async () => {
				let finishFirst: () => void = () => undefined
				const { transport, streamJobs, worker } = setup()
				await streamJobs({
					maxJobsActive: 1,
					streamTimeout: { timeoutMs: 100_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
					taskHandler: (j) => {
						if (j.key === '1') {
							return new Promise<void>((resolve) => {
								finishFirst = resolve
							}) as never
						}
						return undefined as never
					},
				})
				const first = transport.latest
				// Keep the original alive until just before its lifetime.
				for (let t = 0; t < 4; t++) {
					await vi.advanceTimersByTimeAsync(24_000)
					first.serverSend(job({ key: 'k' + t }))
					await settle()
				}
				// The handler for job 1 runs; job 2 fills the buffer once the
				// replacement is open.
				const deferred = transport.deferNextOpen()
				first.serverSend(job({ key: '1' }))
				await settle()
				await vi.advanceTimersByTimeAsync(4_000) // lifetime fires, open pending
				expect(transport.opens).toBe(2)
				first.serverSend(job({ key: '2' }))
				await settle()
				const replacement = transport.newStream()
				deferred.resolve(replacement)
				await settle()
				await vi.advanceTimersByTimeAsync(90_000)
				expect(
					replacement.cancelled,
					'a paused replacement is not recycled by the watchdog'
				).toBe(false)
				finishFirst()
				await settle()
				await worker.close()
			})

			test('a pending recycle backfill does not suppress the replacement watchdog', async () => {
				const { transport, zbClient, streamJobs, worker } = setup()
				await streamJobs({
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
					streamInactivityTimeout: { timeoutMs: 50_000, random: NO_JITTER },
				})
				const original = transport.latest
				await vi.advanceTimersByTimeAsync(40_000)
				original.serverSend(job({ key: 'a' }))
				await settle()
				// The recycle backfill never settles.
				zbClient.activateJobs.mockReturnValue(new Promise(() => undefined))
				await vi.advanceTimersByTimeAsync(20_000) // recycle at 60 s
				expect(transport.opens).toBe(2)
				const replacement = transport.latest
				await vi.advanceTimersByTimeAsync(50_000)
				expect(
					replacement.cancelled,
					'the silent replacement is recovered despite the pending backfill'
				).toBe(true)
				await worker.close()
			})

			test('with reconnect disabled, a failed replacement after the original died ends the handle', async () => {
				const { transport, streamJobs, worker, internals } = setup()
				const handle = await streamJobs({
					streamReconnect: false,
					streamTimeout: { timeoutMs: 60_000, random: NO_JITTER },
				})
				const original = transport.latest
				const deferred = transport.deferNextOpen()
				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens).toBe(2)
				original.serverError(new Error('14 UNAVAILABLE: gone'))
				await settle()
				deferred.resolve({ error: new Error('no route') } as never)
				await settle()
				expect(handle.state.status).toBe('closed')
				await expect(handle.done).resolves.toMatchObject({
					kind: 'stream-failed',
				})
				expect(internals.lifecycleTimers.size).toBe(0)
				await worker.close()
			})

			test('close() cancels the watchdog', async () => {
				const { transport, streamJobs, worker, internals } = setup()
				const handle = await streamJobs({
					streamInactivityTimeout: { timeoutMs: 30_000, random: NO_JITTER },
				})
				handle.close()
				expect(internals.lifecycleTimers.size).toBe(0)
				await vi.advanceTimersByTimeAsync(60_000)
				expect(transport.opens).toBe(1)
				await worker.close()
			})
		})

		describe('defaults', () => {
			test('both safeguards are on by default with the Java client values', async () => {
				const { transport, streamJobs, worker, internals } = setup({
					// The defaults must not leak into this assertion via the setup
					// helper's `false` overrides.
				})
				// Bypass the helper's disabling overrides.
				const handle = await worker.streamJobs({
					type: 'details-task',
					worker: 'details-worker',
					timeout: 30_000,
					tenantIds: ['<default>'],
					taskHandler: () => undefined as never,
					inputVariableDto: LosslessDto,
					customHeadersDto: LosslessDto,
					pollInterval: 0,
					streamReconnect: BACKOFF,
				})
				// The watchdog (10 min) is armed: the stream is cancelled after a
				// jittered deadline in [9 min, 10 min]. The draw is random, so
				// assert the bounds: alive at 8 min, cancelled by 10 min.
				const firstStream = transport.latest
				await vi.advanceTimersByTimeAsync(8 * 60 * 1_000)
				expect(
					firstStream.cancelled,
					'a jittered deadline is never below 90% of the configured value'
				).toBe(false)
				await vi.advanceTimersByTimeAsync(2 * 60 * 1_000)
				expect(firstStream.cancelled, 'the default watchdog fired').toBe(true)
				handle.close()
				expect(internals.lifecycleTimers.size).toBe(0)
				await worker.close()
				// Reference the helper so its unused-variable lint stays quiet, and
				// assert the exported defaults match the Java client.
				void streamJobs
				expect(DEFAULT_STREAM_TIMEOUT_MS).toBe(8 * 60 * 60 * 1_000)
				expect(DEFAULT_STREAM_INACTIVITY_TIMEOUT_MS).toBe(10 * 60 * 1_000)
			})
		})
	}
)
