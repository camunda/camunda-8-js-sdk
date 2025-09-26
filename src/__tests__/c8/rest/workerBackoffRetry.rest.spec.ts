import { format } from 'winston'
import Transport from 'winston-transport'

import { createLogger } from '../../../c8/lib/C8Logger'
import { CamundaJobWorker } from '../../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'
import { matrix } from '../../../test-support/testTags'

let restJobWorker: CamundaJobWorker<LosslessDto, LosslessDto>

vi.setConfig({ testTimeout: 30_000 })

afterEach(() => {
	if (restJobWorker) {
		restJobWorker.stop()
	}
})

// Custom log transport to suppress errors in the console, and allow them to be examined
class MemoryTransport extends Transport {
	logs: { message: string; level: string; timestamp: string }[]
	errors: Error[]
	constructor(opts?: Transport.TransportStreamOptions | undefined) {
		super(opts)
		this.logs = []
		this.errors = []
	}
	log(
		info: Error | { message: string; level: string; timestamp: string },
		callback: () => void
	) {
		// Immediately emit the logged event (this is required for Winston)
		setImmediate(() => {
			this.emit('logged', info)
		})
		if (info instanceof Error) {
			this.errors.push(info)
		} else {
			this.logs.push(info)
		}
		callback()
	}
}

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured'],
		},
	})
)(
	'REST worker will backoff on UNAUTHENTICATED',
	() =>
		new Promise<void>((done) => {
			if (process.env.CAMUNDA_AUTH_STRATEGY === 'NONE') {
				// Skip this test if the auth strategy is NONE (ie: c8run), as it will not backoff
				return done()
			}
			let durations = 0
			let pollCountBackingOffWorker = 0
			const backoffs: number[] = []

			const transportBackingOffWorker = new MemoryTransport()
			const logBackingOffWorker = createLogger({
				transports: [transportBackingOffWorker],
			})

			const restClientBackingoffWorker = new CamundaRestClient({
				config: { CAMUNDA_AUTH_STRATEGY: 'NONE', logger: logBackingOffWorker },
			})
			restJobWorker = restClientBackingoffWorker.createJobWorker({
				type: 'unauthenticated-worker',
				jobHandler: async () => {
					throw new Error('Not Implemented') // is never called
				},
				worker: 'unauthenticated-test-worker',
				maxJobsToActivate: 10,
				timeout: 30000,
			})

			restJobWorker.on('backoff', (duration) => {
				durations += duration
				backoffs.push(duration)
			})
			restJobWorker.on('poll', () => {
				pollCountBackingOffWorker++
			})
			setTimeout(() => {
				restJobWorker.stop()
				expect(durations).toBe(20000)
				// In 25 seconds, we expect 4 or less attempts to poll the job
				expect(pollCountBackingOffWorker).toBeLessThanOrEqual(4)
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
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured'],
		},
	})
)(
	'REST worker uses a supplied custom max backoff',
	() =>
		new Promise<void>((done) => {
			const backoffs: number[] = []
			const MAX_BACKOFF = 2000
			const transport = new MemoryTransport()
			const logger = createLogger({
				transports: [transport],
			})
			const restClient = new CamundaRestClient({
				config: {
					CAMUNDA_AUTH_STRATEGY: 'NONE',
					CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: MAX_BACKOFF,
					logger,
				},
			})

			restJobWorker = restClient.createJobWorker({
				type: 'unauthenticated-worker',
				jobHandler: async () => {
					throw new Error('Not Implemented') // is never called
				},
				worker: 'unauthenticated-test-worker',
				maxJobsToActivate: 10,
				timeout: 30000,
			})
			restJobWorker.on('backoff', (duration) => {
				expect(duration).toBeLessThanOrEqual(MAX_BACKOFF)
				backoffs.push(duration)
			})
			restJobWorker.on('poll', () => {
				// pollCount++
			})
			setTimeout(() => {
				restJobWorker.stop()
				expect(backoffs.length).toBe(3)
				for (const backoff of backoffs) {
					expect(backoff).toBeLessThanOrEqual(MAX_BACKOFF)
				}
				done()
			}, 10000)
		})
)

/**
 * This test is deliberately commented out. The behaviour was manually verified on 5 Feb, 2025.
 *
 * Testing the outer bound of the token endpoint backoff when it is hardcoded to 15s takes a long time.
 * Making the max token endpoint backoff configurable would make this easier to test.
 *
 */
test.skip('REST worker uses a supplied custom max backoff with invalid secret', () =>
	new Promise<void>((done) => {
		let durations = 0
		let pollCount = 0
		const backoffs: number[] = []

		/**
		 * Suppress all logging output with this custom logger. The token endpoint will emit error logs during this test.
		 */
		const memoryTransport = new MemoryTransport()

		const logger = createLogger({
			format: format.combine(format.timestamp(), format.json()),
			transports: [memoryTransport],
		})

		const MAX_BACKOFF = 2000
		const restClient = new CamundaRestClient({
			config: {
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				ZEEBE_CLIENT_ID: 'Does-not-exist',
				ZEEBE_CLIENT_SECRET: 'NONE',
				CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: MAX_BACKOFF,
				logger,
			},
		})

		restJobWorker = restClient.createJobWorker({
			type: 'unauthenticated-worker',
			jobHandler: async () => {
				throw new Error('Not Implemented') // is never called
			},
			worker: 'unauthenticated-test-worker',
			maxJobsToActivate: 10,
			timeout: 30000,
			autoStart: false, // Do not autostart, so we can attach event listeners before it starts polling
		})
		restJobWorker.on('backoff', (duration) => {
			durations += duration
			backoffs.push(duration)
		})
		restJobWorker.on('poll', () => {
			pollCount++
		})
		restJobWorker.start() // Start the worker now that the event listeners are attached
		setTimeout(() => {
			restJobWorker.stop()
			const logs = memoryTransport.logs
			// Convert timestamp strings to milliseconds since epoch.
			const times = logs
				.filter((log) =>
					log.message.includes('Backing off worker poll due to failure.')
				)
				.map((log) => new Date(log.timestamp).getTime())
			console.log('times.length', times.length)
			// Calculate delays between consecutive errors.
			const delays: number[] = []
			for (let i = 1; i < times.length; i++) {
				delays.push(times[i] - times[i - 1])
			}
			// Assert that each delay is less than or equal to the max backoff delay
			for (let i = 1; i < delays.length; i++) {
				// expect(delays[i] - delays[i - 1]).toBeLessThanOrEqual(MAX_BACKOFF)
				console.log(delays[i])
			}
			expect(pollCount).toBe(4)
			expect(durations).toBe(8000)
			done()
		}, 20000)
	}))
