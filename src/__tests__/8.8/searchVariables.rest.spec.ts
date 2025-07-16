import path from 'node:path'

import { CamundaJobWorker, CamundaRestClient, PollingOperation } from '../../'
import { LosslessDto } from '../../lib'

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
			const variables = await PollingOperation({
				operation: () =>
					restClient.searchVariables({
						filter: {
							processInstanceKey: job.processInstanceKey,
						},
						sort: [{ field: 'name', order: 'ASC' }],
						page: { from: 0, limit: 1000 },
					}),
				interval: 500,
				timeout: 5000,
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
})
