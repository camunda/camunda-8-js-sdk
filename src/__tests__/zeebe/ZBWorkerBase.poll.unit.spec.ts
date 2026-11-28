import { EventEmitter } from 'events'

import chalk from 'chalk'
import d from 'debug'
import { afterEach, describe, expect, it, vi } from 'vitest'
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

afterEach(() => {
	vi.restoreAllMocks()
	d.disable()
})

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

	it('redacts token-endpoint credentials before logging stream errors', async () => {
		const grpcClient = new MockGrpcClient()
		grpcClient.activateJobsStream.mockResolvedValueOnce({
			error: new Error(
				'Error requesting token: ZEEBE_CLIENT_SECRET=leaked-env-secret Bearer leaked-bearer-token'
			),
		})
		const logError = vi.fn()
		const debugLines: string[] = []
		d.enable('camunda:worker')
		vi.spyOn(d, 'log').mockImplementation((...args: unknown[]) => {
			debugLines.push(args.map((arg) => String(arg)).join(' '))
		})

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
				logError,
			} as unknown as StatefulLogInterceptor,
			taskHandler: vi.fn() as ZB.ZBWorkerTaskHandler<never, never, never>,
			tenantIds: undefined,
		})

		const privateWorker = worker as unknown as PrivateWorkerView
		await privateWorker.poll()

		expect(logError).toHaveBeenCalledTimes(1)
		const logged = JSON.stringify(logError.mock.calls[0]?.[0])
		expect(logged).not.toContain('leaked-env-secret')
		expect(logged).not.toContain('leaked-bearer-token')
		expect(logged).toContain('[REDACTED]')

		const streamDebug = debugLines.find((line) => line.includes('Stream error'))
		expect(streamDebug).toBeDefined()
		expect(streamDebug).not.toContain('leaked-env-secret')
		expect(streamDebug).not.toContain('leaked-bearer-token')
		expect(streamDebug).toContain('[REDACTED]')

		await worker.close()
	})
})
