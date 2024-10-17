import test from 'ava'
import {HTTPError} from 'ky'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {loadResourcesFromFiles} from '../helpers/_load-resources.js'

const c8 = new CamundaRestClient()

test('It can delete a resource', async t => {
	const resources = loadResourcesFromFiles(['./distribution/test/resources/Delete-Resource-Rest.bpmn'])
	const response = await c8.deployResources({
		resources,
	})
	const key = response.processDefinitions[0].processDefinitionKey
	const id = response.processDefinitions[0].processDefinitionId
	const wfi = await c8.createProcessInstance({
		processDefinitionId: id,
		variables: {},
	})
	t.is(wfi.processDefinitionKey, key)
	await c8.deleteResource({resourceKey: key})
	// After deleting the process definition, we should not be able to start a new process instance.
	const error = await t.throwsAsync(async () => c8.createProcessInstance({processDefinitionId: id, variables: {}}))
	t.true(error instanceof HTTPError)
	t.is((error as HTTPError).response.status, 404)
})
