import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { delay } from '../../../lib'

let processDefinitionId: string
const restClient = new CamundaRestClient()

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join(
			'.',
			'src',
			'__tests__',
			'testdata',
			'hello-world-complete-rest.bpmn'
		),
	])
	processDefinitionId = res.processes[0].processDefinitionId
})

test('Can service a task', (done) => {
	restClient
		.createProcessInstance({
			processDefinitionId,
			variables: {
				someNumberField: 8,
			},
		})
		.then(() => {
			restClient
				.activateJobs({
					maxJobsToActivate: 2,
					requestTimeout: 5000,
					timeout: 5000,
					type: 'console-log-complete-rest',
					worker: 'test',
				})
				.then((jobs) => {
					expect(jobs.length).toBe(1)
					jobs[0].complete().then(() => done())
				})
		})
})

// https://github.com/camunda/camunda-8-js-sdk/issues/424
test('Can cancel a call', async () => {
	const res = restClient.activateJobs({
		maxJobsToActivate: 2,
		requestTimeout: 5000,
		timeout: 5000,
		type: 'console-log-complete-rest',
		worker: 'test',
	})

	res.then(() => {
		throw new Error('Should not have received jobs')
	})
	res.cancel(`Activate jobs call cancelled from test`)
	const process = await restClient.createProcessInstance({
		processDefinitionId,
		variables: {
			someNumberField: 8,
		},
	})
	await delay(3000)
	await restClient.cancelProcessInstance({
		processInstanceKey: process.processInstanceKey,
	})
})
