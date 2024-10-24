import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

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
