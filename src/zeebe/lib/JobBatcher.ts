import { ZBBatchWorker } from '../zb/ZBBatchWorker'

import { BatchedJob, ZBBatchWorkerTaskHandler } from './interfaces-1.0'
import { Queue } from './Queue'

export class JobBatcher<T, V, P> {
	private batchedJobs: Queue<BatchedJob<T, V, P>> = new Queue()
	private handler: ZBBatchWorkerTaskHandler<T, V, P>
	private timeout: number
	private batchSize: number
	private worker: ZBBatchWorker<T, V, P>
	private batchExecutionTimerHandle?: NodeJS.Timeout
	constructor({
		handler,
		timeout,
		batchSize,
		worker,
	}: {
		handler: ZBBatchWorkerTaskHandler<T, V, P>
		timeout: number
		batchSize: number
		worker: ZBBatchWorker<T, V, P>
	}) {
		this.handler = handler
		this.timeout = timeout
		this.batchSize = batchSize
		this.worker = worker
	}

	public batch(batch: BatchedJob<T, V, P>[]) {
		if (!this.batchExecutionTimerHandle) {
			this.batchExecutionTimerHandle = setTimeout(
				() => this.execute(),
				this.timeout * 1000
			)
		}
		batch.forEach(this.batchedJobs.push)
		if (this.batchedJobs.length() >= this.batchSize) {
			clearTimeout(this.batchExecutionTimerHandle)
			this.execute()
		}
	}

	private execute() {
		this.batchExecutionTimerHandle = undefined
		this.worker.debug(
			`Executing batched handler with ${this.batchedJobs.length()} jobs`
		)
		try {
			this.handler(this.batchedJobs.drain(), this.worker)
		} catch (err: unknown) {
			const e = err as Error
			this.worker.error(
				'An unhandled exception occurred in the worker task handler!'
			)
			this.worker.error(e.message)
			this.worker.error(e.toString())
		}
	}
}
