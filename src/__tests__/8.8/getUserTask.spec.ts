import { randomUUID } from 'crypto'

import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'

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
	expect(tasks.items[0].processInstanceKey).toBe(wfi.processInstanceKey)
	const task = await c8.getUserTask(tasks.items[0].userTaskKey)

	// Validate all fields in the UserTask DTO
	expect(task.processInstanceKey).toBe(wfi.processInstanceKey)
	expect(task.userTaskKey).toBe(tasks.items[0].userTaskKey)
	expect(task.processDefinitionKey).toBe(key)
	expect(task.processDefinitionId).toBeDefined()
	expect(task.processDefinitionVersion).toBeGreaterThan(0)
	expect(task.elementId).toBeDefined()
	expect(task.elementInstanceKey).toBeDefined()
	expect(task.name).toBeDefined()
	expect(task.state).toBe('CREATED')
	expect(task.tenantId).toBeDefined()
	expect(task.creationDate).toBeDefined()
	expect(typeof task.creationDate).toBe('string')
	expect(task.priority).toBeGreaterThanOrEqual(0)
	expect(task.customHeaders).toBeDefined()
	expect(typeof task.customHeaders).toBe('object')

	// Optional fields - check type if they exist
	if (task.assignee !== undefined) {
		expect(typeof task.assignee).toBe('string')
	}

	if (task.completionDate !== undefined) {
		expect(typeof task.completionDate).toBe('string')
	}

	if (task.followUpDate !== undefined) {
		expect(typeof task.followUpDate).toBe('string')
	}

	if (task.dueDate !== undefined) {
		expect(typeof task.dueDate).toBe('string')
	}

	if (task.candidateGroups !== undefined) {
		expect(Array.isArray(task.candidateGroups)).toBe(true)
	}

	if (task.candidateUsers !== undefined) {
		expect(Array.isArray(task.candidateUsers)).toBe(true)
	}

	if (task.formKey !== undefined) {
		expect(typeof task.formKey).toBe('string')
	}

	if (task.externalFormReference !== undefined) {
		expect(typeof task.externalFormReference).toBe('string')
	}
})
