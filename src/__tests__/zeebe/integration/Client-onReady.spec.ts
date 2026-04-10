import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'

vi.setConfig({ testTimeout: 30_000 })

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does not call the onReady handler if there is no broker',
	() =>
		new Promise<void>((done) => {
			let called = false
			const zbc2 = new ZeebeGrpcClient({
				config: {
					ZEEBE_GRPC_ADDRESS: 'grpcs://localtoast:267890',
				},
			}).on('ready', () => {
				called = true
			}) // Broker doesn't exist!!!
			setTimeout(async () => {
				expect(called).toBe(false)
				await zbc2.close()
				done()
			}, 8000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Calls the onReady handler if there is a broker and eagerConnection is true',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
				},
			}).on('ready', () => {
				called++
			})

			setTimeout(async () => {
				expect(called).toBe(1)
				await zbc2.close()
				done()
			}, 8000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Sets connected to true if there is a broker',
	() =>
		new Promise<void>((done) => {
			const zbc2 = new ZeebeGrpcClient({
				config: {
					zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
				},
			})

			setTimeout(async () => {
				expect(zbc2.connected).toBe(true)
				await zbc2.close()
				done()
			}, 8000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'emits the ready event if there is a broker and eagerConnection: true',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true },
				},
			}).on('ready', () => {
				called = called + 1
			})

			setTimeout(async () => {
				expect(called).toBe(1)
				expect(zbc2.connected).toBe(true)
				await zbc2.close()
				done()
			}, 8000)
		})
)
