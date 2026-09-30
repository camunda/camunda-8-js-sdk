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
