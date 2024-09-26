import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import {
	CreateProcessInstanceResponse,
	DeployResourceResponse,
	ProcessDeployment,
} from '../../../zeebe/lib/interfaces-grpc-1.0'

jest.setTimeout(30000)

const trace = async <T>(result: T) => {
	// tslint:disable-next-line: no-console
	// console.log(result)
	return result
}

suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse
let deploy: DeployResourceResponse<ProcessDeployment>
let bpmnProcessId: string
let processDefinitionKey: string

beforeAll(async () => {
	deploy = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/conditional-pathway.bpmn',
	})
	bpmnProcessId = deploy.deployments[0].process.bpmnProcessId
	processDefinitionKey = deploy.deployments[0].process.processDefinitionKey
	await cancelProcesses(processDefinitionKey)
})

afterAll(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e) // Cleanup any active processes
	}
	await zbc.close() // Make sure to close the connection
	restoreZeebeLogging()
	await cancelProcesses(processDefinitionKey)
})

test('Can update process variables with setVariables', async () => {
	jest.setTimeout(30000)

	wf = await zbc
		.createProcessInstance({
			bpmnProcessId,
			variables: {
				conditionVariable: true,
			},
		})
		.then(trace)

	const wfi = wf?.processInstanceKey
	expect(wfi).toBeTruthy()

	await zbc
		.setVariables({
			elementInstanceKey: wfi,
			local: false,
			variables: {
				conditionVariable: false,
			},
		})
		.then(trace)

	zbc.createWorker({
		taskType: 'wait',
		taskHandler: async (job) => {
			expect(job?.processInstanceKey).toBe(wfi)
			trace(`Completing wait job for ${job.processInstanceKey}`)
			return job.complete()
		},
	})

	await new Promise((resolve, reject) => {
		zbc.createWorker({
			taskType: 'pathB',
			taskHandler: async (job) => {
				try {
					expect(job?.processInstanceKey).toBe(wfi)
					expect(job?.variables?.conditionVariable).toBe(false)
					resolve(null)
					return job.complete()
				} catch (error) {
					reject(error)
					return job.complete()
				}
			},
		})
	})
})
