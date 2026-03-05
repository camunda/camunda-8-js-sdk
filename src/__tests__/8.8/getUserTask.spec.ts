import { randomUUID } from 'crypto'

import { afterAll, expect, test, vi } from 'vitest'

import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()

vi.setConfig({ testTimeout: 30_000 })

let wfi: CreateProcessInstanceResponse<unknown>
afterAll(async () => {
	if (wfi) {
		await c8.cancelProcessInstance({
			processInstanceKey: wfi.processInstanceKey,
		})
	}
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can search user tasks', async () => {
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
	const task = await PollingOperation({
		operation: () => c8.getUserTask(tasks.items[0].userTaskKey),
		predicate: (res) => res.userTaskKey === tasks.items[0].userTaskKey,
	})

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
	expect(typeof task.creationDate, 'creationDate should be string').toBe(
		'string'
	)
	expect(task.priority).toBeGreaterThanOrEqual(0)

	// Nullable/optional fields - in 8.9+ these are required but nullable (value is null),
	// in 8.8 they are optional (value is undefined). Accept string or null.
	expect(
		task.assignee === null /* 8.9 nullable */ ||
			typeof task.assignee === 'string' /* 8.8 / 8.9 */ ||
			typeof task.assignee === 'undefined' /* 8.8 missing */,
		'assignee should be string or null'
	).toBe(true)
	expect(
		task.completionDate === null || typeof task.completionDate === 'string',
		'completionDate should be string or null'
	).toBe(true)
	expect(
		task.followUpDate === null || typeof task.followUpDate === 'string',
		'followUpDate should be string or null'
	).toBe(true)
	expect(
		task.dueDate === null || typeof task.dueDate === 'string',
		'dueDate should be string or null'
	).toBe(true)
	expect(
		task.formKey === null ||
			task.formKey === undefined ||
			typeof task.formKey === 'string',
		'formKey should be string, null, or undefined'
	).toBe(true)
	expect(
		task.externalFormReference === null ||
			task.externalFormReference === undefined ||
			typeof task.externalFormReference === 'string',
		'externalFormReference should be string, null, or undefined'
	).toBe(true)

	if (task.candidateGroups !== undefined) {
		expect(Array.isArray(task.candidateGroups)).toBe(true)
	}

	if (task.candidateUsers !== undefined) {
		expect(Array.isArray(task.candidateUsers)).toBe(true)
	}
})
