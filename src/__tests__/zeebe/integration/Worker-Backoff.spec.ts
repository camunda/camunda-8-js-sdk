import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'

suppressZeebeLogging()

jest.setTimeout(30000)
afterAll(() => {
	restoreZeebeLogging()
})

test('gRPC worker will backoff on UNAUTHENTICATED', (done) => {
	const backoffs: number[] = []

	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'NONE',
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

test('gRPC worker uses a supplied custom max backoff', (done) => {
	const backoffs: number[] = []
	const CUSTOM_MAX_BACKOFF = 2000
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'NONE',
			CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: CUSTOM_MAX_BACKOFF,
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
