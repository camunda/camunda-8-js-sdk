import { ZeebeGrpcClient } from '..'
import { EnvironmentSetup } from '../../lib'

beforeAll(() => EnvironmentSetup.storeEnv())
beforeEach(() => EnvironmentSetup.wipeEnv())
afterAll(() => EnvironmentSetup.restoreEnv())

test('ZeebeGrpcClient constructor throws is OAuth is not explicitly disabled and insufficient environment variables are set', async () => {
	expect(() => new ZeebeGrpcClient()).toThrow()
})
test('ZeebeGrpcClient constructor creates a new ZeebeGrpcClient', async () => {
	/* */
	process.env.ZEEBE_ADDRESS = 'localhost:26500'
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
		},
	})
	expect(zbc instanceof ZeebeGrpcClient).toBe(true)
})
test('ZeebeGrpcClient constructor creates a new ZeebeGrpcClient', async () => {
	/* */
	process.env.CAMUNDA_OAUTH_DISABLED = 'true'

	const zbc = new ZeebeGrpcClient({
		config: {
			ZEEBE_ADDRESS: 'localhost:26500',
		},
	})
	expect(zbc instanceof ZeebeGrpcClient).toBe(true)
})
// xtest('ZBClient constructor constructs', async () => {
// 	const zbc = new ZeebeGrpcClient({
// 		config: {
// 			ZEEBE_ADDRESS: 'localhost:26500',
// 		},
// 	})
// 	expect(zbc.gatewayAddress).toBe('localhost:26500')
// 	await zbc.close()
// })
// xtest('ZBClient constructor accepts a custom port number for the gatewayAddress', async () => {
// 	const zbc = new ZeebeGrpcClient('localhost:123')
// 	expect(zbc.gatewayAddress).toBe('localhost:123')
// 	await zbc.close()
// })
// xtest('ZBClient constructor takes client options passed in Ctor when ZEEBE_NODE_LOG_LEVEL is not defined', async () => {
// 	process.env.ZEEBE_NODE_LOG_LEVEL = ''
// 	clientOptions.loglevel = 'NONE'
// 	const z = new ZeebeGrpcClient(clientOptions)
// 	expect(z.loglevel).toBe('NONE')
// 	await z.close()
// })
// xtest('ZEEBE_NODE_LOG_LEVEL precedes options passed in Ctor', async () => {
// 	process.env.ZEEBE_NODE_LOG_LEVEL = 'NONE'
// 	clientOptions.loglevel = 'DEBUG'
// 	const z = new ZeebeGrpcClient(clientOptions)
// 	expect(z.loglevel).toBe('NONE')
// 	await z.close()
// })
