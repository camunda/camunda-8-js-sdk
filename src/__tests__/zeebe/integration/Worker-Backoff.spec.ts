import { matrix } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'

vi.setConfig({ testTimeout: 30_000 })

test.runIf(
	matrix({
		include: {
			deployments: ['saas', 'self-managed'],
			versions: ['8.7', '8.8'],
			security: ['secured'],
			tenancy: ['multi-tenant', 'single-tenant'],
		},
	})
)(
	'gRPC worker will backoff on UNAUTHENTICATED',
	() =>
		new Promise<void>((done) => {
			const backoffs: number[] = []

			const zbc = new ZeebeGrpcClient({
				config: {
					CAMUNDA_AUTH_STRATEGY: 'NONE',
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})

			const w = zbc.createWorker({
				taskType: 'unauthenticated-worker',
				taskHandler: async () => {
					throw new Error('Not Implemented') // is never called
				},
			})
			w.on('backoff', (duration) => {
				backoffs.push(duration)
			})
			setTimeout(() => {
				w.close()
				zbc.close()
				// Assert that each backoff is greater than the previous one; ie: the backoff is increasing
				for (let i = 1; i < backoffs.length; i++) {
					expect(backoffs[i]).toBeGreaterThan(backoffs[i - 1])
				}
				done()
			}, 25000)
		})
)

test.runIf(
	matrix({
		include: {
			deployments: ['saas', 'self-managed'],
			versions: ['8.7', '8.8'],
			security: ['secured'],
			tenancy: ['multi-tenant', 'single-tenant'],
		},
	})
)(
	'gRPC worker uses a supplied custom max backoff',
	() =>
		new Promise<void>((done) => {
			const backoffs: number[] = []
			const CUSTOM_MAX_BACKOFF = 2000
			const zbc = new ZeebeGrpcClient({
				config: {
					CAMUNDA_AUTH_STRATEGY: 'NONE',
					CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: CUSTOM_MAX_BACKOFF,
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})

			const w = zbc.createWorker({
				taskType: 'unauthenticated-worker',
				taskHandler: async () => {
					throw new Error('Not Implemented') // is never called
				},
			})
			w.on('backoff', (duration) => {
				backoffs.push(duration)
			})
			setTimeout(() => {
				w.close()
				zbc.close()
				// Assert that each backoff is greater than the previous one; ie: the backoff is increasing
				for (let i = 0; i < backoffs.length - 1; i++) {
					expect(backoffs[i]).toBeLessThanOrEqual(CUSTOM_MAX_BACKOFF)
				}
				done()
			}, 10000)
		})
)
