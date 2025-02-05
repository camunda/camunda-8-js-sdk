import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'

suppressZeebeLogging()

jest.setTimeout(30000)
afterAll(() => {
	restoreZeebeLogging()
})

test('gRPC worker will backoff on UNAUTHENTICATED', (done) => {
	let durations = 0

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
		durations += duration
	})
	setTimeout(() => {
		expect(durations).toBe(31000)
		w.close()
		done()
	}, 25000)
})

test('gRPC worker uses a supplied custom max backoff', (done) => {
	let durations = 0

	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'NONE',
			CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: 2000,
		},
	})

	const w = zbc.createWorker({
		taskType: 'unauthenticated-worker',
		taskHandler: async () => {
			throw new Error('Not Implemented') // is never called
		},
	})
	w.on('backoff', (duration) => {
		durations += duration
	})
	setTimeout(() => {
		expect(durations).toBe(11000)
		w.close()
		done()
	}, 10000)
})
