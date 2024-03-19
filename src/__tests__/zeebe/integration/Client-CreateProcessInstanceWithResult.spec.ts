import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import {
	DeployResourceResponse,
	ProcessDeployment,
	ZeebeGrpcClient,
} from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(25000)

suppressZeebeLogging()

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
	await cancelProcesses(test1.deployments[0].process.bpmnProcessId)
	await cancelProcesses(test2.deployments[0].process.bpmnProcessId)
	await cancelProcesses(test3.deployments[0].process.bpmnProcessId)
})

afterAll(async () => {
	await zbc.close() // Makes sure we don't forget to close connection
	restoreZeebeLogging()
	await cancelProcesses(test1.deployments[0].process.bpmnProcessId)
	await cancelProcesses(test2.deployments[0].process.bpmnProcessId)
	await cancelProcesses(test3.deployments[0].process.bpmnProcessId)
})

test('Awaits a process outcome', async () => {
	const processId = test1.deployments[0].process.bpmnProcessId
	const result = await zbc.createProcessInstanceWithResult({
		bpmnProcessId: processId,
		variables: {
			sourceValue: 5,
		},
	})
	expect(result.variables.sourceValue).toBe(5)
})

test('can override the gateway timeout', async () => {
	const processId = test2.deployments[0].process.bpmnProcessId
	const result = await zbc.createProcessInstanceWithResult({
		bpmnProcessId: processId,
		requestTimeout: 25000,
		variables: {
			otherValue: 'rome',
			sourceValue: 5,
		},
	})
	expect(result.variables.sourceValue).toBe(5)
})

test('fetches a subset of variables', async () => {
	const processId = test3.deployments[0].process.bpmnProcessId
	const result = await zbc.createProcessInstanceWithResult({
		bpmnProcessId: processId,
		fetchVariables: ['otherValue'],
		variables: {
			otherValue: 'rome',
			sourceValue: 5,
		},
	})
	expect(result.variables.sourceValue).toBe(undefined)
	expect(result.variables.otherValue).toBe('rome')
})
