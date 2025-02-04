import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'

/**
 * This is a manually verified test. To check it, comment out the next line, then check the console output.
 * You should see the error messages from the worker, and the backoff expanding the time between them.
 */
suppressZeebeLogging()

jest.setTimeout(30000)
afterAll(() => {
	restoreZeebeLogging()
})

test('Will backoff on UNAUTHENTICATED', (done) => {
	let durations = 0

	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'NONE',
			CAMUNDA_LOG_LEVEL: 'DEBUG',
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

test('Will use a supplied custom max backoff', (done) => {
	let durations = 0

	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'NONE',
			CAMUNDA_LOG_LEVEL: 'DEBUG',
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
