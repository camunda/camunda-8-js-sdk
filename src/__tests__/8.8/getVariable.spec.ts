import path from 'node:path'

import { CamundaJobWorker } from '../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../lib'
import { PollingOperation } from '../../lib/PollingOperation'

let processDefinitionId: string
let worker: CamundaJobWorker<LosslessDto, LosslessDto>
const restClient = new CamundaRestClient()

jest.setTimeout(30000)
afterAll(() => {
	worker && worker.stop()
})

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'rest-get-variable.bpmn'),
	])
	processDefinitionId = res.processes[0].processDefinitionId
})

test('Can get a variable', (done) => {
	restClient.createProcessInstance({
		processDefinitionId,
		variables: {
			someVariableField: 8,
		},
	})
	worker = restClient.createJobWorker({
		type: 'get-variable',
		jobHandler: async (job) => {
			// query variables to get the variable key
			const variables = await PollingOperation({
				operation: () =>
					restClient.searchVariables({
						filter: {
							processInstanceKey: job.processInstanceKey,
						},
					}),
				interval: 500,
				timeout: 5000,
			})

			const { variableKey } = variables.items[0]

			const variable = await restClient.getVariable({
				variableKey,
			})

			expect(variable.value).toBe(8)
			return job.complete().then((res) => {
				done()
				return res
			})
		},
		worker: 'get-variable-worker',
		timeout: 30000,
		maxJobsToActivate: 10,
	})
})
