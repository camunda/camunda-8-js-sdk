import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

test('It can search Process Definitions', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processDefinitions = await c8.searchProcessDefinitions({
		sort: [{ field: 'processDefinitionKey' }],
		filter: { processDefinitionKey: key },
	})
	expect(processDefinitions.items[0].processDefinitionId).toBe(
		'search-process-instances-test'
	)
})
