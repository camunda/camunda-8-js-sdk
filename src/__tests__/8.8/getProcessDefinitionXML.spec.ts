import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

test('It can get the Process Definition XML', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processXML = await c8.getProcessDefinitionXML(key)
	expect(processXML).toContain('<bpmn:process id=')
	expect(processXML).toContain('search-process-instances-test')
})
