import { ZeebeGrpcClient } from '../zb/ZeebeGrpcClient'

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
	 * backoff starting at 1000ms and capped at 30000ms. Pass `false` to disable
	 * reconnection (the `onStream*` callbacks still fire), or an object to tune
	 * the backoff. After a re-opened stream is established, one backfill poll
	 * runs to pick up jobs that were created while the stream was down.
	 */
	streamReconnect?: boolean | { initialDelayMs?: number; maxDelayMs?: number }
}

const DEFAULT_RECONNECT_INITIAL_DELAY_MS = 1_000
const DEFAULT_RECONNECT_MAX_DELAY_MS = 30_000

export class ZBStreamWorker implements IZBJobWorker {
	private grpcClient: ZBGrpc
	private logger: StatefulLogInterceptor
	private zbClient: ZeebeGrpcClient
	private streams: StreamAttachment[] = []
	private machines = new Set<StreamStateMachine>()
	private closed = false
	private pollTimers: ReturnType<typeof setTimeout>[] = []
	private reconnectTimers = new Set<ReturnType<typeof setTimeout>>()
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
			pollInterval = 30_000,
			onStreamError,
			onStreamEnd,
			onStreamReconnect,
			streamReconnect = true,
			...streamReq
		} = req

		const reconnectEnabled = streamReconnect !== false
		const reconnectOptions =
			typeof streamReconnect === 'object' ? streamReconnect : {}
		const initialDelayMs =
			reconnectOptions.initialDelayMs ?? DEFAULT_RECONNECT_INITIAL_DELAY_MS
		const maxDelayMs = Math.max(
			reconnectOptions.maxDelayMs ?? DEFAULT_RECONNECT_MAX_DELAY_MS,
			initialDelayMs
		)

		const handleJob = (job: Job<WorkerInputVariables, CustomHeaderShape>) => {
			// Observe the handler's returned promise so that a rejected job
			// action (for example, a completion command that fails because the
			// job was already completed, failed, or the process instance was
			// cancelled) is handled here rather than surfacing as an unhandled
			// promise rejection that could terminate the process.
			Promise.resolve(
				taskHandler(
					{
						...job,
						// eslint-disable-next-line @typescript-eslint/no-explicit-any
						...this.makeCompleteHandlers(job as any, req.type),
					},
					this
				)
			).catch((e: unknown) => {
				const message = e instanceof Error ? e.message : String(e)
				this.logger.logError(
					`Unhandled exception in stream worker task handler for job ${job.key}: ${message}`
				)
			})
		}

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

		const isClosed = () => this.closed || handleClosed

		// Helper to run a single poll cycle and feed results to handleJob.
		const runPoll = async () => {
			const jobs = await this.zbClient.activateJobs<
				WorkerInputVariables,
				CustomHeaderShape
			>({
				type: req.type,
				worker: req.worker,
				timeout: req.timeout,
				maxJobsToActivate: pollMaxJobsToActivate,
				tenantIds: req.tenantIds,
				fetchVariable: req.fetchVariable,
				inputVariableDto,
				customHeadersDto,
				requestTimeout: -1,
			})
			for (const job of jobs) {
				handleJob(job)
			}
		}

		const discardStream = (attachment: StreamAttachment) => {
			const index = this.streams.indexOf(attachment)
			if (index !== -1) {
				this.streams.splice(index, 1)
			}
		}

		// The stream is down. Re-open it with backoff, or, if reconnection is
		// disabled, record that it is closed for good.
		const onStreamDown = (cause: StreamFailure) => {
			if (isClosed()) {
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
			const delay = backoffDelayMs(attempt, initialDelayMs, maxDelayMs)
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
			onStreamDown({ kind: 'open-failed', error })
		}

		// Open the stream. Returns an Error if it could not be opened (the
		// caller decides what to do), otherwise attaches the lifecycle handlers.
		const openStream = async (): Promise<Error | undefined> => {
			const result: unknown = await (async () => {
				try {
					return await this.grpcClient.streamActivatedJobsStream(streamReq)
				} catch (e) {
					return { error: e }
				}
			})()
			const openError = getOpenError(result)
			if (openError) {
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
					try {
						const parsedJob = parseVariablesAndCustomHeadersToJSON<
							WorkerInputVariables,
							CustomHeaderShape
						>(res, inputVariableDto, customHeadersDto)
						handleJob(parsedJob)
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
									`Failed to fail job ${res.key} after a payload parse error: ${
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
					}
					onStreamDown(cause)
				},
			})
			this.streams.push(attachment)
			currentStream = attachment
			transition({ status: 'open' })
			return undefined
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
			await runPoll().catch((e) =>
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
			if (reconnectTimer) {
				clearTimeout(reconnectTimer)
				this.reconnectTimers.delete(reconnectTimer)
				reconnectTimer = undefined
			}
			if (currentStream) {
				discardStream(currentStream)
				currentStream.dispose()
				currentStream = undefined
			}
		}
		const handle: StreamHandle = createStreamHandle(machine, closeHandle)

		const pollAndStream = async (): Promise<StreamHandle> => {
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
				await runPoll()
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
				const schedulePoll = () => {
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
						runPoll()
							.catch(() => {
								// Swallow errors — the stream is the primary channel.
								// The next poll cycle will retry.
							})
							.finally(schedulePoll)
					}, pollInterval)
					this.pollTimers.push(sidecarTimer)
				}
				schedulePoll()
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
				const retryBackOff = isFailureConfig(conf) ? conf.retryBackOff ?? 0 : 0
				const _retries = isFailureConfig(conf) ? conf.retries ?? 0 : retries
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
					? e.errorMessage ?? ''
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
