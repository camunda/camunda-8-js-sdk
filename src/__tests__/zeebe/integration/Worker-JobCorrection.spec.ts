import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

jest.setTimeout(30000)
suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse | undefined
let processDefinitionKey1: string
let bpmnProcessId1: string

beforeAll(async () => {
	const res1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-JobCorrection.bpmn',
	})
	;({
		processDefinitionKey: processDefinitionKey1,
		bpmnProcessId: bpmnProcessId1,
	} = res1.deployments[0].process)
	await cancelProcesses(processDefinitionKey1)
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
})

afterAll(async () => {
	await zbc.close()
	await cancelProcesses(processDefinitionKey1)
	restoreZeebeLogging()
})

test('Can complete a task with job corrections', (done) => {
	zbc
		.createProcessInstance({
			bpmnProcessId: bpmnProcessId1,
			variables: {},
		})
		.then((res) => {
			wf = res
			zbc.createWorker({
				taskType: 'job-correction',
				taskHandler: async (job) => {
					expect(job.processInstanceKey).toBe(wf?.processInstanceKey)
					const res1 = await job.complete({
						// @TODO: correction interface
					})
					done(null)
					return res1
				},
				loglevel: 'NONE',
			})
		})
})
