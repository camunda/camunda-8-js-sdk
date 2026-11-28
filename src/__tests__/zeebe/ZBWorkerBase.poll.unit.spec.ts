import { EventEmitter } from 'events'
import path from 'node:path'

import chalk from 'chalk'
import { describe, expect, it, vi } from 'vitest'
import { Duration } from 'typed-duration'

import { CamundaSDKConfiguration } from '../../lib/Configuration'
import type { IHeadersProvider } from '../../oauth'
import type { ZeebeGrpcClient } from '../../zeebe'
import { GrpcClient } from '../../zeebe/lib/GrpcClient'
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

	it('redacts token endpoint credentials before logging an auth failure', async () => {
		const grpcClient = new MockGrpcClient()
		const tokenError = Object.assign(
			new Error(
				'Error requesting token for Client Id zeebe: ' +
					'client_secret=worker-token-secret'
			),
			{ code: 16 }
		)
		grpcClient.activateJobsStream.mockResolvedValueOnce({ error: tokenError })
		const logError = vi.fn()

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

		const loggedErrors = JSON.stringify(logError.mock.calls)
		expect(loggedErrors).not.toContain('worker-token-secret')
		expect(loggedErrors).toContain('[REDACTED]')

		await worker.close()
	})

	it('handles a falsy auth rejection without treating the error result as a stream', async () => {
		const oAuth: IHeadersProvider = {
			getHeaders: vi.fn().mockRejectedValue(null),
		}
		const grpcClient = new GrpcClient({
			config: CamundaSDKConfiguration,
			connectionTolerance: Duration.milliseconds.of(0),
			host: '127.0.0.1:1',
			loglevel: 'ERROR',
			namespace: 'security-test',
			oAuth,
			options: {},
			packageName: 'gateway_protocol',
			protoPath: path.resolve(__dirname, '../../proto/zeebe.proto'),
			service: 'Gateway',
			stdout: {
				debug: vi.fn(),
				info: vi.fn(),
				error: vi.fn(),
			},
			useTLS: false,
		})
		const logError = vi.fn()
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

		try {
			const privateWorker = worker as unknown as PrivateWorkerView
			await expect(privateWorker.poll()).resolves.toBeUndefined()

			expect(privateWorker.pollMutex).toBe(false)
			expect(logError).toHaveBeenCalledWith(
				expect.objectContaining({ error: 'Error: null' })
			)
		} finally {
			await worker.close()
		}
	})
})
