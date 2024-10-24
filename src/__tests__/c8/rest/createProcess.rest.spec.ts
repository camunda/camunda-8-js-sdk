import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { createDtoInstance, LosslessDto } from '../../../lib'

jest.setTimeout(17000)

let processDefinitionId: string
let processDefinitionKey: string
const restClient = new CamundaRestClient()

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'create-process-rest.bpmn'),
	])
	;({ processDefinitionId, processDefinitionKey } = res.processes[0])
})

class myVariableDto extends LosslessDto {
	someNumberField?: number
}

test('Can create a process from bpmn id', (done) => {
	restClient
		.createProcessInstance({
			processDefinitionId,
			variables: {
				someNumberField: 8,
			},
		})
		.then((res) => {
			expect(res.processDefinitionKey).toEqual(processDefinitionKey)
			done()
		})
})

test('Can create a process from process definition key', (done) => {
	restClient
		.createProcessInstance({
			processDefinitionKey,
			variables: {
				someNumberField: 8,
			},
		})
		.then((res) => {
			expect(res.processDefinitionKey).toEqual(processDefinitionKey)
			done()
		})
})

test('Can create a process with a lossless Dto', (done) => {
	restClient
		.createProcessInstance({
			processDefinitionKey,
			variables: createDtoInstance(myVariableDto, { someNumberField: 8 }),
		})
		.then((res) => {
			expect(res.processDefinitionKey).toEqual(processDefinitionKey)
			done()
		})
})

test('Can create a process and get the result', (done) => {
	const variables = createDtoInstance(myVariableDto, { someNumberField: 8 })
	restClient
		.createProcessInstanceWithResult({
			processDefinitionKey,
			variables,
			outputVariablesDto: myVariableDto,
		})
		.then((res) => {
			expect(res.processDefinitionKey).toEqual(processDefinitionKey)
			expect(res.variables.someNumberField).toBe(8)
			done()
		})
})

test('Can create a process and get the result', (done) => {
	restClient
		.createProcessInstanceWithResult({
			processDefinitionKey,
			variables: createDtoInstance(myVariableDto, { someNumberField: 9 }),
		})
		.then((res) => {
			expect(res.processDefinitionKey).toEqual(processDefinitionKey)
			// Without an outputVariablesDto, the response variables will be of type unknown
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((res.variables as any).someNumberField).toBe(9)
			done()
		})
})

test('What happens if we time out?', async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'hello-world-complete.bpmn'),
	])
	const processDefinitionId = res.processes[0].processDefinitionId
	await expect(
		restClient.createProcessInstanceWithResult({
			processDefinitionId,
			variables: createDtoInstance(myVariableDto, { someNumberField: 9 }),
			requestTimeout: 20000,
		})
	).rejects.toThrow('504')
})
