import { randomUUID } from 'crypto'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

jest.setTimeout(30000)
test('It can retrieve a user task', async () => {
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
	await new Promise((r) => setTimeout(r, 7000))
	const instances = await c8.searchProcessInstances({
		sort: [{ field: 'state', order: 'ASC' }],
		filter: { state: 'ACTIVE' },
	})
	console.log(instances) //@debug
	expect(instances.items[0].processInstanceKey).toBe(wfi.processInstanceKey)
})
