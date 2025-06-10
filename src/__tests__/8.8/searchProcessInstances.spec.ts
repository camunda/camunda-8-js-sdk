import { randomUUID } from 'crypto'

import { CamundaRestClient, PollingOperation } from '../..'
import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'

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
	const instances = await PollingOperation({
		operation: () =>
			c8.searchProcessInstances({
				sort: [{ field: 'state' }],
				filter: { state: 'ACTIVE', processInstanceKey: wfi.processInstanceKey },
			}),
		interval: 500,
		timeout: 7000,
	})
	const result = instances.items.filter(
		(i) => i.processInstanceKey === wfi.processInstanceKey
	)
	expect(result.length).toBeGreaterThan(0)
	await c8.cancelProcessInstance({
		processInstanceKey: wfi.processInstanceKey,
	})
})
