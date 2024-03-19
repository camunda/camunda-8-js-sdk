import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'
import * as uuid from 'uuid'

import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'

jest.setTimeout(40000)

let processId: string

suppressZeebeLogging()

const zbcLongPoll = new ZeebeGrpcClient({
	config: { zeebeGrpcSettings: { ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS: 60 } },
})

afterAll(async () => {
	await zbcLongPoll.close()
	restoreZeebeLogging()
	await cancelProcesses(processId)
})

beforeAll(async () => {
	const res = await zbcLongPoll.deployResource({
		processFilename: './src/__tests__/testdata/Worker-LongPoll.bpmn',
	})
	processId = res.deployments[0].process.bpmnProcessId
	await cancelProcesses(processId)
})

test('Does long poll by default', (done) => {
	const worker = zbcLongPoll.createWorker({
		taskType: uuid.v4(),
		taskHandler: (job) => job.complete(job.variables),
		loglevel: 'NONE',
		debug: true,
	})
	// Wait to outside 10s - it should have polled once when it gets the job
	setTimeout(async () => {
		expect(worker.pollCount).toBe(1)
		done()
	}, 30000)
})
