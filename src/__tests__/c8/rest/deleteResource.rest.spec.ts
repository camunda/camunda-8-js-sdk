import { C8RestClient } from '../../../c8/lib/C8RestClient'

const c8 = new C8RestClient()

test('It can delete a resource', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/Delete-Resource-Rest.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const id = res.processes[0].bpmnProcessId
	const wfi = await c8.createProcessInstance({
		bpmnProcessId: id,
		variables: {},
	})
	expect(wfi.processDefinitionKey).toBe(key)
	await c8.deleteResource({ resourceKey: key })
	// After deleting the process definition, we should not be able to start a new process instance.
	await expect(
		c8.createProcessInstance({ bpmnProcessId: id, variables: {} })
	).rejects.toThrow('404')
})
