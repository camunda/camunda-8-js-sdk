import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { createDtoInstance, LosslessDto } from '../../../lib'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 25_000 })

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

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can create a process from bpmn id',
	() =>
		new Promise((done) => {
			restClient
				.createProcessInstance({
					processDefinitionId,
					variables: {
						someNumberField: 8,
					},
				})
				.then((res) => {
					// Validate all fields in the CreateProcessInstanceResponse DTO
					expect(res.processDefinitionKey).toEqual(processDefinitionKey)
					expect(typeof res.processDefinitionKey).toBe('string')

					expect(res.processDefinitionId).toBeDefined()
					expect(res.processDefinitionId).toEqual(processDefinitionId)
					expect(typeof res.processDefinitionId).toBe('string')

					expect(res.processDefinitionVersion).toBeDefined()
					expect(typeof res.processDefinitionVersion).toBe('number')

					expect(res.processInstanceKey).toBeDefined()
					expect(typeof res.processInstanceKey).toBe('string')
					expect(res.processInstanceKey.length).toBeGreaterThan(0)

					expect(res.tenantId).toBeDefined()
					expect(typeof res.tenantId).toBe('string')

					// For standard createProcessInstance, variables should be empty
					expect(res.variables).toEqual({})

					done(void 0)
				})
		})
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can create a process from process definition key',
	() =>
		new Promise((done) => {
			restClient
				.createProcessInstance({
					processDefinitionKey,
					variables: {
						someNumberField: 8,
					},
				})
				.then((res) => {
					expect(res.processDefinitionKey).toEqual(processDefinitionKey)
					done(void 0)
				})
		})
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can create a process with a lossless Dto',
	() =>
		new Promise((done) => {
			restClient
				.createProcessInstance({
					processDefinitionKey,
					variables: createDtoInstance(myVariableDto, { someNumberField: 8 }),
				})
				.then((res) => {
					expect(res.processDefinitionKey).toEqual(processDefinitionKey)
					done(void 0)
				})
		})
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can create a process and get the result',
	() =>
		new Promise((done) => {
			const variables = createDtoInstance(myVariableDto, { someNumberField: 8 })
			restClient
				.createProcessInstanceWithResult({
					processDefinitionKey,
					variables,
					outputVariablesDto: myVariableDto,
				})
				.then((res) => {
					// Validate all fields in the CreateProcessInstanceResponse DTO with variables
					expect(res.processDefinitionKey).toEqual(processDefinitionKey)
					expect(typeof res.processDefinitionKey).toBe('string')

					expect(res.processDefinitionId).toBeDefined()
					expect(typeof res.processDefinitionId).toBe('string')

					expect(res.processDefinitionVersion).toBeDefined()
					expect(typeof res.processDefinitionVersion).toBe('number')

					expect(res.processInstanceKey).toBeDefined()
					expect(typeof res.processInstanceKey).toBe('string')
					expect(res.processInstanceKey.length).toBeGreaterThan(0)

					expect(res.tenantId).toBeDefined()
					expect(typeof res.tenantId).toBe('string')

					// For createProcessInstanceWithResult, variables should contain the input values
					expect(res.variables).toBeDefined()
					expect(res.variables.someNumberField).toBe(8)

					done(void 0)
				})
		})
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can create a process and get the result',
	() =>
		new Promise((done) => {
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
					done(void 0)
				})
		})
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('What happens if we time out?', async () => {
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
