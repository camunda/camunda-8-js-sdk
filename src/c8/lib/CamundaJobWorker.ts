import { EventEmitter } from 'events'

import PCancelable from 'p-cancelable'
import TypedEmitter from 'typed-emitter'

import { LosslessDto } from '../../lib'
import {
	ActivateJobsRequest,
	IProcessVariables,
	JobCompletionInterfaceRest,
	MustReturnJobActionAcknowledgement,
} from '../../zeebe/types'

import { Ctor, JobWithMethods, RestJob } from './C8Dto'
import { getLogger, Logger } from './C8Logger'
import { CamundaRestClient } from './CamundaRestClient'

type CamundaJobWorkerEvents = {
	pollError: (error: Error) => void
	start: () => void
	stop: () => void
	poll: ({
		currentlyActiveJobCount,
		maxJobsToActivate,
		worker,
	}: {
		/** How many jobs are currently activated */
		currentlyActiveJobCount: number
		/** The max number of jobs we are requesting to activate */
		maxJobsToActivate: number
		/** The worker name */
		worker: string
	}) => void
	backoff: (backoffDuration: number) => void
	work: (jobs: RestJob<unknown, unknown>[]) => void
}

export interface CamundaJobWorkerConfig<
	VariablesDto extends LosslessDto,
	CustomHeadersDto extends LosslessDto,
> extends ActivateJobsRequest {
	/** An optional {@link LosslessDto} class to decode the job variables. This provides both runtime safety for `int64` numbers and design-time type hinting. */
	inputVariableDto?: Ctor<VariablesDto>
	/** An optional {@link LosslessDto} class to decode the job custom headers. This provides both runtime safety for `int64` numbers and design-time type hinting. */
	customHeadersDto?: Ctor<CustomHeadersDto>
	/** How often the worker will poll for new jobs. Defaults to 300ms. */
	pollIntervalMs?: number
	/**
	 * A callback function that is invoked for an activated job. All return paths must return the output from one of the job acknowledgement methods.
	 * This is done to ensure that job handlers do not have logic paths that neglect to acknowledge the job.
	 */
	jobHandler: (
		job: RestJob<VariablesDto, CustomHeadersDto> &
			JobCompletionInterfaceRest<IProcessVariables>,
		log: Logger
	) => MustReturnJobActionAcknowledgement
	/** An optional logger instance. */
	logger?: Logger
	/** Default: true. Start the worker polling immediately. If set to `false`, call the worker's `start()` method to start polling for work. */
	autoStart?: boolean
	/**
	 * The worker will back off polling for jobs if the poll request fails. This is to prevent overwhelming the broker with requests.
	 * The backoff time will double with each failed request, up to the maximum backoff time.
	 * The backoff time will be reset to the initial poll interval when a successful request is made.
	 * This can be set explicitly here, or it will be set to the value of `CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS` in the environment.
	 */
	maxBackoffTimeMs?: number
}

export class CamundaJobWorker<
	VariablesDto extends LosslessDto,
	CustomHeadersDto extends LosslessDto,
> extends (EventEmitter as new () => TypedEmitter<CamundaJobWorkerEvents>) {
	public currentlyActiveJobCount = 0
	public capacity: number
	private loopHandle?: NodeJS.Timeout
	private pollInterval: number
	private pollLock: boolean = false
	private backoffTimer: NodeJS.Timeout | undefined
	private backoffRetryCount: number = 0
	private maxBackoffTimeMs: number
	public log: Logger
	logMeta: () => {
		worker: string
		type: string
		pollIntervalMs: number
		capacity: number
		currentload: number
	}
	stopping: boolean = false
	private activePoll?: PCancelable<
		JobWithMethods<VariablesDto, CustomHeadersDto>[]
	>

	constructor(
		private readonly config: CamundaJobWorkerConfig<
			VariablesDto,
			CustomHeadersDto
		>,
		private readonly restClient: CamundaRestClient
	) {
		super()
		this.pollInterval = config.pollIntervalMs ?? 300
		this.capacity = this.config.maxJobsToActivate
		this.maxBackoffTimeMs =
			config.maxBackoffTimeMs ??
			restClient.getConfig().CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS
		this.log = getLogger({ logger: config.logger ?? restClient.log })
		this.logMeta = () => ({
			worker: this.config.worker,
			type: this.config.type,
			pollIntervalMs: this.pollInterval,
			capacity: this.config.maxJobsToActivate,
			currentload: this.currentlyActiveJobCount,
		})
		this.log.debug(`Created REST Job Worker`, this.logMeta())
		if (config.autoStart ?? true) {
			this.start()
		}
	}

	start() {
		this.log.debug(`Starting poll loop`, this.logMeta())
		this.emit('start')
		this.stopping = false
		this.poll()
		this.loopHandle = setInterval(() => this.poll(), this.pollInterval)
	}

	/** Stops the Job Worker polling for more jobs. If await this call, and it will return as soon as all currently active jobs are completed.
	 * The deadline for all currently active jobs to complete is 30s by default. If the active jobs do not complete by the deadline, this method will throw.
	 */
	async stop(deadlineMs = 30000) {
		this.log.debug(`Stop requested`, this.logMeta())
		this.stopping = true
		/** Stopping polling for new jobs */
		clearInterval(this.loopHandle)
		clearTimeout(this.backoffTimer)
		/** Do not allow the backoff retry to restart polling */
		clearTimeout(this.backoffTimer)
		// Cancel the active poll if it exists
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/424
		if (this.activePoll && !this.activePoll.isCanceled) {
			// I'm not sure that this will actually catch any thrown error, because the cancellation happens in a different context.
			try {
				this.activePoll.cancel('Worker stopped')
				this.log.debug(`Active poll cancelled`, this.logMeta())
			} catch (error) {
				this.log.error(
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					`Error while cancelling active poll: ${(error as any).message}`,
					{
						error,
						...this.logMeta(),
					}
				)
			} finally {
				this.activePoll = undefined
			}
		}

		return new Promise((resolve, reject) => {
			if (this.currentlyActiveJobCount === 0) {
				this.log.debug(`All jobs drained. Worker stopped.`, this.logMeta())
				this.emit('stop')
				return resolve(null)
			}
			/** This is an error timeout - if we don't complete all active jobs before the specified deadline, we reject the Promise */
			const timeout = setTimeout(() => {
				clearInterval(wait)
				this.log.debug(
					`Failed to drain all jobs in ${deadlineMs}ms`,
					this.logMeta()
				)
				return reject(`Failed to drain all jobs in ${deadlineMs}ms`)
			}, deadlineMs)
			/** Check every 500ms to see if our active job count has hit zero, i.e: all active work is stopped */
			const wait = setInterval(() => {
				if (this.currentlyActiveJobCount === 0) {
					this.log.debug(`All jobs drained. Worker stopped.`, this.logMeta())
					clearInterval(wait)
					clearTimeout(timeout)
					this.emit('stop')
					return resolve(null)
				}
				this.log.debug(
					`Stopping - waiting for active jobs to complete.`,
					this.logMeta()
				)
			}, 500)
		})
	}

	private poll() {
		if (this.pollLock || this.stopping) {
			return
		}
		this.emit('poll', {
			currentlyActiveJobCount: this.currentlyActiveJobCount,
			maxJobsToActivate: this.config.maxJobsToActivate,
			worker: this.config.worker,
		})
		this.pollLock = true
		if (this.currentlyActiveJobCount >= this.config.maxJobsToActivate) {
			this.log.debug(`At capacity - not requesting more jobs`, this.logMeta())
			this.pollLock = false
			return
		}

		this.log.trace(`Polling for jobs`, this.logMeta())

		const remainingJobCapacity =
			this.config.maxJobsToActivate - this.currentlyActiveJobCount
		this.activePoll = this.restClient.activateJobs({
			...this.config,
			maxJobsToActivate: remainingJobCapacity,
		})

		this.activePoll
			.then((jobs) => {
				const count = jobs.length
				this.currentlyActiveJobCount += count
				this.log.debug(`Activated ${count} jobs`, this.logMeta())
				this.emit('work', jobs)
				// The job handlers for the activated jobs will run in parallel
				jobs.forEach((job) => this.handleJob(job))
				this.pollLock = false
				this.backoffRetryCount = 0
			})
			.catch((e) => {
				// If the poll was cancelled because the worker is stopping, we don't need to log an error — the canceled promise rejection is expected.
				// https://github.com/camunda/camunda-8-js-sdk/issues/432
				if (this.stopping && e.code === 'ERR_CANCELED') {
					return
				}
				// This can throw a 400, 401, or 500 REST Error with the Content-Type application/problem+json
				// The schema is:
				// { type: string, title: string, status: number, detail: string, instance: string }
				this.log.error('Error during job worker poll')
				this.log.error(e)
				this.emit('pollError', e)
				this.activePoll = undefined
				const backoffDuration = Math.min(
					2000 * ++this.backoffRetryCount,
					this.maxBackoffTimeMs
				)
				this.log.warn(
					`Backing off worker poll due to failure. Next attempt will be made in ${backoffDuration}ms...`
				)
				this.emit('backoff', backoffDuration)
				this.backoffTimer = setTimeout(() => {
					this.pollLock = false
					this.poll()
				}, backoffDuration)
			})
	}

	private async handleJob(
		job: RestJob<VariablesDto, CustomHeadersDto> &
			JobCompletionInterfaceRest<IProcessVariables>
	) {
		try {
			this.log.debug(
				`Invoking job handler for job ${job.jobKey}`,
				this.logMeta()
			)
			await this.config.jobHandler(job, this.log)
			this.log.debug(
				`Completed job handler for job ${job.jobKey}.`,
				this.logMeta()
			)
		} catch (e) {
			/** Unhandled exception in the job handler */
			if (e instanceof Error) {
				// If err is an instance of Error, we can safely access its properties
				this.log.error(
					`Unhandled exception in job handler for job ${job.jobKey}`,
					this.logMeta()
				)
				this.log.error(`Error: ${e.message}`, {
					stack: e.stack,
					...this.logMeta(),
				})
			} else {
				// If err is not an Error, log it as is
				this.log.error(
					'An unknown error occurred while executing a job handler',
					{ error: e, ...this.logMeta() }
				)
			}
			this.log.error(`Failing the job`, this.logMeta())
			await job.fail({
				errorMessage: (e as Error).toString(),
				retries: job.retries - 1,
			})
		} finally {
			/** Decrement the active job count in all cases */
			this.currentlyActiveJobCount--
		}
	}
}
