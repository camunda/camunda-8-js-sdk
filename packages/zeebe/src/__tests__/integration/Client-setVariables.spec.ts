import { ZBClient } from '../..'
import { cancelProcesses } from '../../lib/cancelProcesses'
import {
	CreateProcessInstanceResponse,
	DeployProcessResponse,
} from '../../lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(30000)

const trace = async <T>(result: T) => {
	// tslint:disable-next-line: no-console
	// console.log(result)
	return result
}

const zbc = new ZBClient()
let wf: CreateProcessInstanceResponse
let deploy: DeployProcessResponse
let processId: string

beforeAll(async () => {
	deploy = await zbc.deployProcess(
		'./src/__tests__/testdata/conditional-pathway.bpmn'
	)
	processId = deploy.processes[0].bpmnProcessId
	await cancelProcesses(processId)
})

afterAll(async () => {
	try {
		if (wf?.processInstanceKey) {
			await zbc.cancelProcessInstance(wf.processInstanceKey) // Cleanup any active processes
		}
	} finally {
		await zbc.close() // Make sure to close the connection
		await cancelProcesses(processId)
	}
})

test('Can update process variables with setVariables', async () => {
	jest.setTimeout(30000)

	wf = await zbc
		.createProcessInstance({
			bpmnProcessId: processId,
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
		loglevel: 'INFO',
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
			loglevel: 'INFO',
		})
	})
})
