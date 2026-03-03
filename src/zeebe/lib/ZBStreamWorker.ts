import { ClientReadableStream } from '@grpc/grpc-js'
import chalk from 'chalk'

import { ZeebeGrpcClient } from '../zb/ZeebeGrpcClient'

import { StatefulLogInterceptor } from './StatefulLogInterceptor'
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

export class ZBStreamWorker implements IZBJobWorker {
	private grpcClient: ZBGrpc
	private logger: StatefulLogInterceptor
	private zbClient: ZeebeGrpcClient
	private streams: ClientReadableStream<unknown>[] = []
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
			console.log(`Missing ZBClient`)
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
			 * Maximum number of jobs to activate in the initial poll before opening
			 * the stream. This picks up jobs that were created before the stream was
			 * established. Defaults to 32.
			 */
			initialPollMaxJobsToActivate?: number
		}
	) {
		const {
			taskHandler,
			inputVariableDto,
			customHeadersDto,
			jitter,
			initialPollMaxJobsToActivate = 32,
			...streamReq
		} = req

		const handleJob = (job: Job<WorkerInputVariables, CustomHeaderShape>) => {
			taskHandler(
				{
					...job,
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					...this.makeCompleteHandlers(job as any, req.type),
				},
				this
			)
		}

		const pollAndStream = async () => {
			// Optional jitter to stagger multiple workers
			if (jitter) {
				await new Promise((resolve) =>
					setTimeout(resolve, Math.random() * jitter)
				)
			}

			// Open the stream first so no new jobs are missed
			const stream = await this.grpcClient.streamActivatedJobsStream(streamReq)
			stream.on('error', (e) => {
				console.error(e)
			})
			stream.on('data', (res: ActivatedJob) => {
				parseVariablesAndCustomHeadersToJSON<
					WorkerInputVariables,
					CustomHeaderShape
				>(res, inputVariableDto, customHeadersDto)
					.then(handleJob)
					.catch((e) =>
						this.zbClient.failJob({
							jobKey: res.key,
							errorMessage: `Error parsing variable payload ${e}`,
							retries: res.retries - 1,
							retryBackOff: 0,
						})
					)
			})
			this.streams.push(stream)

			// Now poll for any jobs that existed before the stream was opened.
			// The broker guarantees single activation, so there is no risk of
			// duplicate delivery between the poll and the stream.
			const existingJobs = await this.zbClient.activateJobs<
				WorkerInputVariables,
				CustomHeaderShape
			>({
				type: req.type,
				worker: req.worker,
				timeout: req.timeout,
				maxJobsToActivate: initialPollMaxJobsToActivate,
				tenantIds: req.tenantIds,
				fetchVariable: req.fetchVariable,
				inputVariableDto,
				customHeadersDto,
				requestTimeout: -1,
			})

			for (const job of existingJobs) {
				handleJob(job)
			}

			return {
				close: () => {
					stream.cancel()
					stream.destroy()
				},
			}
		}

		return pollAndStream()
	}

	close() {
		this.streams.forEach((s) => {
			s.cancel()
			s.destroy()
		})
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
					// tslint:disable-next-line: no-console
					console.log(
						chalk.red(`WARNING: Call to ${thisMethod}() after ${methodCalled}() was called.
You should call only one job action method in the worker handler. This is a bug in a Stream worker handler.`)
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
				return e
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
