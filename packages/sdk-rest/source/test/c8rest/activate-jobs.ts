import path from 'node:path'
import test from 'ava'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {loadResourcesFromFiles} from '../helpers/_load-resources.js'

let processDefinitionId: string
const restClient = new CamundaRestClient()

test.before(async () => {
	const resources = loadResourcesFromFiles([
		path.join(
			'.',
			'distribution',
			'test',
			'resources',
			'hello-world-complete-rest.bpmn',
		),
	])
	const response = await restClient.deployResources({
		resources,
	})
	processDefinitionId = response.processDefinitions[0].processDefinitionId
})

test('Can service a task', async t => {
	await restClient
		.createProcessInstance({
			processDefinitionId,
			variables: {
				someNumberField: 8,
			},
		})

	const jobs = await restClient
		.activateJobs({
			maxJobsToActivate: 1,
			requestTimeout: 5000,
			timeout: 5000,
			type: 'console-log-complete-rest',
			worker: 'test',
		})

	t.is(jobs.length, 1)
	await jobs[0].complete()
})
