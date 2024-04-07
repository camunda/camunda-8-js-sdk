import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

jest.setTimeout(30000)
suppressZeebeLogging()

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
	;({
		processDefinitionKey: processDefinitionKey1,
		bpmnProcessId: bpmnProcessId1,
	} = res1.deployments[0].process)
	await cancelProcesses(processDefinitionKey1)
	const res2 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/hello-world-complete.bpmn',
	})
	;({
		processDefinitionKey: processDefinitionKey2,
		bpmnProcessId: bpmnProcessId2,
	} = res2.deployments[0].process)
	await cancelProcesses(processDefinitionKey2)
	const res3 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/conditional-pathway.bpmn',
	})
	;({
		processDefinitionKey: processDefinitionKey3,
		bpmnProcessId: bpmnProcessId3,
	} = res3.deployments[0].process)
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
	restoreZeebeLogging()
})

test('Can service a task', (done) => {
	zbc
		.createProcessInstance({
			bpmnProcessId: bpmnProcessId1,
			variables: {},
		})
		.then((res) => {
			wf = res
			zbc.createWorker({
				taskType: 'console-log',
				taskHandler: async (job) => {
					expect(job.processInstanceKey).toBe(wf?.processInstanceKey)
					const res1 = await job.complete(job.variables)
					done(null)
					return res1
				},
				loglevel: 'NONE',
			})
		})
})

test('Can service a task with complete.success', (done) => {
	zbc
		.createProcessInstance({
			bpmnProcessId: bpmnProcessId2,
			variables: {},
		})
		.then((res) => {
			wf = res
			zbc.createWorker({
				taskType: 'console-log-complete',
				taskHandler: async (job) => {
					expect(job.processInstanceKey).toBe(wf?.processInstanceKey)
					const res1 = await job.complete(job.variables)
					done(null)
					return res1
				},
				loglevel: 'NONE',
			})
		})
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
	zbc.createWorker({
		taskType: 'wait',
		taskHandler: async (job) => {
			expect(job.processInstanceKey).toBe(wfi)
			return job.complete({
				conditionVariable: false,
			})
		},
		loglevel: 'NONE',
	})

	await new Promise((resolve) =>
		zbc.createWorker({
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
	)
})
