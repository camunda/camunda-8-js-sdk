import { EnvironmentSetup, EnvironmentStorage } from '../../lib'
import { ZeebeGrpcClient } from '../../zeebe'

let storage: EnvironmentStorage = {}
beforeAll(() => (storage = EnvironmentSetup.storeEnv()))
beforeEach(() => {
	EnvironmentSetup.wipeEnv()
	jest.resetModules()
})
afterAll(() => EnvironmentSetup.restoreEnv(storage))

test.only('ZeebeGrpcClient constructor throws is OAuth is not explicitly disabled and insufficient environment variables are set', async () => {
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
	const zbc = new ZeebeGrpcClient({
		config: {
			ZEEBE_ADDRESS: 'localhost:26500',
			CAMUNDA_OAUTH_DISABLED: true,
		},
	})
	expect(zbc instanceof ZeebeGrpcClient).toBe(true)
})
