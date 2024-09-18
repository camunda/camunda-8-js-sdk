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

	constructor(
		private readonly config: C8JobWorkerConfig<VariablesDto, CustomHeadersDto>,
		private readonly restClient: C8RestClient
	) {
		this.pollInterval = config.pollIntervalMs ?? 30000
		this.capacity = this.config.maxJobsToActivate
		this.log = getLogger({ logger: config.logger })
		this.log.debug(
			`Created REST Job Worker '${this.config.worker}' for job type '${this.config.type}', polling every ${this.pollInterval}ms, capacity ${this.config.maxJobsToActivate}`
		)
	}

	start() {
		this.log.debug(
			`Starting poll loop for worker '${this.config.worker}', polling for job type '${this.config.type}' every ${this.pollInterval}ms`
		)
		this.poll()
		this.loopHandle = setInterval(() => this.poll, this.pollInterval)
	}

	async stop(timeoutMs = 30000) {
		const worker = this.config.worker
		this.log.debug(
			`Stop requested for worker '${worker}', working on job type '${this.config.type}'`
		)
		clearInterval(this.loopHandle)
		return new Promise((resolve, reject) => {
			if (this.currentlyActiveJobCount === 0) {
				this.log.debug(`Worker '${worker}' - all jobs drained. Worker stopped.`)
				return resolve(null)
			}
			this.log.debug(
				`Worker '${worker}' - ${this.currentlyActiveJobCount} jobs currently active.`
			)
			const timeout = setTimeout(() => {
				clearInterval(wait)
				return reject(`Failed to drain all jobs in ${timeoutMs}ms`)
			}, timeoutMs)
			const wait = setInterval(() => {
				if (this.currentlyActiveJobCount === 0) {
					this.log.debug(
						`Worker '${worker}' - all jobs drained. Worker stopped.`
					)
					clearInterval(wait)
					clearTimeout(timeout)
					return resolve(null)
				}
				this.log.debug(
					`Worker '${worker}' - ${this.currentlyActiveJobCount} jobs currently active.`
				)
			}, 1000)
		})
	}

	private poll() {
		if (this.currentlyActiveJobCount >= this.config.maxJobsToActivate) {
			this.log.debug(
				`Worker '${this.config.worker}' at capacity ${this.currentlyActiveJobCount} for job type '${this.config.type}'`
			)
			return
		}

		this.log.silly(
			`Worker: '${this.config.worker}' for job type '${this.config.type}' polling for jobs`
		)

		const remainingJobCapacity =
			this.config.maxJobsToActivate - this.currentlyActiveJobCount
		this.restClient
			.activateJobs({
				...this.config,
				maxJobsToActivate: remainingJobCapacity,
			})
			.then((jobs) => {
				const count = jobs.length
				this.log.debug(
					`Worker '${this.config.worker}' for job type '${this.config.type}' activated ${count} jobs`
				)
				this.currentlyActiveJobCount += count
				// The job handlers for the activated jobs will run in parallel
				jobs.forEach((job) => this.handleJob(job))
			})
	}

	private async handleJob(
		job: Job<VariablesDto, CustomHeadersDto> &
			JobCompletionInterfaceRest<IProcessVariables>
	) {
		try {
			this.log.debug(
				`Invoking job handler for job ${job.key} of type '${job.type}'`
			)
			await this.config.jobHandler(job, this.log)
			this.log.debug(
				`Completed job handler for job ${job.key} of type '${job.type}'.`
			)
		} catch (e) {
			/** Unhandled exception in the job handler */
			this.log.error(
				`Unhandled exception in job handler for job ${job.key} - Worker: ${this.config.worker} for job type: '${this.config.type}'`
			)
			this.log.error(e)
			this.log.error((e as Error).stack)
			this.log.error(`Failing the job`)
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
