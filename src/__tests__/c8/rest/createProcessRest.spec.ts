import path from 'node:path'

import { C8RestClient } from '../../../c8/lib/C8RestClient'
import { LosslessDto } from '../../../lib'

let bpmnProcessId: string
let processDefinitionKey: string
const restClient = new C8RestClient()

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'create-process-rest.bpmn'),
	])
	;({ bpmnProcessId, processDefinitionKey } = res.processes[0])
})

class myVariableDto extends LosslessDto {
	someNumberField?: number
}

test('Can create a process from bpmn id', (done) => {
	restClient
		.createProcessInstance({
			bpmnProcessId,
			variables: {
				someNumberField: 8,
			},
		})
		.then((res) => {
			expect(res.processKey).toEqual(processDefinitionKey)
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
			expect(res.processKey).toEqual(processDefinitionKey)
			done()
		})
})

test('Can create a process with a lossless Dto', (done) => {
	restClient
		.createProcessInstance({
			processDefinitionKey,
			variables: new myVariableDto({ someNumberField: 8 }),
		})
		.then((res) => {
			expect(res.processKey).toEqual(processDefinitionKey)
			done()
		})
})

test('Can create a process and get the result', (done) => {
	const variables = new myVariableDto({ someNumberField: 8 })
	restClient
		.createProcessInstanceWithResult({
			processDefinitionKey,
			variables,
			outputVariablesDto: myVariableDto,
		})
		.then((res) => {
			console.log(res)
			expect(res.processKey).toEqual(processDefinitionKey)
			expect(res.variables.someNumberField).toBe(8)
			done()
		})
})

test('Can create a process and get the result', (done) => {
	restClient
		.createProcessInstanceWithResult({
			processDefinitionKey,
			variables: new myVariableDto({ someNumberField: 9 }),
		})
		.then((res) => {
			expect(res.processKey).toEqual(processDefinitionKey)
			// Without an outputVariablesDto, the response variables will be of type unknown
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			expect((res.variables as any).someNumberField).toBe(9)
			done()
		})
})
