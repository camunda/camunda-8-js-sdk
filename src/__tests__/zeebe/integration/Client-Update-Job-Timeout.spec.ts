import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(60000)

let zbc: ZeebeGrpcClient
let wf: CreateProcessInstanceResponse | undefined

beforeAll(() => suppressZeebeLogging())
afterAll(() => restoreZeebeLogging())

beforeEach(() => {
	zbc = new ZeebeGrpcClient()
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
	await zbc.close() // Makes sure we don't forget to close connection
})

test('can update Job Timeout', async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Client-Update-Job-Timeout.bpmn',
	})
	await cancelProcesses(res.deployments[0].process.processDefinitionKey)
	wf = await zbc.createProcessInstance({
		bpmnProcessId: 'update-job-timeout-process',
		variables: {},
	})

	const worker = zbc.createWorker({
		taskType: 'update-job-timeout',
		taskHandler: async (job) => {
			await zbc.updateJobTimeout({
				jobKey: job.key,
				timeout: 3000,
			})
			return job.complete().then(async (res) => {
				await worker.close()
				return res
			})
		},
	})
})
