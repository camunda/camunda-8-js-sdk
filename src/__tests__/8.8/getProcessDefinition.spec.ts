import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

test('It can get the Process Definition', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processDefinition = await c8.getProcessDefinition(key)
	expect(processDefinition.processDefinitionId).toBe(
		'search-process-instances-test'
	)
})
