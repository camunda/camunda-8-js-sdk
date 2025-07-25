import { ZeebeGrpcClient } from '../../../zeebe'

jest.setTimeout(10000)

test('Calls the onConnectionError handler if there is no broker and eagerConnection: true', () =>
	new Promise((done) => {
		let called = false
		const zbc2 = new ZeebeGrpcClient({
			config: {
				ZEEBE_ADDRESS: 'localtoast:267890',
				ZEEBE_GRPC_ADDRESS: 'grpcs://localtoast:267890',
				zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
			},
		})
		zbc2.on('connectionError', () => {
			called = true
		}) // Broker doesn't exist!!!
		setTimeout(async () => {
			expect(called).toBe(true)
			await zbc2.close()
			done(null)
		}, 7000)
	}))

test('Sets connected:undefined if there is no broker and no setting of eagerConnection', () =>
	new Promise((done) => {
		const zbc2 = new ZeebeGrpcClient({
			config: {
				ZEEBE_ADDRESS: 'localtoast:267890',
				ZEEBE_GRPC_ADDRESS: 'grpcs://localtoast:267890',
			},
		}) // Broker doesn't exist!!!
		setTimeout(async () => {
			expect(zbc2.connected).toBe(undefined)
			await zbc2.close()
			done(null)
		}, 5000)
	}))

test('Sets connected:false if there is no broker and eagerConnection: true', (done) => {
	const zbc2 = new ZeebeGrpcClient({
		config: {
			ZEEBE_ADDRESS: 'localtoast:267890',
			ZEEBE_GRPC_ADDRESS: 'grpcs://localtoast:267890',
			zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
		},
	}) // Broker doesn't exist!!!	{
	setTimeout(async () => {
		expect(zbc2.connected).toBe(false)
		await zbc2.close()
		done()
	}, 5000)
})

test('Does emit the connectionError event if there is no broker and eagerConnection: true', (done) => {
	let called = 0
	const zbc2 = new ZeebeGrpcClient({
		config: {
			ZEEBE_ADDRESS: 'localtoast:267890',
			ZEEBE_GRPC_ADDRESS: 'grpcs://localtoast:267890',
			zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
		},
	})
	zbc2.on('connectionError', () => {
		called++
	})

	setTimeout(async () => {
		expect(called).toBe(1)
		await zbc2.close()
		done()
	}, 7000)
})
