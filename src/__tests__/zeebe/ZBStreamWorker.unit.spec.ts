import { EventEmitter } from 'events'

import { LosslessDto } from '../../lib'
import { allowAny } from '../../test-support/testTags'
import { ZBStreamWorker } from '../../zeebe/lib/ZBStreamWorker'

/**
 * Regression test for https://github.com/camunda/camunda-8-js-sdk/issues/828
 *
 * `ZBStreamWorker` appended every scheduled sidecar poll timer to
 * `pollTimers` and only emptied the array in `close()`. A long-lived worker
 * retained one dead timer per poll cycle per stream. The fix removes the
 * timer that just fired before the next one is scheduled, so the array holds
 * only live timers — one per stream.
 */

// A minimal stand-in for a gRPC ClientReadableStream.
const createMockStream = () => {
	const emitter = new EventEmitter()
	return Object.assign(emitter, {
		cancel: vi.fn(),
		destroy: vi.fn(),
	})
}

const createWorker = () => {
	const grpcClient = {
		streamActivatedJobsStream: vi.fn().mockResolvedValue(createMockStream()),
		close: vi.fn().mockResolvedValue(undefined),
	}
	const zbClient = {
		activateJobs: vi.fn().mockResolvedValue([]),
		failJob: vi.fn().mockResolvedValue(undefined),
		completeJob: vi.fn().mockResolvedValue(undefined),
	}
	const log = {
		logInfo: vi.fn(),
		logDebug: vi.fn(),
		logError: vi.fn(),
	}
	const worker = new ZBStreamWorker({
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		grpcClient: grpcClient as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		log: log as any,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		zbClient: zbClient as any,
	})
	return { worker, grpcClient, zbClient }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const pollTimerCount = (worker: ZBStreamWorker) =>
	(worker as unknown as { pollTimers: unknown[] }).pollTimers.length

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker does not leak poll timers across sidecar poll cycles',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: () => {
					throw new Error('should not be called — no jobs activated')
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollInterval: 1000,
			})

			// The initial backfill poll ran during streamJobs(); exactly one
			// live sidecar timer is scheduled.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pollTimerCount(worker)).toBe(1)

			// Run several poll cycles. Each cycle fires the pending timer, runs
			// the poll, and schedules the next timer.
			for (let cycle = 0; cycle < 5; cycle++) {
				await vi.advanceTimersByTimeAsync(1000)
				expect(pollTimerCount(worker)).toBe(1)
			}
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(6)

			// close() cancels the remaining live timer and empties the array.
			await worker.close()
			expect(pollTimerCount(worker)).toBe(0)
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker tracks at most one live timer per stream',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker } = createWorker()

			const streamReq = {
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: () => {
					throw new Error('should not be called — no jobs activated')
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollInterval: 1000,
			}

			await worker.streamJobs({ ...streamReq, type: 'test-task-1' })
			await worker.streamJobs({ ...streamReq, type: 'test-task-2' })
			expect(pollTimerCount(worker)).toBe(2)

			await vi.advanceTimersByTimeAsync(1000)
			expect(pollTimerCount(worker)).toBe(2)

			await vi.advanceTimersByTimeAsync(1000)
			expect(pollTimerCount(worker)).toBe(2)

			await worker.close()
			expect(pollTimerCount(worker)).toBe(0)
		} finally {
			vi.useRealTimers()
		}
	}
)

/**
 * The stream only pushes jobs that become activatable after it opens. Jobs
 * that already exist (a backlog) are picked up by the poll. A poll that
 * returns a full batch means more jobs are probably waiting, so the worker
 * must poll again as soon as that batch is handled — not wait a whole
 * `pollInterval` (30 s by default) per batch. Otherwise a backlog drains at
 * only `pollMaxJobsToActivate` jobs per `pollInterval`.
 */
const fakeJob = (key: number) => ({
	key: String(key),
	type: 'test-task',
	processInstanceKey: '1',
	bpmnProcessId: 'p',
	processDefinitionVersion: 1,
	processDefinitionKey: '1',
	elementId: 'e',
	elementInstanceKey: '1',
	customHeaders: {},
	worker: 'test-worker',
	retries: 3,
	deadline: '0',
	variables: {},
	tenantId: '<default>',
})

const fakeBatch = (size: number, offset: number) =>
	Array.from({ length: size }, (_, i) => fakeJob(offset + i))

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker drains a backlog without waiting a pollInterval per full batch',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			// Two full batches of 3, then a partial batch, then nothing.
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(3, 0))
				.mockResolvedValueOnce(fakeBatch(3, 3))
				.mockResolvedValueOnce(fakeBatch(1, 6))
				.mockResolvedValue([])
			const handled: string[] = []

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					handled.push(job.key)
					return job.complete()
				},
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 3,
				pollInterval: 30000,
			})

			// Let the background drain run, without advancing the sidecar timer.
			await vi.advanceTimersByTimeAsync(0)

			// Full batches trigger an immediate re-poll; the partial batch ends the drain.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(3)
			expect(handled).toHaveLength(7)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)

test.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'ZBStreamWorker waits for a batch to be handled before polling again',
	async () => {
		vi.useFakeTimers()
		try {
			const { worker, zbClient } = createWorker()
			zbClient.activateJobs
				.mockResolvedValueOnce(fakeBatch(2, 0))
				.mockResolvedValue([])
			const pending: Array<() => void> = []

			await worker.streamJobs({
				type: 'test-task',
				worker: 'test-worker',
				timeout: 30000,
				tenantIds: ['<default>'],
				// Handlers stay in flight until the test releases them.
				taskHandler: (job) =>
					new Promise((resolve) => {
						pending.push(() => resolve(job.complete()))
					}),
				inputVariableDto: LosslessDto,
				customHeadersDto: LosslessDto,
				pollMaxJobsToActivate: 2,
				pollInterval: 30000,
			})

			await vi.advanceTimersByTimeAsync(0)
			// The full batch is still being handled: no second poll yet.
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(1)
			expect(pending).toHaveLength(2)

			pending.forEach((release) => release())
			await vi.advanceTimersByTimeAsync(0)
			expect(zbClient.activateJobs).toHaveBeenCalledTimes(2)

			await worker.close()
		} finally {
			vi.useRealTimers()
		}
	}
)
