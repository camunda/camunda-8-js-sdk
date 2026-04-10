import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'

vi.setConfig({ testTimeout: 40000 })

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Worker emits the ready event once if there is a broker',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: { CAMUNDA_LOG_LEVEL: 'none' },
			})
			zbc2
				.createWorker({
					taskHandler: (job) => job.complete(),
					taskType: 'nonsense-task',
					loglevel: 'NONE',
				})
				.on('ready', () => {
					called++
				})
			setTimeout(async () => {
				expect(called).toBe(1)
				await zbc2.close()
				done()
			}, 12000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does set connected: true if there is a broker and eagerConnection: true',
	() =>
		new Promise<void>((done) => {
			const zbc2 = new ZeebeGrpcClient({
				config: {
					zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})

			setTimeout(async () => {
				expect(zbc2.connected).toBe(true)
				await zbc2.close()
				done()
			}, 7000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Sets connected: true if there is a broker and eagerConnection: false',
	() =>
		new Promise<void>((done) => {
			const zbc2 = new ZeebeGrpcClient({
				config: { CAMUNDA_LOG_LEVEL: 'none' },
			})
			setTimeout(async () => {
				await zbc2.close()
				expect(zbc2.connected).toBe(true)
				done()
			}, 7000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does not call the onReady handler if there is no broker',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					ZEEBE_GRPC_ADDRESS: 'grpc://nobroker',
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})
			zbc2.createWorker({
				onReady: () => {
					called++
				},
				taskHandler: (job) => job.complete(),
				taskType: 'nonsense-task',
				loglevel: 'NONE',
			})
			setTimeout(async () => {
				await zbc2.close()
				expect(called).toBe(0)
				done()
			}, 5000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does not emit the ready event if there is no broker',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: { ZEEBE_GRPC_ADDRESS: 'grpc://nobroker' },
			})
			zbc2
				.createWorker({
					loglevel: 'NONE',
					taskHandler: (job) => job.complete(),
					taskType: 'nonsense-task',
				})
				.on('ready', () => {
					called++
				})
			setTimeout(async () => {
				await zbc2.close()
				expect(called).toBe(0)
				done()
			}, 5000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Worker calls the onReady handler once if there is a broker',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: { CAMUNDA_LOG_LEVEL: 'none' },
			})
			zbc2.createWorker({
				loglevel: 'NONE',
				onReady: () => {
					called++
				},
				taskHandler: (job) => job.complete(),
				taskType: 'nonsense-task',
			})
			setTimeout(async () => {
				await zbc2.close()
				expect(called).toBe(1)
				done()
			}, 12000)
		})
)
