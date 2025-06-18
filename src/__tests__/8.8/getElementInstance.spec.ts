import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'

const c8 = new CamundaRestClient()

jest.setTimeout(10000)

test('It can get an Element Instance', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-search-element-instances-test.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processInstance = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'search-element-instances-test',
		},
	})
	const elementInstances = await PollingOperation({
		operation: () =>
			c8.searchElementInstances({
				sort: [{ field: 'processDefinitionKey' }],
				filter: { processDefinitionKey: key },
			}),
		interval: 500,
		timeout: 5000,
	})

	expect(elementInstances).toBeDefined()
	const elementInstance = await c8.getElementInstance(
		elementInstances.items[0].elementInstanceKey
	)
	expect(elementInstance.elementId).toBe('StartEvent_1')
	await c8.cancelProcessInstance({
		processInstanceKey: processInstance.processInstanceKey,
	})
})
