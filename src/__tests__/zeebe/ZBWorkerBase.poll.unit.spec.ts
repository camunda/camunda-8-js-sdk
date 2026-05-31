import { EventEmitter } from 'events'

import chalk from 'chalk'
import { describe, expect, it, vi } from 'vitest'
import { Duration } from 'typed-duration'

import type { ZeebeGrpcClient } from '../../zeebe'
import type * as ZB from '../../zeebe/lib/interfaces-1.0'
import type { StatefulLogInterceptor } from '../../zeebe/lib/StatefulLogInterceptor'
import { ZBWorker } from '../../zeebe/zb/ZBWorker'

class MockGrpcClient extends EventEmitter {
	activateJobsStream = vi.fn()
	topologySync = vi.fn(async () => undefined)
	close = vi.fn(async () => undefined)
}

type PrivateWorkerView = {
	poll: () => Promise<void>
	pollMutex: boolean
}

describe('ZBWorkerBase.poll', () => {
	it('releases poll mutex after non-backpressure activateJobs error', async () => {
		const grpcClient = new MockGrpcClient()
		grpcClient.activateJobsStream.mockRejectedValueOnce(
			new Error(
				'Error requesting token for Client Id zeebe: Response code 503 (Service Temporarily Unavailable)'
			)
		)

		const worker = new ZBWorker<never, never, never>({
			grpcClient: grpcClient as unknown as ZB.ZBGrpc,
			id: 'unit-test-worker',
			taskType: 'unit-test-task',
			options: {
				pollInterval: Duration.hours.of(1),
				longPoll: Duration.seconds.of(30),
				timeout: Duration.seconds.of(60),
				CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: 10_000,
			},
			idColor: chalk.white,
			zbClient: {
				failJob: vi.fn(),
				cancelProcessInstance: vi.fn(),
			} as unknown as ZeebeGrpcClient,
			log: {
				logDebug: vi.fn(),
				logInfo: vi.fn(),
				logError: vi.fn(),
			} as unknown as StatefulLogInterceptor,
			taskHandler: vi.fn() as ZB.ZBWorkerTaskHandler<never, never, never>,
			tenantIds: undefined,
		})

		const privateWorker = worker as unknown as PrivateWorkerView
		await privateWorker.poll()

		expect(privateWorker.pollMutex).toBe(false)

		await worker.close()
	})
})
