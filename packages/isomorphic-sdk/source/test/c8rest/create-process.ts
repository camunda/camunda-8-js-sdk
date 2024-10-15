import path from 'node:path'
import test from 'ava'
import {createDtoInstance, LosslessDto} from '@camunda8/lossless-json'
import {HTTPError} from 'ky'
import {CamundaRestClient} from '../../c8-rest/index.js'

let processDefinitionId: string
let processDefinitionKey: string
const restClient = new CamundaRestClient()

test.before(async () => {
	const response = await restClient.deployResourcesFromFiles({
		files: [
			path.join(
				'.',
				'distribution',
				'test',
				'resources',
				'create-process-rest.bpmn',
			),
		],
	});
	({processDefinitionId, processDefinitionKey} = response.processDefinitions[0])
})

class MyVariableDto extends LosslessDto {
	someNumberField?: number
}

test('Can create a process from bpmn id', async t => {
	const response = await restClient
		.createProcessInstance({
			processDefinitionId,
			variables: {
				someNumberField: 8,
			},
		})

	t.is(response.processDefinitionKey, processDefinitionKey)
})

test('Can create a process from process definition key', async t => {
	const response = await restClient
		.createProcessInstance({
			processDefinitionKey,
			variables: {
				someNumberField: 8,
			},
		})
	t.is(response.processDefinitionKey, processDefinitionKey)
})

test('Can create a process with a lossless Dto', async t => {
	const response = await restClient
		.createProcessInstance({
			processDefinitionKey,
			variables: createDtoInstance(MyVariableDto, {someNumberField: 8}),
		})

	t.is(response.processDefinitionKey, processDefinitionKey)
})

test('Can create a process and get the result (with output Dto)', async t => {
	const variables = createDtoInstance(MyVariableDto, {someNumberField: 8})
	const response = await restClient
		.createProcessInstanceWithResult({
			processDefinitionKey,
			variables,
			outputVariablesDto: MyVariableDto,
		})

	t.is(response.processDefinitionKey, processDefinitionKey)
	t.is(response.variables.someNumberField, 8)
})

test('Can create a process and get the result (without output Dto)', async t => {
	const response = await restClient
		.createProcessInstanceWithResult({
			processDefinitionKey,
			variables: createDtoInstance(MyVariableDto, {someNumberField: 9}),
		})
	t.is(response.processDefinitionKey, processDefinitionKey)
	// Without an outputVariablesDto, the response variables will be of type unknown

	t.is((response.variables as any).someNumberField, 9)
})

test('What happens if we time out?', async t => {
	const response = await restClient.deployResourcesFromFiles({
		files: [
			path.join('.', 'distribution', 'test', 'resources', 'time-out-rest.bpmn'),
		],
	})
	const {processDefinitionId} = response.processDefinitions[0]
	const error = await t.throwsAsync(async () => restClient.createProcessInstanceWithResult({
		processDefinitionId,
		variables: createDtoInstance(MyVariableDto, {someNumberField: 9}),
		requestTimeout: 5000,
	}))
	t.true(error instanceof HTTPError)
	t.is((error as HTTPError).response.status, 504)
})

