import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe/index'

const STORED_ENV = {}
const ENV_VARS_TO_STORE = ['CAMUNDA_TENANT_ID', 'ZEEBE_CLIENT_LOG_LEVEL']

beforeAll(() => {
	ENV_VARS_TO_STORE.forEach((e) => {
		STORED_ENV[e] = process.env[e]
		delete process.env[e]
	})
	suppressZeebeLogging()
})

afterAll(() => {
	restoreZeebeLogging()
	ENV_VARS_TO_STORE.forEach((e) => {
		delete process.env[e]
		if (STORED_ENV[e]) {
			process.env[e] = STORED_ENV[e]
		}
	})
})

test('Will throw an error if non-existent tenantId is provided when connecting to multi-tenant Zeebe', async () => {
	process.env.CAMUNDA_TENANT_ID = 'test'
	let threwError = false
	const client = new ZeebeGrpcClient()
	await client
		.deployProcess('./src/__tests__/testdata/hello-world.bpmn')
		.catch(() => (threwError = true))
	expect(threwError).toBe(true)
	await client.close()
})

test('Will not throw an error if tenantId is provided when connecting to multi-tenant Zeebe', async () => {
	process.env.CAMUNDA_TENANT_ID = '<default>'
	let threwError = false
	const client = new ZeebeGrpcClient()
	await client
		.deployProcess('./src/__tests__/testdata/hello-world.bpmn')
		.catch(() => (threwError = true))
	expect(threwError).toBe(false)
	await client.close()
})
