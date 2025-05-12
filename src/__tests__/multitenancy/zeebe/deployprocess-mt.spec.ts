import { ZeebeGrpcClient } from '../../../zeebe/index'

const STORED_ENV = {}
const ENV_VARS_TO_STORE = ['CAMUNDA_TENANT_ID']

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

// An error is not thrown when deploying to a multi-tenant Zeebe broker without a tenantId or a 'wrong' tenantId
test('Will throw an error if non-existent tenantId is provided when deploying a process to multi-tenant Zeebe', async () => {
	process.env.CAMUNDA_TENANT_ID = '<unknown>'
	let threwError = false
	const client = new ZeebeGrpcClient()
	await client
		.deployResource({
			processFilename: './src/__tests__/testdata/hello-world.bpmn',
			tenantId: '<unknown>',
		})
		.catch(() => (threwError = true))
	expect(threwError).toBe(true)
	await client.close()
})

test('Will not throw an error if tenantId is provided when connecting to multi-tenant Zeebe', async () => {
	process.env.CAMUNDA_TENANT_ID = '<default>'
	let threwError = false
	const client = new ZeebeGrpcClient()
	await client
		.deployResource({
			processFilename: './src/__tests__/testdata/hello-world.bpmn',
			tenantId: '<default>',
		})
		.catch(() => (threwError = true))
	expect(threwError).toBe(false)
	await client.close()
})

test('Can deploy to red tenant', async () => {
	let thrown = false
	const redClient = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: 'red',
			ZEEBE_CLIENT_ID: 'redzeebe',
			ZEEBE_CLIENT_SECRET: 'redzecret',
		},
	})
	try {
		await redClient.deployResource({
			processFilename: './src/__tests__/testdata/Red-Tenant-Process.bpmn',
		})
	} catch {
		thrown = true
	}
	await redClient.close()
	expect(thrown).toBe(false)
})

test('Process deployed to red tenant cannot be started by default tenant client', async () => {
	let thrown = false
	const redClient = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: 'red',
			ZEEBE_CLIENT_ID: 'redzeebe',
			ZEEBE_CLIENT_SECRET: 'redzecret',
		},
	})
	const defaultClient = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '<default>',
		},
	})
	await redClient.deployResource({
		processFilename: './src/__tests__/testdata/Red-Tenant-Process.bpmn',
	})
	try {
		await defaultClient.createProcessInstance({
			bpmnProcessId: 'red-tenant',
			variables: {},
		})
	} catch (e) {
		thrown = true
	}
	await defaultClient.close()
	await redClient.close()
	expect(thrown).toBe(true)
})

test('Process instance started in red tenant can be started by red tenant', async () => {
	let thrown = false
	const redClient = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: 'red',
			ZEEBE_CLIENT_ID: 'redzeebe',
			ZEEBE_CLIENT_SECRET: 'redzecret',
		},
	})
	await redClient.deployResource({
		processFilename: './src/__tests__/testdata/Red-Tenant-Process.bpmn',
	})
	try {
		const res = await redClient.createProcessInstance({
			bpmnProcessId: 'red-tenant',
			variables: {},
		})
		expect(res.bpmnProcessId).toBe('red-tenant')
		await redClient.cancelProcessInstance(res.processInstanceKey)
	} catch (e) {
		thrown = true
	}
	await redClient.close()
	expect(thrown).toBe(false)
})

// test('Process instance started in red tenant cannot be seen by green tenant', () => {})
