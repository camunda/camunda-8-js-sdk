import { randomUUID } from 'crypto'

import { PollingOperation } from '../..'
import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

jest.setTimeout(30000)
let wfi: CreateProcessInstanceResponse<unknown>
afterAll(async () => {
	if (wfi) {
		await c8.cancelProcessInstance({
			processInstanceKey: wfi.processInstanceKey,
		})
	}
})

test('It can search user tasks', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/test-tasks-query.bpmn',
		'./src/__tests__/testdata/form/test-basic-form.form',
	])
	const key = res.processes[0].processDefinitionKey
	const id = res.processes[0].processDefinitionId
	const uuid = randomUUID()
	wfi = await c8.createProcessInstance({
		processDefinitionId: id,
		variables: {
			queryTag: uuid,
		},
	})
	expect(wfi.processDefinitionKey).toBe(key)
	// Search user tasks
	const tasks = await PollingOperation({
		operation: () =>
			c8.searchUserTasks({
				page: {
					from: 0,
					limit: 10,
				},
				filter: {
					state: 'CREATED',
					processInstanceKey: wfi.processInstanceKey,
				},
				sort: [
					{
						field: 'creationDate',
					},
				],
			}),
		interval: 500,
		timeout: 7000,
	})

	// Validate paginated response structure
	expect(tasks).toBeDefined()
	expect(tasks.items).toBeDefined()
	expect(Array.isArray(tasks.items)).toBe(true)
	expect(tasks.items.length).toBeGreaterThan(0)
	expect(tasks.page).toBeDefined()
	expect(tasks.page.totalItems).toBeGreaterThan(0)
	expect(tasks.page.startCursor).toBeDefined()
	expect(tasks.page.endCursor).toBeDefined()

	// Get first user task from results
	const task = tasks.items[0]

	// Validate all fields in the UserTaskDetails DTO
	expect(task.processInstanceKey).toBe(wfi.processInstanceKey)
	expect(task.userTaskKey).toBeDefined()
	expect(typeof task.userTaskKey).toBe('string')
	expect(task.elementInstanceKey).toBeDefined()
	expect(typeof task.elementInstanceKey).toBe('string')
	expect(task.processDefinitionKey).toBeDefined()
	expect(typeof task.processDefinitionKey).toBe('string')

	// If formKey is available in the response
	if (task.formKey) {
		expect(typeof task.formKey).toBe('string')
	}

	// Get the complete user task details
	const completeTask = await PollingOperation({
		operation: () => c8.getUserTask(task.userTaskKey),
		predicate: (response) => response.userTaskKey === task.userTaskKey,
		timeout: 5000,
	})

	// Validate the complete UserTask DTO
	expect(completeTask).toBeDefined()
	expect(completeTask.userTaskKey).toBe(task.userTaskKey)
	expect(completeTask.elementInstanceKey).toBe(task.elementInstanceKey)
	expect(completeTask.processDefinitionKey).toBe(task.processDefinitionKey)
	expect(completeTask.processInstanceKey).toBe(task.processInstanceKey)

	// Additional fields in the complete UserTask response
	expect(completeTask.name).toBeDefined()
	expect(typeof completeTask.name).toBe('string')
	expect(completeTask.state).toBe('CREATED')
	expect(completeTask.elementId).toBeDefined()
	expect(typeof completeTask.elementId).toBe('string')
	expect(completeTask.processDefinitionId).toBeDefined()
	expect(typeof completeTask.processDefinitionId).toBe('string')
	expect(completeTask.creationDate).toBeDefined()
	expect(typeof completeTask.creationDate).toBe('string')
	expect(completeTask.tenantId).toBeDefined()
	expect(completeTask.processDefinitionVersion).toBeDefined()
	expect(typeof completeTask.processDefinitionVersion).toBe('number')
	expect(completeTask.priority).toBeDefined()
	expect(typeof completeTask.priority).toBe('number')

	// These fields might be optional
	if (completeTask.assignee !== undefined) {
		expect(typeof completeTask.assignee).toBe('string')
	}
	if (completeTask.candidateGroups !== undefined) {
		expect(Array.isArray(completeTask.candidateGroups)).toBe(true)
	}
	if (completeTask.candidateUsers !== undefined) {
		expect(Array.isArray(completeTask.candidateUsers)).toBe(true)
	}
	if (completeTask.completionDate !== undefined) {
		expect(typeof completeTask.completionDate).toBe('string')
	}
	if (completeTask.followUpDate !== undefined) {
		expect(typeof completeTask.followUpDate).toBe('string')
	}
	if (completeTask.dueDate !== undefined) {
		expect(typeof completeTask.dueDate).toBe('string')
	}
	if (completeTask.externalFormReference !== undefined) {
		expect(typeof completeTask.externalFormReference).toBe('string')
	}

	// Validate customHeaders
	expect(completeTask.customHeaders).toBeDefined()
	expect(typeof completeTask.customHeaders).toBe('object')
})
