import { CamundaEnvironmentConfigurator, EnvironmentSetup } from '../../lib'

/** Store all env vars, then wipe them in the environment */
beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})

beforeEach(() => EnvironmentSetup.wipeEnv())

/** Restore all env vars */
afterAll(() => EnvironmentSetup.restoreEnv())

describe('CamundaEnvironmentConfigurator', () => {
	test('Can read correct env vars', () => {
		expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
		process.env.ZEEBE_ADDRESS = 'address'
		process.env.ZEEBE_CLIENT_SECRET = 'secret'
		process.env.ZEEBE_CLIENT_ID = 'clientid'
		process.env.CAMUNDA_OAUTH_URL = 'url'
		const creds = CamundaEnvironmentConfigurator.ENV()
		expect(creds.ZEEBE_ADDRESS).toBe('address')
		expect(creds.ZEEBE_CLIENT_SECRET).toBe('secret')
		expect(creds.ZEEBE_CLIENT_ID).toBe('clientid')
	})

	test('Can read correct env vars', () => {
		expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
		expect(process.env.ZEEBE_CLIENT_ID).toBe(undefined)
		expect(process.env.ZEEBE_CLIENT_RETRY).toBe(undefined)
		expect(process.env.CAMUNDA_TOKEN_CACHE_DIR).toBe(undefined)
		process.env.ZEEBE_GRPC_CLIENT_RETRY = 'false'
		process.env.ZEEBE_ADDRESS = 'address'
		process.env.ZEEBE_CLIENT_ID = 'clientId'
		process.env.CAMUNDA_TOKEN_CACHE_DIR = 'cacheDir'
		const env = CamundaEnvironmentConfigurator.ENV()
		expect(env.CAMUNDA_TOKEN_CACHE_DIR).toBe('cacheDir')
		expect(env.ZEEBE_CLIENT_ID).toBe('clientId')
		expect(env.ZEEBE_ADDRESS).toBe('address')
		expect(env.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_RETRY).toBe(false)
	})

	test('It can merge explicit configuration with environment', () => {
		expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
		expect(process.env.ZEEBE_GRPC_CLIENT_RETRY).toBe(undefined)

		process.env.ZEEBE_ADDRESS = 'address'
		process.env.ZEEBE_GRPC_CLIENT_RETRY = 'true'
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
			ZEEBE_ADDRESS: 'explicit',
			CAMUNDA_TOKEN_CACHE_DIR: 'cacheDir',
		})
		expect(config.ZEEBE_ADDRESS).toBe('explicit')
		expect(config.CAMUNDA_TOKEN_CACHE_DIR).toBe('cacheDir')
		expect(config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_RETRY).toBe(true)
	})
})
