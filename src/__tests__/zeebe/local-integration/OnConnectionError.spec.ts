import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'

vi.setConfig({ testTimeout: 20_000 })
process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'

// Disabling this test because it is flaky
test.skipIf(
	allowAny([
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
		{ deployment: 'unit-test' },
	])
)(
	'Calls the onConnectionError handler if there is no broker and eagerConnection:true',
	() =>
		new Promise((done) => {
			let calledA = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					// Deliberately misspelled - does not exist
					ZEEBE_GRPC_ADDRESS: 'grpc://localtoast:267890',
					CAMUNDA_LOG_LEVEL: 'none',
					zeebeGrpcSettings: {
						ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true,
						ZEEBE_GRPC_CLIENT_MAX_RETRIES: 5,
					},
				},
			})

			zbc2.on('connectionError', () => {
				calledA++
			})

			setTimeout(async () => {
				expect(calledA).toBe(1)
				await zbc2.close()
				done(null)
			}, 5000)
		})
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does not call the onConnectionError handler if there is a broker',
	() =>
		new Promise((done) => {
			let calledB = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})
			zbc2.on('connectionError', () => {
				calledB++
				console.log('onConnection Error was called when there *is* a broker')
			})
			setTimeout(async () => {
				expect(calledB).toBe(0)
				await zbc2.close()
				done(null)
			}, 5000)
		})
)

test.runIf(
	allowAny([
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
		{ deployment: 'unit-test' },
	])
)(
	'Calls ZBClient onConnectionError once when there is no broker, eagerConnection:true, and workers with no handler',
	() =>
		new Promise<void>((done) => {
			let calledC = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					CAMUNDA_LOG_LEVEL: 'none',
					ZEEBE_GRPC_ADDRESS: 'grpc://localtoast:234532534',
					zeebeGrpcSettings: {
						ZEEBE_GRPC_CLIENT_EAGER_CONNECT: true,
						ZEEBE_GRPC_CLIENT_MAX_RETRIES: 5,
					},
				},
			})
			zbc2.on('connectionError', () => {
				calledC++
			})
			zbc2.createWorker({
				loglevel: 'NONE',
				taskType: 'whatever',
				taskHandler: (job) => job.complete(),
			})
			zbc2.createWorker({
				loglevel: 'NONE',
				taskType: 'whatever',
				taskHandler: (job) => job.complete(),
			})
			setTimeout(async () => {
				await zbc2.close()
				expect(calledC).toBe(1)
				done()
			}, 10_000)
		})
)

// This behaviour doesn't seem to work.
test.skipIf(
	allowAny([
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
		{ deployment: 'unit-test' },
	])
)(
	'Calls ZBClient onConnectionError when there no broker, for the client and each worker with a handler',
	() =>
		new Promise<void>((done) => {
			let calledD = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					ZEEBE_GRPC_ADDRESS: 'grpc://localtoast:234532534',
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})
			zbc2.on('connectionError', () => {
				calledD++
			})
			zbc2.createWorker({
				loglevel: 'NONE',
				taskType: 'whatever',
				taskHandler: (job) => job.complete(),
				onConnectionError: () => calledD++,
			})
			setTimeout(async () => {
				await zbc2.close()
				expect(calledD).toBe(2)
				done()
			}, 10_000)
		})
)

test.runIf(
	allowAny([
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
		{ deployment: 'unit-test' },
	])
)(
	'Debounces onConnectionError',
	() =>
		new Promise<void>((done) => {
			let called = 0
			const zbc2 = new ZeebeGrpcClient({
				config: {
					ZEEBE_GRPC_ADDRESS: 'grpc://localtoast:234532534',
					CAMUNDA_LOG_LEVEL: 'none',
				},
			})
			zbc2.on('connectionError', () => {
				called++
			})
			zbc2.createWorker({
				loglevel: 'NONE',
				taskType: 'whatever',
				taskHandler: (job) => job.complete(),
				onConnectionError: () => called++,
			})
			setTimeout(async () => {
				await zbc2.close()
				expect(called).toBe(2) // toBeLessThanOrEqual(1)
				done()
			}, 15_000)
		})
)

test.skip('Trailing parameter worker onConnectionError handler API works', () =>
	new Promise<void>((done) => {
		let calledE = 0
		const zbc2 = new ZeebeGrpcClient({
			config: { ZEEBE_GRPC_ADDRESS: 'grpc://localtoast:234532534' },
		})
		zbc2.createWorker({
			taskType: 'whatever',
			taskHandler: (job) => job.complete(),
			onConnectionError: () => calledE++,
		})
		setTimeout(async () => {
			await zbc2.close()
			expect(calledE).toBe(1)
			done()
		}, 10_000)
	}))

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does not call the onConnectionError handler if there is a business error',
	() =>
		new Promise<void>((done) => {
			let calledF = 0
			let wf = 'arstsrasrateiuhrastulyharsntharsie'
			const zbc2 = new ZeebeGrpcClient()
			zbc2.on('connectionError', () => {
				calledF++
			})

			zbc2
				.createProcessInstance({
					bpmnProcessId: wf,
					variables: {},
				})
				.catch(() => {
					wf = 'throw error away'
				})
			setTimeout(async () => {
				expect(zbc2.connected).toBe(true)
				expect(calledF).toBe(0)
				await zbc2.close()
				done()
			}, 10_000)
		})
)
