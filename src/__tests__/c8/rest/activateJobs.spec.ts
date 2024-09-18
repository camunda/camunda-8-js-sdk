import path from 'node:path'

import { DeployResourceResponse } from '../../../c8/lib/C8Dto'
import { C8RestClient } from '../../../c8/lib/C8RestClient'
import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'

suppressZeebeLogging()
let res: DeployResourceResponse
let bpmnProcessId: string
const restClient = new C8RestClient()

beforeAll(async () => {
	res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'hello-world-complete.bpmn'),
	])
	bpmnProcessId = res.processes[0].bpmnProcessId
})

afterAll(async () => {
	restoreZeebeLogging()
})

test('Can service a task', (done) => {
	restClient
		.createProcessInstance({
			bpmnProcessId,
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
					type: 'console-log-complete',
					worker: 'test',
				})
				.then((jobs) => {
					expect(jobs.length).toBe(1)
					jobs[0].complete().then(() => done())
				})
		})
})
