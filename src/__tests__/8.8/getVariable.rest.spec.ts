import path from 'node:path'

import { LosslessDto } from 'lib'

import { CamundaJobWorker } from '../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

let processDefinitionId: string
let worker: CamundaJobWorker<LosslessDto, LosslessDto>
const restClient = new CamundaRestClient()

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
			someNumberField: 8,
		},
	})
	worker = restClient.createJobWorker({
		type: 'get-variable',
		jobHandler: async (job) => {
			// query variables to get the variable key
			const variableKey = ''

			const variable = await restClient.getVariable({
				variableKey,
			})
			expect(variable.fullValue).toBe(8)
			return job.complete().then((res) => {
				done()
				return res
			})
		},
		worker: 'get-variable-worker',
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
