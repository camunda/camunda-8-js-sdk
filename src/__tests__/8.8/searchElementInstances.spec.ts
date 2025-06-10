import { CamundaRestClient, PollingOperation } from '../../'

const c8 = new CamundaRestClient()

jest.setTimeout(10000)

test('It can search Element Instances', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-search-element-instances-test.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const { processInstanceKey } = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'search-element-instances-test',
		},
	})
	const elementInstances = await PollingOperation({
		operation: () =>
			c8.searchElementInstances({
				sort: [{ field: 'processDefinitionKey' }],
				filter: { processInstanceKey },
			}),
		interval: 500,
		timeout: 5000,
	})
	expect(elementInstances).toBeDefined()
	await c8.cancelProcessInstance({
		processInstanceKey,
	})
})
