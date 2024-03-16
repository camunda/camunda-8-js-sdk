import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { Duration, ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(30000)
suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let processId: string

beforeAll(async () => {
	const res = await zbc.deployProcess(
		'./src/__tests__/testdata/hello-world.bpmn'
	)
	processId = res.processes[0].bpmnProcessId
	await cancelProcesses(processId)
})

afterAll(async () => {
	await zbc.close() // Makes sure we don't forget to close connection
	restoreZeebeLogging()
	await cancelProcesses(processId)
})

test('BatchWorker gets ten jobs', async () => {
	for (let i = 0; i < 10; i++) {
		await zbc.createProcessInstance({
			bpmnProcessId: processId,
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
