import * as ZB from '../lib/interfaces-1.0'
import { ZBWorkerBase, ZBWorkerConstructorConfig } from '../lib/ZBWorkerBase'

export class ZBWorker<
	WorkerInputVariables,
	CustomHeaderShape,
	WorkerOutputVariables,
> extends ZBWorkerBase<
	WorkerInputVariables,
	CustomHeaderShape,
	WorkerOutputVariables
> {
	constructor(
		config: ZBWorkerConstructorConfig<
			WorkerInputVariables,
			CustomHeaderShape,
			WorkerOutputVariables
		>
	) {
		super(config)
	}

	protected async handleJobs(
		jobs: ZB.Job<WorkerInputVariables, CustomHeaderShape>[]
	) {
		// Call task handler for each new job
		await Promise.all(jobs.map((job) => this.handleJob(job)))
	}

	protected async handleJob(
		job: ZB.Job<WorkerInputVariables, CustomHeaderShape>
	) {
		try {
			/**
			 * complete.success(variables?: object) and complete.failure(errorMessage: string, retries?: number)
			 *
			 * To halt execution of the business process and raise an incident in Operate, call
			 * complete.failure(errorMessage, 0)
			 */

			const workerCallback = this.makeCompleteHandlers(job)

			await (
				this.taskHandler as ZB.ZBWorkerTaskHandler<
					WorkerInputVariables,
					CustomHeaderShape,
					WorkerOutputVariables
				>
			)(
				{
					...job,
					cancelWorkflow: workerCallback.cancelWorkflow,
					complete: workerCallback.complete,
					fail: workerCallback.fail,
					error: workerCallback.error,
					forward: workerCallback.forward,
				},
				this
			)
		} catch (e: unknown) {
			this.logger.logError(
				`Caught an unhandled exception in a task handler for process instance ${job.processInstanceKey}:`
			)
			this.logger.logDebug(job)
			// If the exception has a details field, log it
			// This is the case for exceptions thrown when the job is not found. The details field contains an explanation.
			const hasDetails = (e: unknown): e is { details?: string } =>
				!!(e as { details: string }).details
			if (hasDetails(e)) {
				this.logger.logError(e.details)
			} else {
				this.logger.logError((e as Error).message)
			}
			if (this.cancelWorkflowOnException) {
				const { processInstanceKey } = job
				this.logger.logDebug(
					`Cancelling process instance ${processInstanceKey}`
				)
				try {
					await this.zbClient.cancelProcessInstance(processInstanceKey)
				} catch (cancelErr) {
					this.logger.logError(`Cancel failed: ${(cancelErr as Error).message}`)
				} finally {
					this.drainOne()
				}
				return
			} else {
				const message = (e as Error).message
				// This is *most probably* an error thrown because the job was not found when job.complete() or job.fail() was called.
				// It could also happen in some cases where the handler does another operation that returns an error with the same code.
				if (
					message.includes('5 NOT_FOUND') &&
					message.includes(job.key) &&
					(message.includes('COMPLETE') || message.includes('FAIL'))
				) {
					this.logger.logDebug(
						`Job ${job.key} was already completed or failed, or the process instance was cancelled. Ignoring.`
					)
					this.drainOne()
					return
				}
				this.logger.logInfo(`Failing job ${job.key} due to unhandled exception`)
				const retries = job.retries - 1
				try {
					await this.zbClient.failJob({
						errorMessage: `Unhandled exception in task handler ${e}`,
						jobKey: job.key,
						retries,
						retryBackOff: 0,
					})
					this.logger.logInfo(`Failed job ${job.key}, retries left: ${retries}`)
				} catch (failErr) {
					this.logger.logError(
						`Error calling failJob: ${(failErr as Error).message}`
					)
				} finally {
					this.drainOne()
					return
				}
			}
		}
	}
}
