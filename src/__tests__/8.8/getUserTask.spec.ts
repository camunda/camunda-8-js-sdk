import { randomUUID } from 'crypto'

import { PollingOperation } from 'lib/PollingOperation'

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
	expect(tasks.items[0].processInstanceKey).toBe(wfi.processInstanceKey)
	const task = await c8.getUserTask(tasks.items[0].userTaskKey)
	expect(task.processInstanceKey).toBe(wfi.processInstanceKey)
})
