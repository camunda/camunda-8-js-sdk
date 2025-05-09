import { ICustomHeaders, IInputVariables, IOutputVariables } from 'zeebe/types'

import { ZBWorker, ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

jest.setTimeout(30000)

const zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse | undefined

let processDefinitionKey1: string
let processDefinitionKey2: string
let processDefinitionKey3: string
let bpmnProcessId1: string
let bpmnProcessId2: string
let bpmnProcessId3: string

beforeAll(async () => {
	const res1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/hello-world.bpmn',
	})
	processDefinitionKey1 = res1.deployments[0].process.processDefinitionKey
	bpmnProcessId1 = res1.deployments[0].process.bpmnProcessId
	await cancelProcesses(processDefinitionKey1)

	const res2 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/hello-world-complete.bpmn',
	})
	processDefinitionKey2 = res2.deployments[0].process.processDefinitionKey
	bpmnProcessId2 = res2.deployments[0].process.bpmnProcessId
	await cancelProcesses(processDefinitionKey2)

	const res3 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/conditional-pathway.bpmn',
	})
	processDefinitionKey3 = res3.deployments[0].process.processDefinitionKey
	bpmnProcessId3 = res3.deployments[0].process.bpmnProcessId
	await cancelProcesses(processDefinitionKey3)
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
})

afterAll(async () => {
	await zbc.close()
	await cancelProcesses(processDefinitionKey1)
	await cancelProcesses(processDefinitionKey2)
	await cancelProcesses(processDefinitionKey3)
})

test('Can service a task', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: bpmnProcessId1,
		variables: {},
	})

	let worker: ZBWorker<IInputVariables, ICustomHeaders, IOutputVariables>
	// Use a promise to wait for the worker task to complete
	await new Promise((resolve, reject) => {
		worker = zbc.createWorker({
			taskType: 'console-log',
			taskHandler: async (job) => {
				try {
					expect(job.processInstanceKey).toBe(wf?.processInstanceKey)
					const res = await job.complete()
					resolve(null) // Resolve the promise when the job is successfully completed
					return res
				} catch (error) {
					reject(error) // Reject the promise if there's an error
					return job.complete().catch((e) => e)
				}
			},
			loglevel: 'NONE',
		})
	}).finally(() => worker.close())
})
test('Can service a task with complete.success', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: bpmnProcessId2,
		variables: {},
	})
	let worker: ZBWorker<IInputVariables, ICustomHeaders, IOutputVariables>
	await new Promise((resolve) => {
		worker = zbc.createWorker({
			taskType: 'console-log-complete',
			taskHandler: async (job) => {
				expect(job.processInstanceKey).toBe(wf?.processInstanceKey)
				const res1 = await job.complete(job.variables)
				resolve(undefined)
				return res1
			},
			loglevel: 'NONE',
		})
	}).finally(() => worker.close())
})

test('Can update process variables with complete.success()', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: bpmnProcessId3,
		variables: {
			conditionVariable: true,
		},
	})
	const wfi = wf?.processInstanceKey
	expect(wfi).toBeTruthy()

	const worker1 = zbc.createWorker({
		taskType: 'wait',
		taskHandler: async (job) => {
			expect(job.processInstanceKey).toBe(wfi)
			return job.complete({
				conditionVariable: false,
			})
		},
		loglevel: 'NONE',
	})

	let worker2: ZBWorker<IInputVariables, ICustomHeaders, IOutputVariables>
	await new Promise((resolve) => {
		worker2 = zbc.createWorker({
			taskType: 'pathB',
			taskHandler: async (job) => {
				expect(job.processInstanceKey).toBe(wfi)
				expect(job.variables.conditionVariable).toBe(false)
				const res1 = await job.complete(job.variables)
				wf = undefined
				resolve(null)
				return res1
			},
			loglevel: 'NONE',
		})
	}).finally(() => {
		worker1.close()
		worker2.close()
	})
})
