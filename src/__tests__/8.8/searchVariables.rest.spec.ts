import path from 'node:path'

import { CamundaJobWorker } from 'c8/lib/CamundaJobWorker'
import { LosslessDto } from 'lib'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

jest.setTimeout(10000)
let processDefinitionId: string
const restClient = new CamundaRestClient()
let w: CamundaJobWorker<LosslessDto, LosslessDto>

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'rest-query-variables.bpmn'),
	])
	processDefinitionId = res.processes[0].processDefinitionId
})

afterEach(async () => {
	if (w) {
		await w.stop()
	}
})

test('Can query variables', (done) => {
	restClient.createProcessInstance({
		processDefinitionId,
		variables: {
			someNumberField: 8,
		},
	})
	w = restClient.createJobWorker({
		type: 'query-variables',
		jobHandler: async (job) => {
			await new Promise((res) => setTimeout(() => res(null), 5000))
			const variables = await restClient.searchVariables({
				filter: {
					processInstanceKey: job.processInstanceKey,
				},
			})
			expect(variables.items.length).toBe(1)
			const res = await job.complete()
			done()
			return res
		},
		worker: 'query-variables-worker',
		timeout: 10000,
		maxJobsToActivate: 10,
	})
	// .then(() => {
	// 	restClient
	// 		.getVariable({
	// 			variableKey: 'someNumberField',
	// 		})
	// 		.then((variable) => {
	// 			expect(variable).toBe(8)
	// 			done()
	// 		})
	// })
})
