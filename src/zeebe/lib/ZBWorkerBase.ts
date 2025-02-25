import { EventEmitter } from 'events'

import {
	ClientReadableStream,
	ClientReadableStreamImpl,
} from '@grpc/grpc-js/build/src/call'
import chalk, { Chalk } from 'chalk'
import d from 'debug'
import { Duration, MaybeTimeDuration } from 'typed-duration'
import * as uuid from 'uuid'

import { LosslessDto } from '../../lib'
import { ZeebeGrpcClient } from '../zb/ZeebeGrpcClient'

import {
	ConnectionStatusEvent,
	ConnectionStatusEventMap,
} from './ConnectionStatusEvent'
import { GrpcError } from './GrpcError'
import { StatefulLogInterceptor } from './StatefulLogInterceptor'
import { TypedEmitter } from './TypedEmitter'
import * as ZB from './interfaces-1.0'
import {
	ActivateJobsRequest,
	ActivateJobsResponse,
} from './interfaces-grpc-1.0'
import { ZBClientOptions } from './interfaces-published-contract'

import { parseVariablesAndCustomHeadersToJSON } from '.'

const debug = d('camunda:worker')
const verbose = d('camunda:worker:verbose')

debug('Loaded ZBWorkerBase')

const MIN_ACTIVE_JOBS_RATIO_BEFORE_ACTIVATING_JOBS = 0.3

const CapacityEvent = {
	Available: 'AVAILABLE',
	Empty: 'CAPACITY_EMPTY',
}

export interface ZBWorkerConstructorConfig<
	WorkerInputVariables,
	CustomHeaderShape,
	WorkerOutputVariables,
> {
	grpcClient: ZB.ZBGrpc
	id: string | null
	taskType: string
	options: ZB.ZBWorkerOptions<WorkerInputVariables> & ZBClientOptions
	idColor: Chalk
	zbClient: ZeebeGrpcClient
	log: StatefulLogInterceptor
	taskHandler: ZB.ZBWorkerTaskHandler<
		WorkerInputVariables,
		CustomHeaderShape,
		WorkerOutputVariables
	>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	inputVariableDto?: { new (...args: any[]): Readonly<WorkerInputVariables> }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	customHeadersDto?: { new (...args: any[]): Readonly<CustomHeaderShape> }
	tenantIds: string[] | [string] | undefined
}

export class ZBWorkerBase<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	WorkerInputVariables = any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	CustomHeaderShape = any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	WorkerOutputVariables = any,
> extends TypedEmitter<ConnectionStatusEventMap> {
	private static readonly DEFAULT_JOB_ACTIVATION_TIMEOUT =
		Duration.seconds.of(60)
	private static readonly DEFAULT_MAX_ACTIVE_JOBS = 32
	public activeJobs = 0
	public grpcClient: ZB.ZBGrpc
	public maxJobsToActivate: number
	public taskType: string
	public timeout: MaybeTimeDuration
	public pollCount = 0
	protected zbClient: ZeebeGrpcClient
	protected logger: StatefulLogInterceptor
	protected taskHandler: ZB.ZBWorkerTaskHandler<
		WorkerInputVariables,
		CustomHeaderShape,
		WorkerOutputVariables
	>
	protected cancelWorkflowOnException = false
	private closeCallback?: () => void
	private closePromise?: Promise<null>
	private closing = false
	private closed = false
	private id = uuid.v4()
	private longPoll: MaybeTimeDuration
	private debugMode: boolean
	private capacityEmitter: EventEmitter
	private stalled = false
	private connected = true
	private readied = false
	private jobStream?: ClientReadableStreamImpl<unknown>
	private activeJobsThresholdForReactivation: number
	private pollInterval: MaybeTimeDuration
	private pollLoop: NodeJS.Timeout
	private pollMutex: boolean = false
	private backPressureRetryCount: number = 0
	private fetchVariable: (keyof WorkerInputVariables)[] | undefined
	private inputVariableDto: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		new (obj: any): WorkerInputVariables
	}
	private customHeadersDto: {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		new (...args: any[]): CustomHeaderShape
	}
	private tenantIds: string[] | [string] | undefined
	private CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: number
	backoffTimeout: NodeJS.Timeout | undefined

	constructor({
		grpcClient,
		id,
		log,
		options,
		taskHandler,
		taskType,
		zbClient,
		inputVariableDto,
		customHeadersDto,
		tenantIds,
	}: ZBWorkerConstructorConfig<
		WorkerInputVariables,
		CustomHeaderShape,
		WorkerOutputVariables
	>) {
		super()
		options = options || {}
		this.tenantIds = tenantIds
		if (!taskType) {
			throw new Error('Missing taskType')
		}
		if (!taskHandler) {
			throw new Error('Missing taskHandler')
		}
		this.inputVariableDto =
			inputVariableDto ??
			(LosslessDto as {
				new (): WorkerInputVariables
			})
		this.customHeadersDto =
			customHeadersDto ??
			(LosslessDto as {
				new (): CustomHeaderShape
			})
		this.taskHandler = taskHandler
		this.taskType = taskType
		this.maxJobsToActivate =
			options.maxJobsToActivate || ZBWorkerBase.DEFAULT_MAX_ACTIVE_JOBS
		this.activeJobsThresholdForReactivation =
			this.maxJobsToActivate * MIN_ACTIVE_JOBS_RATIO_BEFORE_ACTIVATING_JOBS
		this.timeout =
			options.timeout || ZBWorkerBase.DEFAULT_JOB_ACTIVATION_TIMEOUT

		this.pollInterval = options.pollInterval!
		this.longPoll = options.longPoll!
		this.pollInterval = options.pollInterval!
		this.id = id || uuid.v4()
		// Set options.debug to true to count the number of poll requests for testing
		// See the Worker-LongPoll test
		this.debugMode = options.debug === true
		this.grpcClient = grpcClient
		const onError = () => {
			// options.onConnectionError?.()

			if (this.connected) {
				this.emit(ConnectionStatusEvent.connectionError)
				options.onConnectionError?.()
				this.connected = false
				this.readied = false
			}
		}
		this.grpcClient.on(ConnectionStatusEvent.connectionError, onError)
		const onReady = async () => {
			if (!this.readied) {
				this.emit(ConnectionStatusEvent.ready)
				options.onReady?.()
				this.readied = true
				this.connected = true
			}
		}
		this.grpcClient.on(ConnectionStatusEvent.unknown, onReady)
		this.grpcClient.on(ConnectionStatusEvent.ready, onReady)
		this.cancelWorkflowOnException = options.failProcessOnException ?? false
		this.zbClient = zbClient
		this.grpcClient.topologySync().catch((e) => {
			// Swallow exception to avoid throwing if retries are off
			if (e.thisWillNeverHappenYo) {
				this.emit(ConnectionStatusEvent.unknown)
			}
		})

		this.fetchVariable = options.fetchVariable

		this.logger = log
		this.capacityEmitter = new EventEmitter()
		this.CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS =
			options.CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS! // We assert because it is optional in the explicit arguments, but hydrated from env config with a default
		this.pollLoop = setInterval(
			() => this.poll(),
			Duration.milliseconds.from(this.pollInterval)
		)
		debug(
			`Created worker for task type ${taskType} - polling interval ${Duration.milliseconds.from(
				this.pollInterval
			)}`
		)
	}

	/**
	 * Returns a promise that the worker has stopped accepting tasks and
	 * has drained all current active tasks. Will reject if you try to call it more than once.
	 */
	public close(timeout?: number): Promise<null> {
		if (this.closePromise) {
			return this.closePromise
		}
		// eslint-disable-next-line no-async-promise-executor
		this.closePromise = new Promise(async (resolve) => {
			// this.closing prevents the worker from starting work on any new tasks
			this.closing = true
			clearInterval(this.pollLoop)
			clearTimeout(this.backoffTimeout)

			if (this.activeJobs <= 0) {
				await this.grpcClient.close(timeout)
				this.grpcClient.removeAllListeners()
				this.jobStream?.removeAllListeners()
				this.jobStream?.cancel?.()
				this.jobStream = undefined
				this.logger.logDebug('Cancelled Job Stream')
				resolve(null)
			} else {
				this.capacityEmitter.once(CapacityEvent.Empty, async () => {
					await this.grpcClient.close(timeout)
					this.grpcClient.removeAllListeners()
					this.emit(ConnectionStatusEvent.close)
					this.removeAllListeners()
					resolve(null)
				})
			}
		})
		return this.closePromise
	}

	public log(msg: ZB.JSON) {
		this.logger.logInfo(msg)
	}

	public debug(msg: ZB.JSON) {
		this.logger.logDebug(msg)
	}

	public error(msg: ZB.JSON) {
		this.logger.logError(msg)
	}

	protected drainOne() {
		this.activeJobs--
		this.logger.logDebug(`Load: ${this.activeJobs}/${this.maxJobsToActivate}`)

		const hasSufficientAvailableCapacityToRequestMoreJobs =
			this.activeJobs <= this.activeJobsThresholdForReactivation
		if (!this.closing && hasSufficientAvailableCapacityToRequestMoreJobs) {
			this.capacityEmitter.emit(CapacityEvent.Available)
		}
		if (this.closing && this.activeJobs === 0) {
			this.capacityEmitter.emit(CapacityEvent.Empty)
		}
		// If we are closing and hit zero active jobs, resolve the closing promise.
		if (this.activeJobs <= 0 && this.closing) {
			if (this.closeCallback && !this.closed) {
				this.closeCallback()
			}
		}
	}

	protected handleJobs(
		jobs: ZB.Job<WorkerInputVariables, CustomHeaderShape>[]
	) {
		this.log(jobs.length)
		throw new Error(
			'This method must be declared in a class that extends this base'
		)
	}

	protected makeCompleteHandlers<T>(
		thisJob: ZB.Job<WorkerInputVariables, CustomHeaderShape>
	): ZB.JobCompletionInterface<T> & ZB.JobCompletionInterface<T> {
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
					// tslint:disable-next-line: no-console
					console.log(
						chalk.red(`WARNING: Call to ${thisMethod}() after ${methodCalled}() was called.
You should call only one job action method in the worker handler. This is a bug in the ${this.taskType} worker handler.`)
					)
					return wrappedFunction(...args)
				}
				methodCalled = thisMethod
				return wrappedFunction(...args)
			}
		}

		const cancelWorkflow =
			(job: ZB.Job<WorkerInputVariables, CustomHeaderShape>) => () =>
				this.zbClient
					.cancelProcessInstance(job.processInstanceKey)
					.then(() => ZB.JOB_ACTION_ACKNOWLEDGEMENT)

		const failJob =
			(job: ZB.Job<WorkerInputVariables, CustomHeaderShape>) =>
			(conf: string | ZB.JobFailureConfiguration, retries?: number) => {
				const isFailureConfig = (
					_conf: string | ZB.JobFailureConfiguration
				): _conf is ZB.JobFailureConfiguration => typeof _conf === 'object'
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

		const succeedJob =
			(job: ZB.Job<WorkerInputVariables, CustomHeaderShape>) =>
			(completedVariables?: T) =>
				this.completeJob(job.key, completedVariables ?? {})

		const errorJob =
			(job: ZB.Job<WorkerInputVariables, CustomHeaderShape>) =>
			(e: string | ZB.ErrorJobWithVariables, errorMessage: string = '') => {
				const isErrorJobWithVariables = (
					s: string | ZB.ErrorJobWithVariables
				): s is ZB.ErrorJobWithVariables => typeof s === 'object'
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
				this.drainOne()
				return ZB.JOB_ACTION_ACKNOWLEDGEMENT
			}),
		}
	}

	private failJob({
		job,
		errorMessage,
		retries,
		retryBackOff,
		variables,
	}: {
		job: ZB.Job<WorkerInputVariables, CustomHeaderShape>
		errorMessage: string
		retries?: number
		retryBackOff?: number
		variables?: ZB.JSONDoc
	}) {
		return this.zbClient
			.failJob({
				errorMessage,
				jobKey: job.key,
				retries: retries ?? job.retries - 1,
				retryBackOff: retryBackOff ?? 0,
				variables: variables ?? {},
			})
			.then(() => ZB.JOB_ACTION_ACKNOWLEDGEMENT)
			.finally(() => {
				this.logger.logDebug(`Failed job ${job.key} - ${errorMessage}`)
				this.drainOne()
			})
	}

	private completeJob(jobKey: string, completedVariables = {}) {
		return this.zbClient
			.completeJob({
				jobKey,
				variables: completedVariables,
			})
			.then((res) => {
				this.logger.logDebug(`Completed job ${jobKey} for ${this.taskType}`)
				return res
			})
			.catch((e) => {
				this.logger.logDebug(
					`Completing job ${jobKey} for ${this.taskType} threw ${e.message}`
				)
				throw e
			})
			.then(() => ZB.JOB_ACTION_ACKNOWLEDGEMENT)
			.finally(() => {
				this.drainOne()
			})
	}

	private errorJob({
		errorCode,
		errorMessage,
		job,
		variables,
	}: {
		job: ZB.Job<WorkerInputVariables, CustomHeaderShape>
		errorCode: string
		errorMessage: string
		variables: ZB.JSONDoc
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
				this.drainOne()
				return ZB.JOB_ACTION_ACKNOWLEDGEMENT
			})
	}

	private handleStreamEnd = (id) => {
		this.jobStream?.removeAllListeners()
		this.jobStream = undefined
		this.logger.logDebug(
			`Deleted job stream [${id}] listeners and job stream reference`
		)
	}

	private async poll() {
		const pollAlreadyInProgress = this.pollMutex || this.jobStream !== undefined
		const workerIsClosing = !!this.closePromise || this.closing
		const insufficientCapacityAvailable =
			this.activeJobs > this.activeJobsThresholdForReactivation

		if (
			pollAlreadyInProgress ||
			workerIsClosing ||
			insufficientCapacityAvailable
		) {
			verbose('Worker polling blocked', {
				pollAlreadyInProgress,
				workerIsClosing,
				insufficientCapacityAvailable,
			})
			return
		}

		this.pollMutex = true
		debug('Polling...')
		this.logger.logDebug('Activating Jobs...')
		const id = uuid.v4()
		const jobStream = await this.activateJobs(id)
		const start = Date.now()
		this.logger.logDebug(
			`Long poll loop. this.longPoll: ${Duration.value.of(this.longPoll)}`,
			id,
			start
		)

		let doBackoff = false
		if (jobStream.stream) {
			this.logger.logDebug(`Stream [${id}] opened...`)
			this.jobStream = jobStream.stream

			jobStream.stream.on('error', (error) => {
				this.pollMutex = true
				this.logger.logDebug(
					`Stream [${id}] error after ${(Date.now() - start) / 1000} seconds`,
					error
				)
				const errorCode = (error as Error & { code: number }).code
				// Backoff on
				const backoffErrorCodes: number[] = [
					GrpcError.RESOURCE_EXHAUSTED,
					GrpcError.INTERNAL,
					GrpcError.UNAUTHENTICATED,
				]
				doBackoff = backoffErrorCodes.includes(errorCode)
				this.emit('streamError', error)
				if (doBackoff) {
					const backoffDuration = Math.min(
						this.CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS,
						1000 * 2 ** this.backPressureRetryCount++
					)

					this.emit('backoff', backoffDuration)
					this.logger.logInfo(
						`Backing off worker poll due to failure. Next attempt will be made in ${backoffDuration}ms...`
					)

					setTimeout(() => {
						this.handleStreamEnd(id)
						this.pollMutex = false
					}, backoffDuration)
				} else {
					this.handleStreamEnd(id)
					this.pollMutex = false
				}
			})

			// This event happens when the server cancels the call after the deadline
			// And when it has completed a response with work
			// And also after an error event.
			jobStream.stream.on('end', () => {
				this.logger.logDebug(
					`Stream [${id}] ended after ${(Date.now() - start) / 1000} seconds`
				)
				this.handleStreamEnd(id)
			})
		}

		if (jobStream.error) {
			const error = jobStream.error!.message
			const message = 'Grpc Stream Error: '
			const backoffErrorCodes: string[] = [
				`${message}${GrpcError.RESOURCE_EXHAUSTED}`,
				`${message}${GrpcError.INTERNAL}`,
				`${message}${GrpcError.UNAUTHENTICATED}`,
			]
			doBackoff = backoffErrorCodes.map((e) => error.includes(e)).includes(true)
			const backoffDuration = Math.min(
				this.CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS,
				1000 * 2 ** this.backPressureRetryCount++
			)
			this.logger.logError({ id, error })
			if (doBackoff) {
				this.emit('backoff', backoffDuration)
				this.backoffTimeout = setTimeout(() => {
					this.handleStreamEnd(id)
					this.pollMutex = false
				}, backoffDuration)
			}
		} else {
			this.pollMutex = false
		}
	}

	private async activateJobs(id: string) {
		if (this.stalled) {
			debug('Stalled')
			return { stalled: true as const }
		}
		if (this.closing) {
			debug('Closing')
			return {
				closing: true as const,
			}
		}

		if (this.debugMode) {
			this.logger.logDebug('Activating Jobs...')
		}
		debug('Activating Jobs')
		let stream: ClientReadableStream<unknown> & { error?: Error }

		const amount = this.maxJobsToActivate - this.activeJobs

		const requestTimeout = this.longPoll ?? -1

		const activateJobsRequest: ActivateJobsRequest = {
			maxJobsToActivate: amount,
			requestTimeout,
			timeout: this.timeout,
			type: this.taskType,
			worker: this.id,
			fetchVariable: this.fetchVariable as string[],
			tenantIds: this.tenantIds,
		}

		this.logger.logDebug(
			`Requesting ${amount} jobs on [${id}] with requestTimeout ${Duration.value.of(
				requestTimeout
			)}, job timeout: ${Duration.value.of(this.timeout)}`
		)
		debug(
			`Requesting ${amount} jobs on [${id}] with requestTimeout ${Duration.value.of(
				requestTimeout
			)}, job timeout: ${Duration.value.of(this.timeout)}`
		)

		try {
			stream = await this.grpcClient.activateJobsStream(activateJobsRequest)

			if (this.debugMode) {
				this.pollCount++
			}
		} catch (error: unknown) {
			return {
				error: error as Error,
			}
		}

		if (stream.error) {
			debug('Stream error', stream.error)
			return { error: stream.error as Error }
		}

		stream.on('data', this.handleJobResponse)
		return { stream }
	}

	private handleJobResponse = (res: ActivateJobsResponse) => {
		// If we are closing, don't start working on these jobs. They will have to be timed out by the server.
		if (this.closing) {
			return
		}
		/**
		 * At this point we know that we have a working connection to the server, so we can reset the backpressure retry count.
		 * Putting it here means that if we have a lot of connection errors and increment the backpressure count,
		 * then get a connection, but no jobs are activated, and before any jobs are activated we get another error condition
		 * then the backoff will start not from 0, but from the level of backoff we were at previously.
		 */
		this.backPressureRetryCount = 0
		this.activeJobs += res.jobs.length

		Promise.all(
			res.jobs
				.map((job) =>
					parseVariablesAndCustomHeadersToJSON<
						WorkerInputVariables,
						CustomHeaderShape
					>(job, this.inputVariableDto, this.customHeadersDto)
						.then((job) => job)
						.catch((e) => {
							this.zbClient.failJob({
								jobKey: job.key,
								errorMessage: `Error parsing variable payload: ${e}`,
								retries: job.retries - 1,
								retryBackOff: 0,
							})
							return null
						})
				)
				.filter(
					(f): f is Promise<ZB.Job<WorkerInputVariables, CustomHeaderShape>> =>
						!!f
				)
		).then((jobs) => this.handleJobs(jobs))
	}
}
