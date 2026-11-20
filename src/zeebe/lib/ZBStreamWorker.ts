import { ZeebeGrpcClient } from '../zb/ZeebeGrpcClient'

import { GrpcError } from './GrpcError'
import { StatefulLogInterceptor } from './StatefulLogInterceptor'
import {
	StreamAttachment,
	StreamClosedReason,
	StreamFailure,
	StreamHandle,
	StreamStateMachine,
	asStream,
	attachStream,
	backoffDelayMs,
	cancelStream,
	createStreamHandle,
	createStreamStateMachine,
	describeStreamState,
	getOpenError,
	toError,
} from './StreamLifecycle'
import {
	ErrorJobWithVariables,
	IZBJobWorker,
	JOB_ACTION_ACKNOWLEDGEMENT,
	JSONDoc,
	Job,
	JobCompletionInterface,
	JobFailureConfiguration,
	ZBGrpc,
	ZBWorkerTaskHandler,
} from './interfaces-1.0'
import { ActivatedJob, StreamActivatedJobsRequest } from './interfaces-grpc-1.0'

import { parseVariablesAndCustomHeadersToJSON } from '.'

/**
 * Options controlling how `streamJobs` reports and recovers from a job stream
 * that dies (stream error, server-side end/close, or a failed open).
 */
export interface StreamJobsRecoveryOptions {
	/**
	 * Called when the job stream fails: a stream `error` event, or a failed
	 * attempt to open the stream. Exceptions thrown by the callback, and
	 * rejections of a returned promise, are caught and logged.
	 */
	onStreamError?: (error: Error) => void | Promise<void>
	/**
	 * Called when the server ends or closes the job stream without an error.
	 * Exceptions thrown by the callback, and rejections of a returned
	 * promise, are caught and logged.
	 */
	onStreamEnd?: () => void | Promise<void>
	/**
	 * Called just before each attempt to re-open a dead stream. `attempt` is
	 * the number of consecutive failed streams or open attempts, starting at 1.
	 * It resets once a re-opened stream delivers a job or stays up for at least
	 * `maxDelayMs`. Exceptions thrown by the callback, and rejections of a
	 * returned promise, are caught and logged.
	 */
	onStreamReconnect?: (attempt: number) => void | Promise<void>
	/**
	 * Re-open the stream when it dies. Defaults to `true`, with exponential
	 * backoff starting at 1000ms, capped at 30000ms, and full jitter applied
	 * (each delay is a uniform random value in `[0, cap]`, so a fleet of
	 * workers whose streams die together does not reconnect in lockstep).
	 * Pass `false` to disable reconnection (the `onStream*` callbacks still
	 * fire), or an object to tune the backoff. `random` is a random source
	 * returning `[0, 1)` (like `Math.random`); inject a deterministic one in
	 * tests. After a re-opened stream is established, one backfill poll runs
	 * to pick up jobs that were created while the stream was down.
	 */
	streamReconnect?:
		| boolean
		| {
				initialDelayMs?: number
				maxDelayMs?: number
				random?: () => number
		  }
	/**
	 * Retry a backlog activation (the initial backfill, a reconnect backfill,
	 * or a sidecar poll) that fails with a transient error
	 * (RESOURCE_EXHAUSTED, UNAVAILABLE, DEADLINE_EXCEEDED). Defaults to
	 * exponential backoff from 50ms by a factor of 1.6, capped at 5000ms,
	 * with full jitter — each delay is a uniform random value in `[0, cap]`,
	 * so a fleet that is throttled together does not retry in lockstep.
	 * Pass `false` to restore the old behaviour (no retry), or an object to
	 * tune the retry. With `false`, a failed initial startup backfill rejects
	 * `streamJobs()` before recurring polling is scheduled; a later failed
	 * activation is recovered by the next sidecar poll only when recurring
	 * polling is enabled (`pollInterval` > 0). `jitter` is the
	 * jitter width as a fraction of the capped base delay: `1` (the default)
	 * is full jitter `[0, cap]`, `0.1` is ±10% around the base, `0` disables
	 * jitter. `random` is a random source returning `[0, 1)`; inject a
	 * deterministic one in tests.
	 */
	backlogRetry?:
		| false
		| {
				minDelayMs?: number
				maxDelayMs?: number
				factor?: number
				jitter?: number
				random?: () => number
		  }
	/**
	 * Back off the recurring sidecar poll while it keeps returning no jobs
	 * and the stream is open, like the Camunda Java client's
	 * `streamNoJobsBackoffSupplier`. Each empty poll schedules the next one
	 * after `min(current * factor, maxDelayMs)`, jittered by ±`jitter`
	 * (a fraction of the delay); a poll that activates at least one job, or a
	 * poll while the stream is down, resets the delay to `pollInterval`.
	 * Defaults match the Java client: factor 1.6, jitter 0.1, max 60000ms.
	 * Pass `false` to poll at a fixed `pollInterval`. `random` is a random
	 * source returning `[0, 1)`; inject a deterministic one in tests.
	 */
	streamNoJobsBackoff?: false | StreamNoJobsBackoffOptions
	/**
	 * Maximum lifetime of one job stream, in milliseconds. When it is reached
	 * the stream is recycled: a replacement stream is opened first, and only
	 * then is the old stream cancelled, so no job is dropped in the gap.
	 *
	 * A job stream is one long-lived gRPC call pinned to the gateway it first
	 * reached. Without a maximum lifetime, streams never move after a gateway
	 * scale-out or restart: new gateways get no streams and the survivors stay
	 * overloaded until the worker processes restart. Recycling spreads the
	 * streams back across the gateways — provided the load balancer routes each
	 * new stream independently (see the README's Job Streaming section: this
	 * needs request-level/L7 balancing; a plain L4 balancer reuses the same
	 * HTTP/2 connection and needs DNS or client-side balancing instead).
	 *
	 * Defaults to 8 hours (`28_800_000`), the Camunda Java client's
	 * `streamTimeout` default. Pass `false` to disable recycling. Each stream's
	 * deadline is jittered: a uniform random value in `[0.9 × streamTimeout,
	 * streamTimeout]`, so a fleet that started together does not recycle every
	 * stream in the same second every 8 hours. `random` is a random source
	 * returning `[0, 1)` (like `Math.random`); inject a deterministic one in
	 * tests.
	 */
	streamTimeout?:
		| number
		| false
		| {
				timeoutMs?: number
				random?: () => number
		  }
	/**
	 * Inactivity watchdog, in milliseconds. If no job arrives on the stream for
	 * this long, the stream is cancelled and recreated. The timer resets on
	 * every received job. This catches silent stalls where the transport is
	 * healthy (HTTP/2 keepalive passes) but the stream no longer delivers jobs —
	 * for example a proxy keeping the socket warm after the broker-side handler
	 * stopped pushing.
	 *
	 * Defaults to 10 minutes (`600_000`), the Camunda Java client's
	 * `streamInactivityTimeout` default. Pass `false` to disable the watchdog.
	 * It must be less than `streamTimeout` (a watchdog that cannot fire before
	 * the stream is recycled anyway is useless): when it is not, it is clamped
	 * to 90% of the configured `streamTimeout` and a warning is logged. Each
	 * stream's deadline is jittered the same way as `streamTimeout`: a uniform
	 * random value in `[0.9 × streamInactivityTimeout, streamInactivityTimeout]`.
	 * `random` is a random source returning `[0, 1)` (like `Math.random`);
	 * inject a deterministic one in tests.
	 */
	streamInactivityTimeout?:
		| number
		| false
		| {
				timeoutMs?: number
				random?: () => number
		  }
}

/** Options for `streamNoJobsBackoffDelayMs`; see `StreamJobsRecoveryOptions.streamNoJobsBackoff`. */
export interface StreamNoJobsBackoffOptions {
	maxDelayMs?: number
	factor?: number
	jitter?: number
	random?: () => number
}

export const STREAM_NO_JOBS_BACKOFF_MAX_DELAY_MS = 60_000
const STREAM_NO_JOBS_BACKOFF_FACTOR = 1.6
const STREAM_NO_JOBS_BACKOFF_JITTER = 0.1

/**
 * The next sidecar poll delay after an empty poll while the stream is open:
 * grows from the current (un-jittered) delay by `factor`, capped at
 * `maxDelayMs` (never below `baseDelayMs`). Returns the un-jittered `next`
 * delay, to grow from on the following empty poll, and the jittered `delay`
 * to actually wait.
 */
export const streamNoJobsBackoffDelayMs = (
	currentDelayMs: number,
	baseDelayMs: number,
	options: StreamNoJobsBackoffOptions = {}
): { next: number; delay: number } => {
	const {
		maxDelayMs = STREAM_NO_JOBS_BACKOFF_MAX_DELAY_MS,
		factor = STREAM_NO_JOBS_BACKOFF_FACTOR,
		jitter = STREAM_NO_JOBS_BACKOFF_JITTER,
		random = Math.random,
	} = options
	const cap = Math.max(maxDelayMs, baseDelayMs)
	const next = Math.max(baseDelayMs, Math.min(currentDelayMs * factor, cap))
	const offset = next * jitter * (2 * random() - 1)
	return { next, delay: Math.max(0, Math.round(next + offset)) }
}

const DEFAULT_RECONNECT_INITIAL_DELAY_MS = 1_000
const DEFAULT_RECONNECT_MAX_DELAY_MS = 30_000

// Stream-lifecycle safeguards, on by default, matching the Camunda Java
// client's JobWorkerBuilderImpl defaults.
export const DEFAULT_STREAM_TIMEOUT_MS = 8 * 60 * 60 * 1_000 // 8 hours
export const DEFAULT_STREAM_INACTIVITY_TIMEOUT_MS = 10 * 60 * 1_000 // 10 minutes

// Each stream's lifetime and watchdog deadlines are jittered downward by up
// to 10%. The Java client uses fixed values, so a fleet started together (for
// example after a fleet-wide redeploy) recycles every stream in the same
// second, every 8 h, indefinitely. A uniform spread over [0.9 ×, 1.0 ×] of
// the configured value spreads recycling across the window instead.
const STREAM_DEADLINE_JITTER = 0.1

/**
 * One stream's deadline: a uniform random value in
 * `[(1 - STREAM_DEADLINE_JITTER) × timeoutMs, timeoutMs]`. `random` is
 * injectable (returning `[0, 1)`, like `Math.random`) so tests can pin it.
 */
export const streamDeadlineMs = (
	timeoutMs: number,
	random: () => number = Math.random
): number =>
	Math.round(timeoutMs * (1 - STREAM_DEADLINE_JITTER * (1 - random())))

/** Options accepted by the `streamTimeout` / `streamInactivityTimeout` object form. */
export interface StreamDeadlineOptions {
	timeoutMs?: number
	random?: () => number
}

/**
 * Normalise a `streamTimeout` / `streamInactivityTimeout` option. `undefined`
 * and `{}` mean the default; `false` disables the deadline; a number is the
 * deadline in milliseconds. Non-positive numbers disable the deadline, like
 * `pollInterval`'s `0` / `-1`.
 */
export const resolveStreamDeadline = (
	option: number | false | StreamDeadlineOptions | undefined,
	defaultTimeoutMs: number
): { timeoutMs: number; random: () => number } | undefined => {
	if (option === false) {
		return undefined
	}
	const { timeoutMs = defaultTimeoutMs, random = Math.random } =
		typeof option === 'object' ? option : { timeoutMs: option }
	if (!(timeoutMs > 0)) {
		return undefined
	}
	return { timeoutMs, random }
}

// Activate more jobs once in-flight work drops below this fraction of
// maxJobsActive, like the Java client's JobWorkerImpl.
const ACTIVATION_THRESHOLD_RATIO = 0.3

// Backoff for retrying a backlog activation that failed with a temporary
// error. The base curve matches the Java client's default ExponentialBackoff
// (min 50ms, max 5s, factor 1.6); the jitter is full jitter rather than the
// Java client's ±10%, so a fleet that is throttled together spreads its
// retries across the whole backoff window instead of a narrow band.
export const DRAIN_RETRY_MIN_DELAY_MS = 50
export const DRAIN_RETRY_MAX_DELAY_MS = 5_000
const DRAIN_RETRY_FACTOR = 1.6
const DRAIN_RETRY_JITTER = 1

const TRANSIENT_GRPC_CODES: ReadonlySet<number> = new Set([
	GrpcError.RESOURCE_EXHAUSTED,
	GrpcError.UNAVAILABLE,
	GrpcError.DEADLINE_EXCEEDED,
])
// Only the leading gRPC status prefix ("14 UNAVAILABLE: ...") is trusted, so
// a status name appearing later in free text cannot mark an error transient.
const TRANSIENT_MESSAGE =
	/^\s*(?:\d+\s+)?(?:RESOURCE_EXHAUSTED|UNAVAILABLE|DEADLINE_EXCEEDED)\b/

/**
 * Whether an activation error is temporary (broker backpressure, gateway
 * unavailable, deadline exceeded) and the activation should be retried.
 */
export const isTransientActivationError = (e: unknown): boolean => {
	const code = (e as { code?: unknown } | undefined)?.code
	// A numeric gRPC status is authoritative; the message is only a fallback.
	if (typeof code === 'number') {
		return TRANSIENT_GRPC_CODES.has(code)
	}
	return TRANSIENT_MESSAGE.test(toError(e).message)
}

/** Options for `drainRetryDelayMs`; see `StreamJobsRecoveryOptions.backlogRetry`. */
export interface DrainRetryOptions {
	minDelayMs?: number
	maxDelayMs?: number
	factor?: number
	jitter?: number
	random?: () => number
}

/**
 * Delay before the `attempt`-th retry (1-based) of a failed backlog
 * activation: exponential from `minDelayMs` by `factor`, capped at
 * `maxDelayMs`, jittered by `random`.
 *
 * `jitter` is the jitter width as a fraction of the capped base delay: `1`
 * (the default) is full jitter, a uniform value in `[0, cap]`; `0.1` is ±10%
 * around the base (the Java client's default); `0` is the plain exponential
 * curve. Defaults match the Java client's curve (50ms → 5s, factor 1.6) with
 * full jitter.
 */
export const drainRetryDelayMs = (
	attempt: number,
	options: DrainRetryOptions = {}
): number => {
	const {
		minDelayMs = DRAIN_RETRY_MIN_DELAY_MS,
		maxDelayMs = DRAIN_RETRY_MAX_DELAY_MS,
		factor = DRAIN_RETRY_FACTOR,
		jitter = DRAIN_RETRY_JITTER,
		random = Math.random,
	} = options
	const base = Math.min(minDelayMs * factor ** (attempt - 1), maxDelayMs)
	if (jitter >= 1) {
		// Full jitter: uniform in [0, base].
		return Math.floor(random() * (base + 1))
	}
	// base * (1 - jitter + 2 * jitter * random())
	const offset = base * jitter * (2 * random() - 1)
	return Math.max(0, Math.round(base + offset))
}

export class ZBStreamWorker implements IZBJobWorker {
	private grpcClient: ZBGrpc
	private logger: StatefulLogInterceptor
	private zbClient: ZeebeGrpcClient
	private streams: StreamAttachment[] = []
	private machines = new Set<StreamStateMachine>()
	private closed = false
	private pollTimers: ReturnType<typeof setTimeout>[] = []
	private reconnectTimers = new Set<ReturnType<typeof setTimeout>>()
	// Max-lifetime and inactivity-watchdog timers for live streams.
	private lifecycleTimers = new Set<ReturnType<typeof setTimeout>>()
	// Pending activation-retry waits; close() wakes them so they exit.
	private retryWaits = new Set<() => void>()
	constructor({
		grpcClient,
		log,
		zbClient,
	}: {
		grpcClient: ZBGrpc
		log: StatefulLogInterceptor
		zbClient: ZeebeGrpcClient
	}) {
		this.grpcClient = grpcClient
		this.logger = log
		this.zbClient = zbClient

		if (!this.zbClient) {
			this.logger.logError(`Missing ZBClient`)
		}
	}

	streamJobs<WorkerInputVariables, CustomHeaderShape, WorkerOutputVariables>(
		req: StreamActivatedJobsRequest & {
			inputVariableDto: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				new (...args: any[]): Readonly<WorkerInputVariables>
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			customHeadersDto: { new (...args: any[]): Readonly<CustomHeaderShape> }
			taskHandler: ZBWorkerTaskHandler<
				WorkerInputVariables,
				CustomHeaderShape,
				WorkerOutputVariables
			>
			/**
			 * Optional jitter in milliseconds. When provided, the worker will wait
			 * a random period up to this value before polling and opening the stream.
			 * Useful for staggering multiple stream workers.
			 */
			jitter?: number
			/**
			 * Maximum number of jobs to activate per poll cycle (both the initial
			 * backfill and the recurring sidecar polls). Defaults to 32.
			 */
			pollMaxJobsToActivate?: number
			/**
			 * Maximum number of jobs this registration handles concurrently,
			 * counting jobs from the stream and from backlog polls. Stream
			 * jobs that arrive while the worker is at capacity are buffered
			 * and started as handlers settle, so both delivery paths share
			 * the limit. Polls never activate more than the free capacity,
			 * and while a backlog exists the worker polls again as soon as
			 * fewer than 30% of this many jobs are in flight, rather than
			 * waiting for a whole batch to finish (like the Java client's
			 * `maxJobsActive`). Defaults to `pollMaxJobsToActivate`.
			 */
			maxJobsActive?: number
			/**
			 * Interval in milliseconds between sidecar poll cycles. The sidecar poll
			 * is a low-frequency safety net that picks up jobs the stream may have
			 * missed (e.g. jobs re-queued after a timeout). Each poll is a command on
			 * the broker, so keep this value high to minimise load.
			 *
			 * Defaults to 30000 (30 seconds). Set to 0 or -1 to disable recurring
			 * polling (the initial backfill poll still runs).
			 */
			pollInterval?: number
		} & StreamJobsRecoveryOptions
	): Promise<StreamHandle> {
		const {
			taskHandler,
			inputVariableDto,
			customHeadersDto,
			jitter,
			pollMaxJobsToActivate = 32,
			maxJobsActive: maxJobsActiveOption = pollMaxJobsToActivate,
			pollInterval = 30_000,
			onStreamError,
			onStreamEnd,
			onStreamReconnect,
			streamReconnect = true,
			backlogRetry,
			streamNoJobsBackoff,
			streamTimeout,
			streamInactivityTimeout,
			...streamReq
		} = req

		const maxJobsActive = Math.max(1, Math.floor(maxJobsActiveOption))

		const reconnectEnabled = streamReconnect !== false
		const reconnectOptions =
			typeof streamReconnect === 'object' ? streamReconnect : {}
		const initialDelayMs =
			reconnectOptions.initialDelayMs ?? DEFAULT_RECONNECT_INITIAL_DELAY_MS
		const maxDelayMs = Math.max(
			reconnectOptions.maxDelayMs ?? DEFAULT_RECONNECT_MAX_DELAY_MS,
			initialDelayMs
		)
		const reconnectRandom = reconnectOptions.random ?? Math.random

		// `undefined` and `{}` both mean the default retry policy; `false`
		// disables retrying (a failed activation waits for the next poll).
		const drainRetryEnabled = backlogRetry !== false
		const drainRetryOptions: DrainRetryOptions = backlogRetry || {}

		// Sidecar poll delay: backs off on empty polls while the stream is
		// open, resets to pollInterval when an activation returns jobs.
		const noJobsBackoffEnabled = streamNoJobsBackoff !== false
		const noJobsBackoffOptions: StreamNoJobsBackoffOptions =
			streamNoJobsBackoff || {}
		let sidecarBaseDelay = pollInterval // un-jittered current delay
		let sidecarDelay = pollInterval // delay for the next scheduled poll
		// A reset from inside the sidecar poll cycle itself is picked up by
		// that cycle's finally, which schedules the next poll at the new delay;
		// re-arming there too would run two timers. Only a reset from outside
		// the cycle (a disconnect, a backfill) re-arms the pending timer.
		let sidecarPollInFlight = false
		const resetSidecarDelay = () => {
			const wasBackedOff = sidecarDelay > pollInterval
			sidecarBaseDelay = pollInterval
			sidecarDelay = pollInterval
			// A pending sidecar timer still holds the pre-reset delay: re-arm it
			// at pollInterval so a disconnect or a non-empty reconnect backfill
			// does not leave the worker waiting out a stale backoff before
			// polling again. Only re-arm when clearing a backed-off delay: a
			// timer already armed at the base cadence is left alone, so repeated
			// reconnect failures (each faster than pollInterval) cannot churn the
			// timer and postpone polling indefinitely.
			if (wasBackedOff && !sidecarPollInFlight) {
				rearmSidecarPoll()
			}
		}

		// Stream-lifecycle safeguards: the max stream lifetime and the
		// inactivity watchdog. Both default to the Java client's values and can
		// be disabled with `false`.
		const lifetime = resolveStreamDeadline(
			streamTimeout,
			DEFAULT_STREAM_TIMEOUT_MS
		)
		let watchdog = resolveStreamDeadline(
			streamInactivityTimeout,
			DEFAULT_STREAM_INACTIVITY_TIMEOUT_MS
		)
		// The watchdog must fire before the stream is recycled anyway; when it
		// cannot, clamp it to 90% of the lifetime (the Java client rejects the
		// configuration instead; clamping keeps a worker with a tuned-down
		// `streamTimeout` and a default watchdog usable).
		if (watchdog && lifetime && watchdog.timeoutMs >= lifetime.timeoutMs) {
			const clamped = Math.max(1, Math.floor(lifetime.timeoutMs * 0.9))
			this.logger.logError(
				`streamInactivityTimeout (${watchdog.timeoutMs}ms) must be less than streamTimeout (${lifetime.timeoutMs}ms); clamping the watchdog to ${clamped}ms`
			)
			watchdog = { ...watchdog, timeoutMs: clamped }
		}

		// Returns the handler's promise, which never rejects: a failure is
		// logged here. dispatch() awaits it to free capacity.
		const handleJob = (
			job: Job<WorkerInputVariables, CustomHeaderShape>
		): Promise<unknown> =>
			// Invoke the handler inside a promise continuation: a synchronous
			// throw must reject this promise rather than escape handleJob,
			// which would abort dispatching mid-batch — leaving later
			// jobs undispatched and releasing the drain's reservation before
			// the handlers already started have settled.
			//
			// Observe the handler's returned promise so that a rejected job
			// action (for example, a completion command that fails because the
			// job was already completed, failed, or the process instance was
			// cancelled) is handled here rather than surfacing as an unhandled
			// promise rejection that could terminate the process.
			Promise.resolve()
				.then(() =>
					taskHandler(
						{
							...job,
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							...this.makeCompleteHandlers(job as any, req.type),
						},
						this
					)
				)
				.catch((e: unknown) => {
					const message = e instanceof Error ? e.message : String(e)
					this.logger.logError(
						`Unhandled exception in stream worker task handler for job ${job.key}: ${message}`
					)
				})

		// Invoke a caller-supplied lifecycle callback. A throwing callback must
		// not break stream recovery (or crash the process from an event handler).
		// Callbacks may be async, so a returned promise is observed as well: a
		// rejection is logged rather than surfacing as an unhandled rejection.
		const notify = (name: string, callback: () => void | Promise<void>) => {
			const logFailure = (e: unknown) =>
				this.logger.logError(
					`Exception in ${name} callback of stream worker: ${
						toError(e).message
					}`
				)
			try {
				Promise.resolve(callback()).catch(logFailure)
			} catch (e) {
				logFailure(e)
			}
		}

		// Mutable per-streamJobs-call state. Mutation is confined to the
		// stream lifecycle handlers below.
		let handleClosed = false // set by the returned handle's close()
		let currentStream: StreamAttachment | undefined
		const machine = createStreamStateMachine()
		this.machines.add(machine)
		void machine.done.then(() => this.machines.delete(machine))
		const transition = (
			next: Parameters<StreamStateMachine['transition']>[0]
		) => {
			if (machine.transition(next)) {
				this.logger.logDebug(
					`Job stream for ${req.type}: ${describeStreamState(next)}`
				)
			}
		}
		let reconnectTimer: ReturnType<typeof setTimeout> | undefined
		let sidecarTimer: ReturnType<typeof setTimeout> | undefined
		let consecutiveFailures = 0 // drives the exponential backoff
		// The max-lifetime timer of the live stream. Recycled streams are
		// re-opened *before* they are cancelled, so the old stream's timer can
		// still fire while its replacement is already live: the callback must
		// not mistake the replacement for the expiring stream.
		let lifetimeTimer: ReturnType<typeof setTimeout> | undefined
		// The inactivity watchdog of the live stream, and the stream it guards.
		let inactivityTimer: ReturnType<typeof setTimeout> | undefined
		let inactivityStream: StreamAttachment | undefined
		// True while a max-lifetime recycle is opening its replacement: a
		// watchdog firing in that window must not start a second re-open.
		let recycling = false
		// True while an open is in flight (initial open, reconnect, or the
		// recycle's replacement). Only one open may be in flight at a time:
		// two concurrent opens can both succeed, and the second one to land
		// would silently overwrite `currentStream`, leaving a duplicate
		// subscription that survives `handle.close()` (it is no longer
		// tracked anywhere). A stream failure that arrives while an open is
		// in flight queues a follow-up open instead of starting its own.
		let openInFlight = false
		// Set when the live stream failed while a replacement open was in
		// flight: when that open settles, a fresh open runs (to replace the
		// dead stream if the in-flight one was its planned replacement, or
		// to recover if the in-flight open itself failed), followed by a
		// backfill poll for the jobs the dead stream missed.
		let openFollowUp = false
		// A stream whose max lifetime expired while backpressure had it
		// paused. Recycling a paused stream would discard the activated jobs
		// still unread in its transport buffer (they are only redelivered
		// after their activation timeout), so the recycle waits until reading
		// resumes.
		let recycleDue: StreamAttachment | undefined

		// Schedules the next sidecar poll at the current sidecarDelay. Bound in
		// pollAndStream once recurring polling is set up; a no-op until then
		// (and forever when recurring polling is disabled, pollInterval <= 0).
		let scheduleSidecarPoll: () => void = () => {}

		// Replace a pending sidecar poll timer with one armed at the current
		// sidecarDelay. Used when the delay state is reset while a poll timer
		// is pending: the pending timer would otherwise still wait out the
		// stale (possibly backed-off) delay. The cleared timer is removed from
		// `pollTimers` and its replacement pushed, so the array keeps tracking
		// exactly the live timer and `close()` still cancels it. No-op while a
		// poll is in flight (its finally already schedules the next poll at
		// the new delay) or when recurring polling never started.
		const rearmSidecarPoll = () => {
			if (isClosed() || !sidecarTimer) {
				return
			}
			clearTimeout(sidecarTimer)
			const index = this.pollTimers.indexOf(sidecarTimer)
			if (index !== -1) {
				this.pollTimers.splice(index, 1)
			}
			sidecarTimer = undefined
			scheduleSidecarPoll()
		}

		const isClosed = () => this.closed || handleClosed

		// Capacity model (like the Java client's JobWorkerImpl): count the
		// jobs in flight — from the stream and from backlog polls — against
		// `maxJobsActive`. While a backlog exists, activate more as soon as
		// enough capacity is free, instead of waiting for every job in a
		// polled batch to settle. The slowest job in a batch then no longer
		// sets the pace for the whole batch.
		let inFlight = 0
		// Activate again once fewer than this many jobs are in flight.
		const activationThreshold = Math.max(
			1,
			Math.round(maxJobsActive * ACTIVATION_THRESHOLD_RATIO)
		)
		// Stream jobs are pushed by the broker and can't be refused, so they
		// are buffered while the worker is at capacity and started as
		// handlers settle: both delivery paths share the `maxJobsActive`
		// limit. The buffer is bounded by transport backpressure: once it
		// holds `maxJobsActive` jobs the stream is paused (gRPC stops reading,
		// so HTTP/2 flow control stops the broker sending) and resumed when
		// the buffer drains below that bound.
		const streamBuffer: Job<WorkerInputVariables, CustomHeaderShape>[] = []
		const streamBufferLimit = maxJobsActive
		// The raw stream currently delivering jobs, so it can be paused.
		let currentRawStream:
			| { pause?: () => unknown; resume?: () => unknown }
			| undefined
		let streamPaused = false
		// Pause or resume the stream to keep the buffer bounded. A paused
		// stream is deliberately starved, not stalled: the inactivity
		// watchdog is suspended while the pause holds and re-armed when
		// reading resumes, so a long backpressure pause is not mistaken
		// for a dead stream (which would cancel a healthy stream and
		// delay the buffered, already-activated jobs until their
		// activation timeout).
		const applyStreamBackpressure = () => {
			const shouldPause =
				!isClosed() && streamBuffer.length >= streamBufferLimit
			if (shouldPause === streamPaused || !currentRawStream) {
				return
			}
			streamPaused = shouldPause
			if (shouldPause) {
				suspendInactivityWatchdog()
				currentRawStream.pause?.()
			} else {
				currentRawStream.resume?.()
				// Reading resumes: restart the silence deadline from now. A
				// stream that stays silent after the resume is genuinely
				// stalled and the watchdog recycles it.
				if (inactivityStream) {
					armInactivityWatchdog(inactivityStream)
				}
				const due = recycleDue
				recycleDue = undefined
				if (due && currentStream === due && !isClosed()) {
					startRecycle(due)
				}
			}
		}
		const takeBuffered = () => {
			const job = streamBuffer.shift()
			applyStreamBackpressure()
			return job
		}
		// A buffered job whose activation deadline has passed may already be
		// reactivated elsewhere: starting its handler risks duplicate side
		// effects. Pausing the stream does not extend deadlines. A missing or
		// unparseable deadline is treated as unknown (not expired).
		const isExpired = (job: Job<WorkerInputVariables, CustomHeaderShape>) => {
			const deadline = Number(job.deadline)
			return Number.isFinite(deadline) && deadline > 0 && deadline <= Date.now()
		}
		// Start buffered stream jobs in the free handler slots. While an
		// activation request is on the wire, the free slots are reserved for
		// its response (it asked for exactly the free capacity), so nothing is
		// drained until it settles — every path releases the reservation
		// first. Expired buffered jobs are discarded, and a backlog poll is
		// arranged so the broker can hand them out again.
		const drainStreamBuffer = () => {
			while (
				!isClosed() &&
				!capacityReserved &&
				streamBuffer.length > 0 &&
				inFlight < maxJobsActive
			) {
				const job = takeBuffered()!
				if (isExpired(job)) {
					this.logger.logDebug(
						`Discarding buffered stream job ${job.key} of type ${req.type}: its activation deadline has passed`
					)
					backlogPending = true
					continue
				}
				runJob(job)
			}
		}
		// Polled jobs never take in-flight work above maxJobsActive. Buffered
		// stream jobs count against the capacity too, so polls back off while
		// the stream is busy instead of competing with it for handlers.
		const freeCapacity = () =>
			Math.min(
				pollMaxJobsToActivate,
				maxJobsActive - inFlight - streamBuffer.length
			)

		// Activate up to `count` jobs.
		const activate = (count: number) =>
			this.zbClient.activateJobs<WorkerInputVariables, CustomHeaderShape>({
				type: req.type,
				worker: req.worker,
				timeout: req.timeout,
				maxJobsToActivate: count,
				tenantIds: req.tenantIds,
				fetchVariable: req.fetchVariable,
				inputVariableDto,
				customHeadersDto,
				requestTimeout: -1,
			})

		// Wait before retrying an activation. Resolves early when the handle
		// or the client is closed, so a pending retry never outlives close().
		const handleRetryWaits = new Set<() => void>()
		const retryWait = (ms: number) =>
			new Promise<void>((resolve) => {
				const wake = () => {
					clearTimeout(timer)
					handleRetryWaits.delete(wake)
					this.retryWaits.delete(wake)
					resolve()
				}
				const timer = setTimeout(wake, ms)
				handleRetryWaits.add(wake)
				this.retryWaits.add(wake)
			})

		// Activate up to the free capacity, retrying temporary failures
		// (RESOURCE_EXHAUSTED, UNAVAILABLE, DEADLINE_EXCEEDED) with
		// exponential backoff while the handle is open, like the Java
		// client's poller. Abandoning the backlog on broker backpressure
		// would leave it untouched until the next sidecar poll — up to a
		// whole pollInterval (30s by default). Returns an empty batch if the
		// handle closes while retrying. Non-transient errors are rethrown.
		// `full` reports whether the broker filled the request, i.e. more
		// jobs are probably waiting.
		const activateWithRetry = async (): Promise<{
			jobs: Job<WorkerInputVariables, CustomHeaderShape>[]
			full: boolean
		}> => {
			for (let attempt = 1; ; attempt++) {
				const count = freeCapacity()
				if (isClosed()) {
					return { jobs: [], full: false }
				}
				if (count <= 0) {
					// Stream jobs filled the capacity (e.g. during a retry
					// wait). This is not an empty poll: keep the backlog
					// signal so freed capacity resumes the activation.
					return { jobs: [], full: true }
				}
				// Reserve the requested capacity for the response. runActivation
				// releases it once the returned jobs are dispatched.
				capacityReserved = true
				try {
					const jobs = await activate(count)
					return { jobs, full: jobs.length >= count }
				} catch (e) {
					// No request is on the wire during the retry backoff: release
					// the capacity so buffered stream jobs can use idle slots.
					// The next attempt recalculates the free capacity.
					capacityReserved = false
					if (
						isClosed() ||
						!drainRetryEnabled ||
						!isTransientActivationError(e)
					) {
						throw e
					}
					const delay = drainRetryDelayMs(attempt, drainRetryOptions)
					this.logger.logDebug(
						`Stream worker backlog poll for ${
							req.type
						} failed with a temporary error, retrying in ${delay}ms: ${
							toError(e).message
						}`
					)
					drainStreamBuffer()
					await retryWait(delay)
					if (isClosed()) {
						return { jobs: [], full: false }
					}
				}
			}
		}

		// Only one activation is ever in flight. The flag is reserved *before*
		// the activation call and released once its jobs are dispatched (or
		// the activation fails), so a reconnect backfill can never start a
		// second activation while another is still pending.
		let activationReserved = false
		// The free capacity is reserved for an activation request currently on
		// the wire (not during its retry backoff). Separate from
		// activationReserved, which guards the whole retry sequence.
		let capacityReserved = false
		// More jobs are probably waiting: the last poll came back full.
		let backlogPending = false
		// A reconnect backfill is waiting for capacity or for the in-flight
		// activation to finish. Jobs created while the stream was down must
		// not be stranded when recurring polling is disabled.
		let backfillRequested = false
		// The requested backfill is already a retry of a failed backfill:
		// retry a failed backfill only once.
		let backfillIsRetry = false

		// Run a handler and count it against the capacity. Each settled job
		// may free enough capacity for a buffered stream job or the next
		// activation. Event-driven, not a loop or a recursion: nothing is
		// retained per batch, so a large or continuously replenished backlog
		// keeps memory bounded.
		const runJob = (job: Job<WorkerInputVariables, CustomHeaderShape>) => {
			inFlight++
			// handleJob never rejects.
			void handleJob(job).then(() => {
				inFlight--
				// A settled handler frees capacity: start a buffered stream
				// job before polling for more, so pushed jobs are not
				// starved by a continuously replenished backlog.
				drainStreamBuffer()
				maybeActivate()
			})
		}

		// Polled jobs always fit the capacity: the activation asked for no
		// more than the free capacity, and buffered stream jobs are counted
		// against it, so dispatching a polled batch never starts more than
		// `maxJobsActive` concurrent handlers.
		const dispatch = (job: Job<WorkerInputVariables, CustomHeaderShape>) =>
			runJob(job)

		// Stream jobs are pushed and can't be refused: buffer them while the
		// worker is at capacity (including capacity an in-flight activation
		// will consume when its response arrives) and start them as handlers
		// settle, so both delivery paths share the `maxJobsActive` limit.
		const dispatchStreamJob = (
			job: Job<WorkerInputVariables, CustomHeaderShape>
		) => {
			if (isClosed()) {
				return
			}
			if (inFlight >= maxJobsActive || capacityReserved) {
				streamBuffer.push(job)
				applyStreamBackpressure()
				return
			}
			runJob(job)
		}

		const canActivate = () =>
			!isClosed() &&
			!activationReserved &&
			inFlight < activationThreshold &&
			freeCapacity() > 0

		// Reserve the activation slot and activate. Rejects on a
		// non-transient failure, after releasing the reservation.
		const runActivation = async () => {
			activationReserved = true
			try {
				const { jobs, full } = await activateWithRetry()
				activationReserved = false
				capacityReserved = false
				backlogPending = full && !isClosed()
				if (jobs.length > 0) {
					resetSidecarDelay()
				}
				if (isClosed()) {
					// The handle closed while the activation was pending: start
					// no handlers, neither polled nor buffered.
					return 0
				}
				// Dispatch this activation's jobs first: the activation asked for
				// exactly the free capacity, and buffered stream jobs were counted
				// against it, so the batch always fits. Buffered stream jobs then
				// fill any remaining capacity (the batch may have come back
				// short) — they arrived before the polled jobs, and freeing the
				// reservation must not leave them stranded behind the batch.
				jobs.forEach(dispatch)
				drainStreamBuffer()
				// Capacity may have been freed while the activation was pending.
				maybeActivate()
				return jobs.length
			} catch (e) {
				backlogPending = false
				// Release before servicing a deferred backfill below, which
				// takes its own reservation (no finally may clear it after).
				activationReserved = false
				capacityReserved = false
				// Stream jobs buffered behind the failed activation must not be
				// stranded: start them in the free slots (no poll retry here).
				drainStreamBuffer()
				// A reconnect backfill deferred behind this activation was
				// never attempted: service it now, or it is stranded when
				// recurring polling is disabled and no handler settles.
				maybeActivate()
				throw e
			}
		}

		// Called whenever capacity is freed or an activation finishes:
		// activate when a backlog or a deferred backfill is waiting and
		// enough capacity is free.
		const maybeActivate = () => {
			if (!(backfillRequested || backlogPending) || !canActivate()) {
				return
			}
			const isBackfill = backfillRequested
			const isRetry = backfillIsRetry
			backfillRequested = false
			backfillIsRetry = false
			runActivation().catch((e: unknown) => {
				// Temporary failures were already retried in activateWithRetry;
				// this is a non-transient error. The next sidecar poll retries.
				this.logger.logError(
					`Stream worker backlog poll failed: ${toError(e).message}`
				)
				// A deferred reconnect backfill must not be dropped while the
				// handle is open: with recurring polling disabled there is no
				// other poll to pick up jobs created while the stream was down.
				// Re-run it once. With backlogRetry disabled, the caller opted
				// out of retrying failed backlog activations: leave recovery to
				// the next sidecar poll.
				// If a deferred backfill already started after the failure, it
				// covers this one: don't run a duplicate poll.
				if (
					isBackfill &&
					!isRetry &&
					drainRetryEnabled &&
					!isClosed() &&
					!activationReserved
				) {
					backfillRequested = true
					backfillIsRetry = true
					maybeActivate()
				}
			})
		}

		// Run a backfill poll. Only the activation is awaited (so its errors
		// reach the caller); the rest of the backlog drains in the background
		// as capacity frees up. If an activation is already in flight, or
		// not enough capacity is free, the backfill is not dropped: it runs
		// as soon as it can, so jobs created while the stream was down are
		// picked up even when recurring polling is disabled (pollInterval 0
		// or -1).
		const backfill = async () => {
			if (isClosed()) {
				return
			}
			if (!canActivate()) {
				backfillRequested = true
				// A fresh request: it may be retried once if it fails.
				backfillIsRetry = false
				return
			}
			// Route the activation through activateWithRetry so the initial
			// and reconnect backfills honour backlogRetry.
			await runActivation()
		}

		const discardStream = (attachment: StreamAttachment) => {
			const index = this.streams.indexOf(attachment)
			if (index !== -1) {
				this.streams.splice(index, 1)
			}
		}

		// The stream is down. Re-open it with backoff, or, if reconnection is
		// disabled, record that it is closed for good. While an open is
		// already in flight (a recycle's replacement or a reconnect), no
		// second open may be started: queue a follow-up instead, so the two
		// opens can never both succeed and leave a duplicate subscription.
		const onStreamDown = (cause: StreamFailure) => {
			if (isClosed()) {
				return
			}
			// While the stream is down the sidecar poll is the only channel,
			// so it must run at the base cadence: a pending timer armed at a
			// backed-off delay would leave the worker idle for up to the
			// backoff cap before it polls again.
			resetSidecarDelay()
			if (openInFlight) {
				// The in-flight open settles into the replacement for this
				// dead stream (or fails, and the follow-up recovers). The
				// follow-up backfills what the dead stream missed.
				openFollowUp = true
				return
			}
			if (!reconnectEnabled) {
				transition({
					status: 'closed',
					reason: { kind: 'stream-failed', failure: cause },
				})
				return
			}
			scheduleReconnect(cause)
		}

		// Schedule a single re-open of the stream with exponential backoff. Only
		// one reconnect timer is ever pending, so an `error` and an `end` for the
		// same dead stream (or a failed open racing a stream failure) cannot
		// result in duplicate re-opens.
		const scheduleReconnect = (cause: StreamFailure) => {
			if (!reconnectEnabled || isClosed() || reconnectTimer) {
				return
			}
			consecutiveFailures++
			const attempt = consecutiveFailures
			const delay = backoffDelayMs(
				attempt,
				initialDelayMs,
				maxDelayMs,
				reconnectRandom
			)
			transition({ status: 'reconnecting', attempt, cause })
			const timer = setTimeout(() => {
				reconnectTimer = undefined
				this.reconnectTimers.delete(timer)
				if (isClosed()) {
					return
				}
				notify('onStreamReconnect', () => onStreamReconnect?.(attempt))
				reconnect().catch((e) =>
					this.logger.logError(
						`Unexpected error re-opening job stream: ${toError(e).message}`
					)
				)
			}, delay)
			reconnectTimer = timer
			this.reconnectTimers.add(timer)
		}

		const handleOpenFailure = (error: Error) => {
			this.logger.logError(
				`Failed to open job stream for ${req.type}: ${error.message}`
			)
			notify('onStreamError', () => onStreamError?.(error))
			// The live stream failed while this open attempt was on the wire
			// (its close handler queued a follow-up rather than racing a
			// second open). The attempt delivered nothing, so nothing is
			// recovering the dead stream: schedule the recovery now.
			if (openFollowUp) {
				openFollowUp = false
				scheduleReconnect({ kind: 'open-failed', error })
				return
			}
			onStreamDown({ kind: 'open-failed', error })
		}

		// Track a max-lifetime or inactivity-watchdog timer so close() can
		// cancel it; the callback must drop it from the set when it fires.
		const trackLifecycleTimer = (
			timer: ReturnType<typeof setTimeout>
		): void => {
			this.lifecycleTimers.add(timer)
		}
		const cancelLifecycleTimer = (
			timer: ReturnType<typeof setTimeout> | undefined
		): void => {
			if (timer) {
				clearTimeout(timer)
				this.lifecycleTimers.delete(timer)
			}
		}

		// Arm the inactivity watchdog for a newly opened stream. It resets on
		// every received job; if it fires, the stream has silently stalled and
		// is cancelled and recreated.
		const armInactivityWatchdog = (attachment: StreamAttachment) => {
			cancelLifecycleTimer(inactivityTimer)
			if (!watchdog) {
				inactivityTimer = undefined
				inactivityStream = undefined
				return
			}
			inactivityStream = attachment
			// A deliberately paused stream keeps watchdog ownership but gets
			// no deadline: resuming re-arms it (see applyStreamBackpressure).
			if (streamPaused) {
				inactivityTimer = undefined
				return
			}
			inactivityTimer = setTimeout(
				() => {
					this.lifecycleTimers.delete(inactivityTimer!)
					inactivityTimer = undefined
					if (isClosed() || currentStream !== attachment) {
						inactivityStream = undefined
						return
					}
					if (recycling) {
						// A replacement is opening. Defer rather than consume the
						// watchdog: if the replacement fails, the original keeps
						// its stall protection; if it succeeds, the replacement's
						// own watchdog supersedes this one.
						armInactivityWatchdog(attachment)
						return
					}
					inactivityStream = undefined
					this.logger.logDebug(
						`Job stream for ${req.type} delivered no job for ${watchdog.timeoutMs}ms (jittered): recycling a stalled stream`
					)
					// Cancel the stalled stream. Its `close` handler runs the normal
					// failure path: backoff, onStreamError/onStreamEnd are skipped
					// (the stream is disposed, so its CANCELLED error is suppressed),
					// and the re-open plus backfill pick up anything it missed.
					discardStream(attachment)
					if (currentRawStream) {
						currentRawStream = undefined
					}
					currentStream = undefined
					attachment.dispose()
					onStreamDown({ kind: 'end' })
				},
				streamDeadlineMs(watchdog.timeoutMs, watchdog.random)
			)
			trackLifecycleTimer(inactivityTimer)
		}

		// Suspend the watchdog while the stream is intentionally paused by
		// backpressure: the silence is deliberate, not a stall. The guarded
		// stream is remembered so reading resumes into a fresh deadline.
		const suspendInactivityWatchdog = () => {
			cancelLifecycleTimer(inactivityTimer)
			inactivityTimer = undefined
		}

		// Recycle the live stream because its max lifetime was reached: open
		// the replacement first, then cancel the old stream, so no job is
		// dropped in the gap. Jobs already received keep running; the broker's
		// single-activation guarantee prevents duplicate delivery between the
		// two streams. A single backfill poll then covers the window before
		// the server registered the replacement.
		const recycleStream = async (expiring: StreamAttachment) => {
			recycling = true
			try {
				const openError = await openStream()
				if (openError) {
					if (isClosed()) {
						return
					}
					// The old stream is still alive: report the failed re-open
					// and let it run until it dies on its own (the reconnect
					// path then recovers it). Its lifetime timer already fired,
					// so it is not re-armed. Unlike a reconnect's failed open,
					// this must NOT schedule a recovery: while the original
					// stream is live a retry would open a second subscription,
					// run an unwanted backfill, and leave the original alive
					// after `handle.close()`.
					this.logger.logError(
						`Failed to open job stream for ${req.type}: ${openError.message}`
					)
					notify('onStreamError', () => onStreamError?.(openError))
					return
				}
				if (isClosed()) {
					// openStream already cancelled the stream it opened; leave the
					// old stream to close().
					return
				}
				// The replacement is live. Cancel the expiring stream, suppressing
				// its handlers so its CANCELLED error is not reported as a
				// failure and no reconnect is scheduled for it.
				discardStream(expiring)
				expiring.dispose()
				// The expiring stream failed while its replacement was opening:
				// its close handler queued a follow-up instead of a concurrent
				// reconnect. The replacement is now the live stream, but it
				// never delivered the jobs the dead stream missed: recover
				// exactly like a reconnect, with a backfill poll.
				if (openFollowUp) {
					openFollowUp = false
					if (!reconnectEnabled) {
						transition({
							status: 'closed',
							reason: {
								kind: 'stream-failed',
								failure: { kind: 'end' },
							},
						})
						// Terminal: dispose the replacement and cancel its
						// timers, so no jobs arrive after `done` resolved.
						// (`closed` is terminal, so closeHandle's own
						// transition is ignored and the reason is kept.)
						closeHandle()
						return
					}
				}
				// The replacement call is local until the server accepts it, so
				// jobs created between cancelling the original and the
				// replacement's registration may only exist as backlog (or the
				// original died early). One backfill poll closes that gap; the
				// broker's single-activation guarantee prevents duplicates.
				// Run it detached: the handoff is complete, so the recycle guard
				// is released now and the replacement's inactivity watchdog is
				// not suppressed by a slow or retrying backfill.
				recycling = false
				backfill().catch((e) =>
					this.logger.logError(
						`Backfill poll after job stream recycle failed: ${
							toError(e).message
						}`
					)
				)
			} finally {
				recycling = false
			}
		}

		const startRecycle = (attachment: StreamAttachment) => {
			this.logger.logDebug(
				`Job stream for ${req.type} reached its max lifetime of ${lifetime?.timeoutMs}ms (jittered): recycling the stream`
			)
			recycleStream(attachment).catch((e) =>
				this.logger.logError(
					`Unexpected error recycling job stream: ${toError(e).message}`
				)
			)
		}

		// Arm the max-lifetime timer for a newly opened stream.
		const armLifetimeTimer = (attachment: StreamAttachment) => {
			cancelLifecycleTimer(lifetimeTimer)
			if (!lifetime) {
				lifetimeTimer = undefined
				return
			}
			lifetimeTimer = setTimeout(
				() => {
					this.lifecycleTimers.delete(lifetimeTimer!)
					lifetimeTimer = undefined
					if (isClosed() || currentStream !== attachment) {
						return
					}
					if (streamPaused) {
						// Unread activated jobs may sit in the paused transport
						// buffer: retire the stream only once it is read again.
						recycleDue = attachment
						return
					}
					startRecycle(attachment)
				},
				streamDeadlineMs(lifetime.timeoutMs, lifetime.random)
			)
			trackLifecycleTimer(lifetimeTimer)
		}

		// Open the stream. Returns an Error if it could not be opened (the
		// caller decides what to do), otherwise attaches the lifecycle handlers.
		//
		// `openInFlight` marks the whole attempt — including the failure
		// handling below — so a stream failure arriving during it queues a
		// follow-up (see `onStreamDown`) rather than racing a second open.
		// The flag is released only after the follow-up has been serviced (or
		// deliberately left to the reconnect backoff), so the follow-up open
		// itself never overlaps this one.
		const openStream = async (): Promise<Error | undefined> => {
			openInFlight = true
			try {
				const result: unknown = await (async () => {
					try {
						return await this.grpcClient.streamActivatedJobsStream(streamReq)
					} catch (e) {
						return { error: e }
					}
				})()
				const openError = getOpenError(result)
				if (openError) {
					// A failed open opens nothing, but the live stream may have
					// failed while the attempt was on the wire: nothing is
					// recovering it now, so start the recovery immediately
					// rather than after a pointless backoff delay. The finally
					// clears `openInFlight` as this returns, so the scheduled
					// reconnect's open cannot overlap this attempt.
					if (openFollowUp) {
						openFollowUp = false
						if (!isClosed()) {
							if (reconnectEnabled) {
								scheduleReconnect({ kind: 'open-failed', error: openError })
							} else {
								// No live stream remains and nothing will recover
								// it: end the handle so `done` resolves.
								transition({
									status: 'closed',
									reason: {
										kind: 'stream-failed',
										failure: { kind: 'open-failed', error: openError },
									},
								})
								closeHandle()
							}
						}
					}
					return openError
				}
				const stream = asStream<ActivatedJob>(result)
				if (isClosed()) {
					// close() was called while the stream was being opened.
					cancelStream(stream)
					return undefined
				}

				const openedAt = Date.now()
				let receivedData = false
				let cause: StreamFailure = { kind: 'end' }
				// A stream that delivered a job, or stayed up for a while, was
				// healthy: restart the backoff from the beginning.
				const resetBackoffIfHealthy = () => {
					if (receivedData || Date.now() - openedAt >= maxDelayMs) {
						consecutiveFailures = 0
					}
				}
				// The adapter is the only code that attaches listeners to the raw
				// stream. It delivers exactly one of `error`/`end`, then `close`.
				const attachment: StreamAttachment = attachStream(stream, {
					data: (res) => {
						if (!receivedData) {
							receivedData = true
							consecutiveFailures = 0
						}
						// The stream is alive and delivering: restart the inactivity
						// watchdog.
						if (inactivityStream === attachment) {
							armInactivityWatchdog(attachment)
						}
						try {
							const parsedJob = parseVariablesAndCustomHeadersToJSON<
								WorkerInputVariables,
								CustomHeaderShape
							>(res, inputVariableDto, customHeadersDto)
							// Buffer when the worker is at capacity rather than
							// starting a handler past the maxJobsActive limit.
							dispatchStreamJob(parsedJob)
						} catch (e) {
							this.zbClient
								.failJob({
									jobKey: res.key,
									errorMessage: `Error parsing variable payload ${e}`,
									retries: res.retries - 1,
									retryBackOff: 0,
								})
								.catch((failError: unknown) =>
									this.logger.logError(
										`Failed to fail job ${
											res.key
										} after a payload parse error: ${
											toError(failError).message
										}`
									)
								)
						}
					},
					error: (error) => {
						cause = { kind: 'error', error }
						if (isClosed()) {
							// Expected: we cancelled it ourselves.
							return
						}
						resetBackoffIfHealthy()
						this.logger.logError(
							`Job stream for ${req.type} failed: ${error.message}`
						)
						notify('onStreamError', () => onStreamError?.(error))
					},
					end: () => {
						cause = { kind: 'end' }
						if (isClosed()) {
							return
						}
						resetBackoffIfHealthy()
						this.logger.logError(`Job stream for ${req.type} ended`)
						notify('onStreamEnd', () => onStreamEnd?.())
					},
					close: () => {
						discardStream(attachment)
						if (currentStream === attachment) {
							currentStream = undefined
							// The live stream is gone: its deadlines are meaningless.
							cancelLifecycleTimer(lifetimeTimer)
							lifetimeTimer = undefined
						}
						if (inactivityStream === attachment) {
							cancelLifecycleTimer(inactivityTimer)
							inactivityTimer = undefined
							inactivityStream = undefined
						}
						onStreamDown(cause)
					},
				})
				this.streams.push(attachment)
				currentStream = attachment
				currentRawStream = stream
				// A new stream starts flowing: re-apply backpressure if the buffer
				// is still full from the previous one.
				streamPaused = false
				applyStreamBackpressure()
				// Arm the stream-lifecycle safeguards for this stream.
				armLifetimeTimer(attachment)
				armInactivityWatchdog(attachment)
				transition({ status: 'open' })
				return undefined
			} finally {
				openInFlight = false
			}
		}

		// Re-open a dead stream, then backfill: jobs created while the stream
		// was down were never delivered to it. The broker guarantees single
		// activation, so there is no risk of duplicate delivery.
		const reconnect = async () => {
			const openError = await openStream()
			if (isClosed()) {
				// close() was called while the stream was being opened: a failed
				// open is expected fallout, so neither report it nor retry.
				return
			}
			if (openError) {
				return handleOpenFailure(openError)
			}
			await backfill().catch((e) =>
				this.logger.logError(
					`Backfill poll after job stream reconnect failed: ${
						toError(e).message
					}`
				)
			)
		}

		// The handle returned to the caller. `close()` is idempotent.
		const closeHandle = () => {
			handleClosed = true
			transition({ status: 'closed', reason: { kind: 'closed-by-caller' } })
			if (sidecarTimer) {
				clearTimeout(sidecarTimer)
			}
			handleRetryWaits.forEach((wake) => wake())
			if (reconnectTimer) {
				clearTimeout(reconnectTimer)
				this.reconnectTimers.delete(reconnectTimer)
				reconnectTimer = undefined
			}
			cancelLifecycleTimer(lifetimeTimer)
			lifetimeTimer = undefined
			cancelLifecycleTimer(inactivityTimer)
			inactivityTimer = undefined
			inactivityStream = undefined
			if (currentStream) {
				discardStream(currentStream)
				currentStream.dispose()
				currentStream = undefined
			}
		}
		const handle: StreamHandle = createStreamHandle(machine, closeHandle)

		const pollAndStream = async (): Promise<StreamHandle> => {
			if (this.closed) {
				// The client was already closed: open nothing, and give the caller a
				// handle that says so, instead of one that reports `open` forever.
				transition({ status: 'closed', reason: { kind: 'client-closed' } })
				return handle
			}

			// Optional jitter to stagger multiple workers
			if (jitter) {
				await new Promise((resolve) =>
					setTimeout(resolve, Math.random() * jitter)
				)
			}

			// Open the stream first so no new jobs are missed
			const openError = await openStream()
			if (isClosed()) {
				// close() was called while the stream was being opened.
				return handle
			}
			if (openError) {
				handleOpenFailure(openError)
				if (!reconnectEnabled) {
					throw openError
				}
			} else {
				// Initial backfill poll: pick up jobs that existed before the stream.
				// The broker guarantees single activation, so there is no risk of
				// duplicate delivery between the poll and the stream.
				await backfill()
			}

			// Recurring sidecar poll: a low-frequency safety net that catches
			// jobs the stream may have missed (e.g. jobs re-queued after a
			// timeout or while the stream is down and being re-opened). Uses a
			// setTimeout chain so each cycle waits for the previous poll to
			// finish before scheduling the next, preventing overlapping polls.
			//
			// The live timer is tracked in `this.pollTimers` so that `close()`
			// can cancel it. Each cycle removes the timer that just fired
			// before scheduling the next one, so the array holds at most one
			// live timer per stream rather than growing by one per poll cycle.
			if (pollInterval > 0) {
				scheduleSidecarPoll = () => {
					// A poll in flight when close() is called must not schedule another.
					if (isClosed()) {
						return
					}
					sidecarTimer = setTimeout(() => {
						// This timer has fired and is dead — drop it before the
						// next cycle pushes its replacement, so `pollTimers` only
						// ever retains live timers.
						const index = this.pollTimers.indexOf(sidecarTimer!)
						if (index !== -1) {
							this.pollTimers.splice(index, 1)
						}
						// An activation already in flight, or a backlog that is
						// polled again as soon as capacity frees up, is doing this
						// poll's job; with no free capacity there is nothing to
						// poll for.
						if (
							activationReserved ||
							backlogPending ||
							isClosed() ||
							freeCapacity() <= 0
						) {
							scheduleSidecarPoll()
							return
						}
						// runActivation reserves before activating: a reconnect
						// backfill arriving while this activation is pending must
						// not start a second, overlapping activation.
						sidecarPollInFlight = true
						runActivation()
							.then((activated) => {
								if (activated > 0) {
									return
								}
								if (!noJobsBackoffEnabled || !currentStream) {
									// Polling-only behaviour while the stream is down.
									resetSidecarDelay()
									return
								}
								// The stream is open and the poll came back empty:
								// back off, like the Java client.
								const { next, delay } = streamNoJobsBackoffDelayMs(
									sidecarBaseDelay,
									pollInterval,
									noJobsBackoffOptions
								)
								sidecarBaseDelay = next
								sidecarDelay = delay
								this.logger.logDebug(
									`Stream worker sidecar poll for ${req.type} returned no jobs, next poll in ${delay}ms`
								)
							})
							.catch((e: unknown) => {
								// Swallow errors — the stream is the primary channel.
								// The next poll cycle will retry.
								this.logger.logDebug(
									`Stream worker sidecar poll failed: ${toError(e).message}`
								)
							})
							.finally(() => {
								sidecarPollInFlight = false
								scheduleSidecarPoll()
							})
					}, sidecarDelay)
					this.pollTimers.push(sidecarTimer)
				}
				scheduleSidecarPoll()
			}

			return handle
		}

		return pollAndStream()
	}

	close() {
		this.closed = true
		this.pollTimers.forEach((t) => clearTimeout(t))
		this.pollTimers = []
		this.reconnectTimers.forEach((t) => clearTimeout(t))
		this.reconnectTimers.clear()
		this.lifecycleTimers.forEach((t) => clearTimeout(t))
		this.lifecycleTimers.clear()
		this.retryWaits.forEach((wake) => wake())
		const clientClosed: StreamClosedReason = { kind: 'client-closed' }
		this.machines.forEach((m) =>
			m.transition({ status: 'closed', reason: clientClosed })
		)
		this.streams.forEach((s) => s.dispose())
		this.streams = []
		return this.grpcClient.close()
	}

	public log(msg: JSON) {
		this.logger.logInfo(msg)
	}

	public debug(msg: JSON) {
		this.logger.logDebug(msg)
	}

	public error(msg: JSON) {
		this.logger.logError(msg)
	}

	protected makeCompleteHandlers<T>(
		thisJob: Job,
		taskType: string
	): JobCompletionInterface<T> & JobCompletionInterface<T> {
		let methodCalled: string | undefined

		/**
		 * This is a wrapper that allows us to throw an error if a job acknowledgement function is called more than once,
		 * for these functions should be called once only (and only one should be called, but we don't handle that case).
		 */
		const errorMsgOnPriorMessageCall = <T>(
			thisMethod: string,
			wrappedFunction: (...args) => T
		) => {
			return (...args) => {
				if (methodCalled !== undefined) {
					this.logger.logError(
						`WARNING: Call to ${thisMethod}() after ${methodCalled}() was called.
You should call only one job action method in the worker handler. This is a bug in a Stream worker handler.`
					)

					return wrappedFunction(...args)
				}
				methodCalled = thisMethod
				return wrappedFunction(...args)
			}
		}

		const cancelWorkflow = (job: Job) => () =>
			this.zbClient
				.cancelProcessInstance(job.processInstanceKey)
				.then(() => JOB_ACTION_ACKNOWLEDGEMENT)

		const failJob =
			(job: Job) =>
			(conf: string | JobFailureConfiguration, retries?: number) => {
				const isFailureConfig = (
					_conf: string | JobFailureConfiguration
				): _conf is JobFailureConfiguration => typeof _conf === 'object'
				const errorMessage = isFailureConfig(conf) ? conf.errorMessage : conf
				const retryBackOff = isFailureConfig(conf)
					? (conf.retryBackOff ?? 0)
					: 0
				const _retries = isFailureConfig(conf) ? (conf.retries ?? 0) : retries
				return this.failJob({
					job,
					errorMessage,
					retries: _retries,
					retryBackOff,
				})
			}

		const succeedJob = (job: Job) => (completedVariables?: T) =>
			this.completeJob(job.key, completedVariables ?? {}, taskType)

		const errorJob =
			(job: Job) =>
			(e: string | ErrorJobWithVariables, errorMessage: string = '') => {
				const isErrorJobWithVariables = (
					s: string | ErrorJobWithVariables
				): s is ErrorJobWithVariables => typeof s === 'object'
				const errorCode = isErrorJobWithVariables(e) ? e.errorCode : e
				errorMessage = isErrorJobWithVariables(e)
					? (e.errorMessage ?? '')
					: errorMessage
				const variables = isErrorJobWithVariables(e) ? e.variables : {}

				return this.errorJob({
					errorCode,
					errorMessage,
					job,
					variables,
				})
			}

		const fail = failJob(thisJob)
		const succeed = succeedJob(thisJob)
		return {
			cancelWorkflow: cancelWorkflow(thisJob),
			complete: errorMsgOnPriorMessageCall('job.complete', succeed),
			error: errorMsgOnPriorMessageCall('error', errorJob(thisJob)),
			fail: errorMsgOnPriorMessageCall('job.fail', fail),
			forward: errorMsgOnPriorMessageCall('job.forward', () => {
				return JOB_ACTION_ACKNOWLEDGEMENT
			}),
		}
	}

	private failJob({
		job,
		errorMessage,
		retries,
		retryBackOff,
	}: {
		job: Job
		errorMessage: string
		retries?: number
		retryBackOff?: number
	}) {
		return this.zbClient
			.failJob({
				errorMessage,
				jobKey: job.key,
				retries: retries ?? job.retries - 1,
				retryBackOff: retryBackOff ?? 0,
			})
			.then(() => JOB_ACTION_ACKNOWLEDGEMENT)
			.finally(() => {
				this.logger.logDebug(`Failed job ${job.key} - ${errorMessage}`)
			})
	}

	private completeJob(jobKey: string, completedVariables = {}, taskType) {
		return this.zbClient
			.completeJob({
				jobKey,
				variables: completedVariables,
			})
			.then((res) => {
				this.logger.logDebug(`Completed job ${jobKey} for ${taskType}`)
				return res
			})
			.catch((e) => {
				this.logger.logDebug(
					`Completing job ${jobKey} for ${taskType} threw ${e.message}`
				)
				throw e
			})
			.then(() => JOB_ACTION_ACKNOWLEDGEMENT)
	}

	private errorJob({
		errorCode,
		errorMessage,
		job,
		variables,
	}: {
		job: Job
		errorCode: string
		errorMessage: string
		variables: JSONDoc
	}) {
		return this.zbClient
			.throwError({
				errorCode,
				errorMessage,
				jobKey: job.key,
				variables,
			})
			.then(() =>
				this.logger.logDebug(`Errored job ${job.key} - ${errorMessage}`)
			)
			.catch((e) => {
				this.logger.logError(
					`Exception while attempting to raise BPMN Error for job ${job.key} - ${errorMessage}`
				)
				this.logger.logError(e)
			})
			.then(() => {
				return JOB_ACTION_ACKNOWLEDGEMENT
			})
	}
}
