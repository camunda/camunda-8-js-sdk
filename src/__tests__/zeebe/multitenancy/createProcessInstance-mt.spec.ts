import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'
import {
	DeployResourceResponse,
	ProcessDeployment,
	ZeebeGrpcClient,
} from 'zeebe'

suppressZeebeLogging()
let res: DeployResourceResponse<ProcessDeployment>

beforeAll(async () => {
	const client = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '<default>',
		},
	})
	res = await client.deployResource({
		processFilename: './src/__tests__/testdata/hello-world.bpmn',
	})
})

afterAll(() => restoreZeebeLogging())

test('Will not throw an error if tenantId is provided when starting a process instance on multi-tenant Zeebe', async () => {
	let threwError = false

	const client = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '<default>',
		},
	})

	try {
		const p = await client.createProcessInstance({
			bpmnProcessId: res.deployments[0].process.bpmnProcessId,
			version: res.deployments[0].process.version,
			variables: {},
		})
		expect(p).toBeTruthy()
		await client.cancelProcessInstance(p.processInstanceKey)
	} catch (e) {
		threwError = true
		console.log(e)
	}

	expect(threwError).toBe(false)
	await client.close()
})

test('Will throw an error if no tenantId is provided when starting a process instance on multi-tenant Zeebe', async () => {
	let threwError = false
	const client = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '',
		},
	})
	try {
		const p = await client.createProcessInstance({
			bpmnProcessId: res.deployments[0].process.bpmnProcessId,
			version: res.deployments[0].process.version,
			variables: {},
		})
		client.cancelProcessInstance(p.bpmnProcessId)
	} catch (e) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((e as any).code).toBe(3)
		threwError = true
	}
	expect(threwError).toBe(true)
	await client.close()
})
