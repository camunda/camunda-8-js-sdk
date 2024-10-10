import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

test('It can delete a resource', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/Delete-Resource-Rest.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const id = res.processes[0].processDefinitionId
	const wfi = await c8.createProcessInstance({
		processDefinitionId: id,
		variables: {},
	})
	expect(wfi.processDefinitionKey).toBe(key)
	await c8.deleteResource({ resourceKey: key })
	// After deleting the process definition, we should not be able to start a new process instance.
	await expect(
		c8.createProcessInstance({ processDefinitionId: id, variables: {} })
	).rejects.toThrow('404')
})
