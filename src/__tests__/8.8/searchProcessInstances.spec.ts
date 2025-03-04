import { randomUUID } from 'crypto'

import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

jest.setTimeout(30000)

let wfi: CreateProcessInstanceResponse<unknown>

test('It can search process instances', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
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
	const instances = await c8.searchProcessInstances({
		sort: [{ field: 'state' }],
		filter: { state: 'ACTIVE' },
	})
	expect(instances.items[0].processInstanceKey).toBe(wfi.processInstanceKey)
})
