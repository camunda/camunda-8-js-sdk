import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { DeployResourceResponse, ProcessDeployment } from '../../../zeebe/types'

jest.setTimeout(25000)

const zbc = new ZeebeGrpcClient()
let test1: DeployResourceResponse<ProcessDeployment>
let test2: DeployResourceResponse<ProcessDeployment>
let test3: DeployResourceResponse<ProcessDeployment>

beforeAll(async () => {
	test1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/await-outcome.bpmn',
	})
	test2 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/await-outcome-long.bpmn',
	})
	test3 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/await-outcome.bpmn',
	})
	await cancelProcesses(test1.deployments[0].process.processDefinitionKey)
	await cancelProcesses(test2.deployments[0].process.processDefinitionKey)
	await cancelProcesses(test3.deployments[0].process.processDefinitionKey)
})

afterAll(async () => {
	await zbc.close() // Makes sure we don't forget to close connection
	await cancelProcesses(test1.deployments[0].process.processDefinitionKey)
	await cancelProcesses(test2.deployments[0].process.processDefinitionKey)
	await cancelProcesses(test3.deployments[0].process.processDefinitionKey)
})

test('Awaits a process outcome', async () => {
	const bpmnProcessId = test1.deployments[0].process.bpmnProcessId
	const result = await zbc.createProcessInstanceWithResult({
		bpmnProcessId,
		variables: {
			sourceValue: 5,
		},
	})
	expect(result.variables.sourceValue).toBe(5)
})

test('can override the gateway timeout', async () => {
	const bpmnProcessId = test2.deployments[0].process.bpmnProcessId
	const result = await zbc.createProcessInstanceWithResult({
		bpmnProcessId,
		requestTimeout: 25000,
		variables: {
			otherValue: 'rome',
			sourceValue: 5,
		},
	})
	expect(result.variables.sourceValue).toBe(5)
})

test('fetches a subset of variables', async () => {
	const bpmnProcessId = test3.deployments[0].process.bpmnProcessId
	const result = await zbc.createProcessInstanceWithResult({
		bpmnProcessId,
		fetchVariables: ['otherValue'],
		variables: {
			otherValue: 'rome',
			sourceValue: 5,
		},
	})
	expect(result.variables.sourceValue).toBe(undefined)
	expect(result.variables.otherValue).toBe('rome')
})
