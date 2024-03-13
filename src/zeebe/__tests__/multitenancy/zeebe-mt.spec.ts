import { ZBClient } from '../../index'

const STORED_ENV = {}
const ENV_VARS_TO_STORE = ['ZEEBE_TENANT_ID', 'CAMUNDA_TENANT_ID']

beforeAll(() => {
	ENV_VARS_TO_STORE.forEach((e) => {
		STORED_ENV[e] = process.env[e]
		delete process.env[e]
	})
})

afterAll(() => {
	ENV_VARS_TO_STORE.forEach((e) => {
		delete process.env[e]
		if (STORED_ENV[e]) {
			process.env[e] = STORED_ENV[e]
		}
	})
})

test('Will throw an error if non-existent tenantId is provided when connecting to multi-tenant Zeebe', async () => {
	delete process.env.ZEEBE_TENANT_ID
	delete process.env.CAMUNDA_TENANT_ID
	process.env.CAMUNDA_TENANT_ID = 'test'
	let threwError = false
	const client = new ZBClient()
	const res = await client
		.deployProcess('./src/zeebe/__tests__/testdata/hello-world.bpmn')
		.catch(() => (threwError = true))
	console.log(res)
	expect(threwError).toBe(true)
})

test('Will not throw an error if tenantId is provided when connecting to multi-tenant Zeebe', async () => {
	process.env.CAMUNDA_TENANT_ID = '<default>'
	let threwError = false
	const client = new ZBClient()
	await client
		.deployProcess('./src/zeebe/__tests__/testdata/hello-world.bpmn')
		.catch(() => (threwError = true))
	expect(threwError).toBe(false)
})
