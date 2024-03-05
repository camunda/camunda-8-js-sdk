import {
	getCamundaCredentialsFromEnv,
	getOperateCredentials,
} from '../lib/creds'

const keys = [
	'ZEEBE_AUTHORIZATION_SERVER_URL',
	'ZEEBE_CLIENT_SECRET',
	'ZEEBE_CLIENT_ID',
	'ZEEBE_ADDRESS',
	'ZEEBE_TOKEN_AUDIENCE',
	'ZEEBE_TOKEN_SCOPE',
	'ZEEBE_TENANT_ID',
	'ZEEBE_SECURE_CONNECTION',
	'CAMUNDA_CLUSTER_ID',
	'CAMUNDA_CLUSTER_REGION',
	'CAMUNDA_CREDENTIALS_SCOPES',
	'CAMUNDA_TASKLIST_BASE_URL',
	'CAMUNDA_OPTIMIZE_BASE_URL',
	'CAMUNDA_OPERATE_BASE_URL',
	'CAMUNDA_OAUTH_URL',
	'CAMUNDA_TOKEN_SCOPE',
	'CAMUNDA_TENANT_ID',
]

const storage: { [key: string]: string | undefined } = {}

function wipeEnv() {
	keys.forEach((key) => delete process.env[key])
}

beforeAll(() => {
	keys.forEach((key) => (storage[key] = process.env[key]))
	wipeEnv()
})

beforeEach(wipeEnv)

afterAll(() => {
	keys.forEach((key) => (process.env[key] = storage[key]))
})

test('Can read correct env vars', () => {
	expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
	process.env.ZEEBE_ADDRESS = 'address'
	process.env.ZEEBE_CLIENT_SECRET = 'secret'
	process.env.ZEEBE_CLIENT_ID = 'clientid'
	process.env.ZEEBE_AUTHORIZATION_SERVER_URL = 'url'
	process.env.CAMUNDA_OAUTH_URL = 'url'
	process.env.CAMUNDA_CREDENTIALS_SCOPES = 'Zeebe'
	process.env.CAMUNDA_CLUSTER_ID = 'cluster_id'
	process.env.CAMUNDA_CLUSTER_REGION = 'bru-2'
	const creds = getCamundaCredentialsFromEnv(false)
	expect(creds.complete).toBe(true)
	expect(creds.ZEEBE_ADDRESS).toBe('address')
	expect(creds.ZEEBE_AUTHORIZATION_SERVER_URL).toBe('url')
	expect(creds.ZEEBE_CLIENT_SECRET).toBe('secret')
	expect(creds.ZEEBE_CLIENT_ID).toBe('clientid')
	expect(creds.scopes.Zeebe).toBeTruthy()
	expect(creds.scopes.Operate).toBeFalsy()
})

test('Throws if a required variable is not defined', () => {
	let thrown = false
	try {
		getCamundaCredentialsFromEnv(false)
	} catch {
		thrown = true
	}
	expect(thrown).toBe(true)
})

test('Throws if a required scope is not found', () => {
	let thrown = false
	expect(process.env.ZEEBE_ADDRESS).toBe(undefined)
	process.env.ZEEBE_ADDRESS = 'address'
	process.env.ZEEBE_CLIENT_SECRET = 'secret'
	process.env.ZEEBE_CLIENT_ID = 'clientid'
	process.env.ZEEBE_AUTHORIZATION_SERVER_URL = 'url'
	process.env.ZEEBE_TOKEN_AUDIENCE = 'sntshnt'
	process.env.CAMUNDA_OAUTH_URL = 'url'
	process.env.CAMUNDA_CREDENTIALS_SCOPES = 'Zeebe'
	process.env.CAMUNDA_CLUSTER_ID = 'cluster_id'
	process.env.CAMUNDA_CLUSTER_REGION = 'bru-2'
	process.env.CAMUNDA_OPERATE_BASE_URL = 'url'
	try {
		getOperateCredentials()
	} catch (e) {
		thrown = true
	}
	expect(thrown).toBe(true)
})
