import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { Duration, ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(30000)
suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let processDefinitionKey: string
let bpmnProcessId: string

beforeAll(async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/hello-world.bpmn',
	})
	;({ bpmnProcessId, processDefinitionKey } = res.deployments[0].process)
	await cancelProcesses(processDefinitionKey)
})

afterAll(async () => {
	await zbc.close() // Makes sure we don't forget to close connection
	restoreZeebeLogging()
	await cancelProcesses(processDefinitionKey)
})

test('BatchWorker gets ten jobs', async () => {
	for (let i = 0; i < 10; i++) {
		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: {},
		})
	}

	await new Promise((resolve) => {
		const w = zbc.createBatchWorker({
			jobBatchMaxTime: Duration.seconds.from(120),
			jobBatchMinSize: 10,
			loglevel: 'NONE',
			taskHandler: async (jobs) => {
				expect(jobs.length).toBe(10)
				const res1 = await Promise.all(jobs.map((job) => job.complete()))
				await w.close()
				resolve(null)
				return res1
			},
			taskType: 'console-log',
		})
	})
})
