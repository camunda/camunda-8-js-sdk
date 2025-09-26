import { EnvironmentSetup, EnvironmentStorage } from '../../lib'
import { allowAny } from '../../test-support/testTags'
import { ZeebeGrpcClient } from '../../zeebe'

let storage: EnvironmentStorage = {}
beforeAll(() => (storage = EnvironmentSetup.storeEnv()))
beforeEach(() => {
	EnvironmentSetup.wipeEnv()
	vi.resetModules()
})
afterAll(() => EnvironmentSetup.restoreEnv(storage))

// ZeebeGrpcClient now defaults to no auth, and localhost, to support C8Run.
test.runIf(
	allowAny([
		{ deployment: 'unit-test' },
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
	])
)(
	'ZeebeGrpcClient constructor does not throw with no env vars set',
	async () => {
		expect(() => new ZeebeGrpcClient()).not.toThrow()
	}
)
test.runIf(
	allowAny([
		{ deployment: 'unit-test' },
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
	])
)('ZeebeGrpcClient constructor creates a new ZeebeGrpcClient', async () => {
	/* */
	process.env.ZEEBE_GRPC_ADDRESS = 'grpc://localhost:26500'
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
		},
	})
	expect(zbc instanceof ZeebeGrpcClient).toBe(true)
})
test.runIf(
	allowAny([
		{ deployment: 'unit-test' },
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
	])
)('ZeebeGrpcClient constructor creates a new ZeebeGrpcClient', async () => {
	const zbc = new ZeebeGrpcClient({
		config: {
			ZEEBE_GRPC_ADDRESS: 'grpc://localhost:26500',
			CAMUNDA_OAUTH_DISABLED: true,
		},
	})
	expect(zbc instanceof ZeebeGrpcClient).toBe(true)
})
