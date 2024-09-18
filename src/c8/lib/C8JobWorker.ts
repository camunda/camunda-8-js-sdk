import winston from 'winston'

import { LosslessDto } from '../../lib'
import {
	ActivateJobsRequest,
	IProcessVariables,
	Job,
	JobCompletionInterfaceRest,
	MustReturnJobActionAcknowledgement,
} from '../../zeebe/types'

import { Ctor } from './C8Dto'
import { getLogger } from './C8Logger'
import { C8RestClient } from './C8RestClient'

export interface C8JobWorkerConfig<
	VariablesDto extends LosslessDto,
	CustomHeadersDto extends LosslessDto,
> extends ActivateJobsRequest {
	inputVariableDto?: Ctor<VariablesDto>
	customHeadersDto?: Ctor<CustomHeadersDto>
	/** How often the worker will poll for new jobs. Defaults to 30s */
	pollIntervalMs?: number
	jobHandler: (
		job: Job<VariablesDto, CustomHeadersDto> &
			JobCompletionInterfaceRest<IProcessVariables>,
		log: winston.Logger
	) => MustReturnJobActionAcknowledgement
	logger?: winston.Logger
}

export class C8JobWorker<
	VariablesDto extends LosslessDto,
	CustomHeadersDto extends LosslessDto,
> {
	public currentlyActiveJobCount = 0
	public capacity: number
	private loopHandle?: NodeJS.Timeout
	private pollInterval: number
	private log: winston.Logger
	logMeta: () => {
		worker: string
		type: string
		pollInterval: number
		capacity: number
		currentload: number
	}

	constructor(
		private readonly config: C8JobWorkerConfig<VariablesDto, CustomHeadersDto>,
		private readonly restClient: C8RestClient
	) {
		this.pollInterval = config.pollIntervalMs ?? 30000
		this.capacity = this.config.maxJobsToActivate
		this.log = getLogger({ logger: config.logger })
		this.logMeta = () => ({
			worker: this.config.worker,
			type: this.config.type,
			pollInterval: this.pollInterval,
			capacity: this.config.maxJobsToActivate,
			currentload: this.currentlyActiveJobCount,
		})
		this.log.debug(`Created REST Job Worker`, this.logMeta())
	}

	start() {
		this.log.debug(`Starting poll loop`, this.logMeta())
		this.poll()
		this.loopHandle = setInterval(() => this.poll, this.pollInterval)
	}

	/** Stops the Job Worker polling for more jobs. If await this call, and it will return as soon as all currently active jobs are completed.
	 * The deadline for all currently active jobs to complete is 30s by default. If the active jobs do not complete by the deadline, this method will throw.
	 */
	async stop(deadlineMs = 30000) {
		this.log.debug(`Stop requested`, this.logMeta())
		/** Stopping polling for new jobs */
		clearInterval(this.loopHandle)
		return new Promise((resolve, reject) => {
			if (this.currentlyActiveJobCount === 0) {
				this.log.debug(`All jobs drained. Worker stopped.`, this.logMeta())
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
		if (this.currentlyActiveJobCount >= this.config.maxJobsToActivate) {
			this.log.debug(`At capacity - not requesting more jobs`, this.logMeta())
			return
		}

		this.log.silly(`Polling for jobs`, this.logMeta())

		const remainingJobCapacity =
			this.config.maxJobsToActivate - this.currentlyActiveJobCount
		this.restClient
			.activateJobs({
				...this.config,
				maxJobsToActivate: remainingJobCapacity,
			})
			.then((jobs) => {
				const count = jobs.length
				this.currentlyActiveJobCount += count
				this.log.debug(`Activated ${count} jobs`, this.logMeta())
				// The job handlers for the activated jobs will run in parallel
				jobs.forEach((job) => this.handleJob(job))
			})
	}

	private async handleJob(
		job: Job<VariablesDto, CustomHeadersDto> &
			JobCompletionInterfaceRest<IProcessVariables>
	) {
		try {
			this.log.debug(`Invoking job handler for job ${job.key}`, this.logMeta())
			await this.config.jobHandler(job, this.log)
			this.log.debug(
				`Completed job handler for job ${job.key}.`,
				this.logMeta()
			)
		} catch (e) {
			/** Unhandled exception in the job handler */
			if (e instanceof Error) {
				// If err is an instance of Error, we can safely access its properties
				this.log.error(
					`Unhandled exception in job handler for job ${job.key}`,
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
