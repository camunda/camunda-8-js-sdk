import { randomUUID } from 'crypto'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

jest.setTimeout(30000)
test('It can query user tasks', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/test-tasks-query.bpmn',
		'./src/__tests__/testdata/form/test-basic-form.form',
	])
	const key = res.processes[0].processDefinitionKey
	const id = res.processes[0].processDefinitionId
	const uuid = randomUUID()
	const wfi = await c8.createProcessInstance({
		processDefinitionId: id,
		variables: {
			queryTag: uuid,
		},
	})
	expect(wfi.processDefinitionKey).toBe(key)
	await new Promise((r) => setTimeout(r, 5000))
	// Do we need to wait for the process instance to be started and arrive at the user task?
	// Search user tasks
	const tasks = await c8.findUserTasks({
		page: {
			from: 0,
			limit: 10,
			searchAfter: [],
			searchBefore: [],
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
	console.log('tasks', tasks)
})
