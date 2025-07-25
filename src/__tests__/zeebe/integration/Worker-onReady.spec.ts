import { ZeebeGrpcClient } from '../../../zeebe'

jest.setTimeout(40000)

test('Worker emits the ready event once if there is a broker', (done) => {
	let called = 0
	const zbc2 = new ZeebeGrpcClient()
	zbc2
		.createWorker({
			taskHandler: (job) => job.complete(),
			taskType: 'nonsense-task',
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

test('Does set connected: true if there is a broker and eagerConnection: true', (done) => {
	const zbc2 = new ZeebeGrpcClient({
		config: { zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true } },
	})

	setTimeout(async () => {
		expect(zbc2.connected).toBe(true)
		await zbc2.close()
		done()
	}, 7000)
})

test('Sets connected: true if there is a broker and eagerConnection: false', (done) => {
	const zbc2 = new ZeebeGrpcClient()
	setTimeout(async () => {
		await zbc2.close()
		expect(zbc2.connected).toBe(true)
		done()
	}, 7000)
})

test('Does not call the onReady handler if there is no broker', (done) => {
	let called = 0
	const zbc2 = new ZeebeGrpcClient({
		config: { ZEEBE_GRPC_ADDRESS: 'grpc://nobroker' },
	})
	zbc2.createWorker({
		onReady: () => {
			called++
		},
		taskHandler: (job) => job.complete(),
		taskType: 'nonsense-task',
	})
	setTimeout(async () => {
		await zbc2.close()
		expect(called).toBe(0)
		done()
	}, 5000)
})

test('Does not emit the ready event if there is no broker', (done) => {
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

test('Worker calls the onReady handler once if there is a broker', (done) => {
	let called = 0
	const zbc2 = new ZeebeGrpcClient()
	zbc2.createWorker({
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
