import { ZeebeGrpcClient } from '../../../zeebe'

jest.setTimeout(20000)

test('can delete a resource', async () => {
	let thrown = false
	const zbc = new ZeebeGrpcClient()

	const deployment = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/DeleteResource.bpmn',
	})

	const resourceKey = deployment.deployments[0].process.processDefinitionKey

	const process = await zbc.createProcessInstance({
		bpmnProcessId: 'delete-me',
		variables: {},
	})

	await zbc.cancelProcessInstance(process.processInstanceKey)

	await zbc.deleteResource({ resourceKey })
	try {
		/** This should now throw, as the resource has been deleted */
		const process2 = await zbc.createProcessInstance({
			bpmnProcessId: 'delete-me',
			variables: {},
		})
		await zbc.cancelProcessInstance(process2.processInstanceKey)
	} catch (e) {
		thrown = true
	}
	expect(thrown).toBe(true)
	await zbc.close()
})
