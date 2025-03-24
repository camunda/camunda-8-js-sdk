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
			},
		],
	})
	// There is a breaking behaviour change between 8.6 and 8.7
	// In 8.6, the task processInstanceKey is of type number, in 8.7 it is of type string
	// This is a workaround to make the test pass in both versions
	expect(tasks.items[0].processInstanceKey.toString()).toBe(
		wfi.processInstanceKey
	)
	expect(tasks.items[0].userTaskKey).toBeTruthy()
})
