import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

test('It can get the Process Definition', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processDefinition = await c8.getProcessDefinition(key)

	// Validate all fields of the GetProcessDefinitionResponse DTO
	expect(processDefinition.processDefinitionId).toBe(
		'search-process-instances-test'
	)
	expect(processDefinition.processDefinitionKey).toBe(key)
	expect(processDefinition.name).toBeDefined()
	expect(typeof processDefinition.name).toBe('string')
	expect(processDefinition.resourceName).toBeDefined()
	expect(typeof processDefinition.resourceName).toBe('string')
	expect(processDefinition.version).toBeDefined()
	expect(typeof processDefinition.version).toBe('number')
	expect(processDefinition.tenantId).toBeDefined()

	// versionTag is optional, so check if it exists, then validate its type
	if (processDefinition.versionTag !== undefined) {
		expect(typeof processDefinition.versionTag).toBe('string')
	}
})
