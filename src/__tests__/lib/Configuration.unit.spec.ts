/* eslint-disable @typescript-eslint/no-var-requires */
import {
	EnvironmentSetup,
	EnvironmentStorage,
} from '../../lib/EnvironmentSetup'

let storage: EnvironmentStorage = {}
/** Store all env vars, then wipe them in the environment */
beforeAll(() => {
	storage = EnvironmentSetup.storeEnv()
})

beforeAll(() => {
	EnvironmentSetup.wipeEnv()
})

beforeEach(() => {
	EnvironmentSetup.wipeEnv()
	jest.resetModules()
})

/** Restore all env vars */
afterAll(() => EnvironmentSetup.restoreEnv(storage))

describe('CamundaEnvironmentConfigurator', () => {
	// In order to provide documentation of the environment variables via TypeDoc, I needed to disable dynamic update of env vars
	// This means that the environment variables are not updated when the environment is wiped
	test('Can read correct env vars', () => {
		expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
		process.env.ZEEBE_ADDRESS = 'address'
		process.env.ZEEBE_CLIENT_SECRET = 'secret'
		process.env.ZEEBE_CLIENT_ID = 'clientid'
		process.env.CAMUNDA_OAUTH_URL = 'url'
		const { CamundaEnvironmentConfigurator } = require('../../lib')
		const creds = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({})
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
		const { CamundaEnvironmentConfigurator } = require('../../lib')
		const env = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({})
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
		const { CamundaEnvironmentConfigurator } = require('../../lib')

		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
			ZEEBE_ADDRESS: 'explicit',
			CAMUNDA_TOKEN_CACHE_DIR: 'cacheDir',
		})
		expect(config.ZEEBE_ADDRESS).toBe('explicit')
		expect(config.CAMUNDA_TOKEN_CACHE_DIR).toBe('cacheDir')
		expect(config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_RETRY).toBe(true)
	})

	test('It can override the environment with an empty string', () => {
		expect(process.env.CAMUNDA_TOKEN_CACHE_DIR).toBe(undefined)

		process.env.CAMUNDA_TOKEN_CACHE_DIR = 'someDirectory'
		const { CamundaEnvironmentConfigurator } = require('../../lib')

		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
			CAMUNDA_TOKEN_CACHE_DIR: '',
		})
		expect(config.CAMUNDA_TOKEN_CACHE_DIR).toBe('')
	})
})
