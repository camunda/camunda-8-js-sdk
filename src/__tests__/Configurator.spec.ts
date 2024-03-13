import { CamundaEnvironmentConfigurator, EnvironmentSetup } from '../utils'

/** Store all env vars, then wipe them in the environment */
beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})

beforeEach(EnvironmentSetup.wipeEnv)

/** Restore all env vars */
afterAll(() => EnvironmentSetup.restoreEnv())

describe('CamundaEnvironmentConfigurator', () => {
	test('Can read correct env vars', () => {
		expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
		expect(process.env.ZEEBE_CLIENT_ID).toBe(undefined)
		expect(process.env.ZEEBE_CLIENT_RETRY).toBe(undefined)
		process.env.ZEEBE_CLIENT_RETRY = 'retry'
		process.env.ZEEBE_ADDRESS = 'address'
		process.env.ZEEBE_CLIENT_ID = 'clientId'
		const env = CamundaEnvironmentConfigurator.ENV()
		expect(env.ZEEBE_CLIENT_ID).toBe('clientId')
		expect(env.ZEEBE_ADDRESS).toBe('address')
		expect(env.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_RETRY).toBe('retry')
	})

	test('It can merge explicit configuration with environment', () => {
		expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
		expect(process.env.ZEEBE_CLIENT_RETRY).toBe(undefined)

		process.env.ZEEBE_ADDRESS = 'address'
		process.env.ZEEBE_CLIENT_RETRY = 'retry'
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
			ZEEBE_ADDRESS: 'explicit',
		})
		expect(config.ZEEBE_ADDRESS).toBe('explicit')
		expect(config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_RETRY).toBe('retry')
	})
})
