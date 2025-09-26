import * as uuid from 'uuid'

import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

vi.setConfig({ testTimeout: 40_000 })

let processId: string

let zbcLongPoll: ZeebeGrpcClient

afterAll(async () => {
	await zbcLongPoll.close()
	await cancelProcesses(processId)
})

beforeAll(async () => {
	zbcLongPoll = new ZeebeGrpcClient({
		config: { zeebeGrpcSettings: { ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS: 60 } },
	})
	const res = await zbcLongPoll.deployResource({
		processFilename: './src/__tests__/testdata/Worker-LongPoll.bpmn',
	})
	processId = res.deployments[0].process.processDefinitionKey
	await cancelProcesses(processId)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does long poll by default',
	() =>
		new Promise<void>((done) => {
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
)
