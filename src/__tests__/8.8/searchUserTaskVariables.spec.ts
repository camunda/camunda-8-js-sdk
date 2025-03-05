import { randomUUID } from 'crypto'

import { CreateProcessInstanceResponse } from 'c8/lib/C8Dto'

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

test('It can retrieve the variables for a user task', async () => {
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
	await new Promise((r) => setTimeout(r, 7000))
	// Search user tasks
	const tasks = await c8.searchUserTasks({
		page: {
			from: 0,
			limit: 10,
		},
		filter: {
			state: 'CREATED',
		},
		sort: [
			{
				field: 'creationDate',
				order: 'asc',
			},
		],
	})
	expect(tasks.items[0].processInstanceKey).toBe(wfi.processInstanceKey)
	const task = await c8.getUserTask(tasks.items[0].userTaskKey)
	expect(task.processInstanceKey).toBe(wfi.processInstanceKey)
	const variables = await c8.searchUserTaskVariables({
		userTaskKey: tasks.items[0].userTaskKey,
		sort: [{ field: 'name', order: 'ASC' }],
	})
	expect(variables.items[0].value).toBe(`"${uuid}"`)
})
