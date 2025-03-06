import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { delay } from '../../lib'

const c8 = new CamundaRestClient()
jest.setTimeout(25000)
test('It can retrieve a linked user task form', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/form/test-form-retrieval.bpmn',
		'./src/__tests__/testdata/form/test-basic-form.form',
	])
	const definitionKey = res.processes[0].processDefinitionKey
	const definitionId = res.processes[0].processDefinitionId
	const wfi = await c8.createProcessInstance({
		processDefinitionId: definitionId,
		variables: {},
	})
	const processInstanceKey = wfi.processInstanceKey

	expect(wfi.processDefinitionKey).toBe(definitionKey)
	// Search user tasks

	await delay(7000)
	console.log({
		filter: { processInstanceKey },
		page: { from: 0, limit: 100 },
		sort: [{ field: 'priority', order: 'asc' }],
	})
	const tasks = await c8.searchUserTasks({
		filter: { processInstanceKey },
		page: { from: 0, limit: 100 },
		sort: [{ field: 'priority', order: 'asc' }],
	})
	// tslint:disable-next-line: no-console
	console.log('tasks', tasks) // @DEBUG

	expect(tasks.items.length).toBe(1)
	// Now retrieve the form
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const form = await c8.getUserTaskForm((tasks.items[0] as any).key)
	expect(form.formKey).toBe(tasks.items[0].formKey)
})
