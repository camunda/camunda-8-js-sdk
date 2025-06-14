import path from 'node:path'

import { CamundaJobWorker } from '../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { delay, LosslessDto } from '../../lib'

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
			// We know the process instance exists, we wait for Operate to sync
			await delay(5000)
			// query variables to get the variable key
			const variables = await restClient.searchVariables({
				filter: {
					processInstanceKey: job.processInstanceKey,
				},
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
