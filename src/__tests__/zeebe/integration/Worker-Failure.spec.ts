import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import {
	CreateProcessInstanceResponse,
	DeployResourceResponse,
	ProcessDeployment,
} from '../../../zeebe/lib/interfaces-grpc-1.0'

jest.setTimeout(60000)

suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse | undefined

let wf1: DeployResourceResponse<ProcessDeployment>
let wf2: DeployResourceResponse<ProcessDeployment>
let wf3: DeployResourceResponse<ProcessDeployment>
let bpmnProcessId1: string
let bpmnProcessId2: string
let bpmnProcessId3: string

beforeAll(async () => {
	wf1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure1.bpmn',
	})
	bpmnProcessId1 = wf1.deployments[0].process.bpmnProcessId
	wf2 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure2.bpmn',
	})
	bpmnProcessId2 = wf2.deployments[0].process.bpmnProcessId
	wf3 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure3.bpmn',
	})
	bpmnProcessId3 = wf3.deployments[0].process.bpmnProcessId
	await cancelProcesses(bpmnProcessId1)
	await cancelProcesses(bpmnProcessId2)
	await cancelProcesses(bpmnProcessId3)
})

afterEach(async () => {
	try {
		if (wf?.processInstanceKey) {
			await zbc.cancelProcessInstance(wf.processInstanceKey)
		}
	} catch (e: unknown) {
		// console.log('Caught NOT FOUND') // @DEBUG
	}
})

afterAll(async () => {
	await zbc.close()
	restoreZeebeLogging()
	await cancelProcesses(bpmnProcessId1)
	await cancelProcesses(bpmnProcessId2)
	await cancelProcesses(bpmnProcessId3)
})

test('Causes a retry with complete.failure()', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: bpmnProcessId1,
		variables: {
			conditionVariable: true,
		},
	})
	const wfi = wf.processInstanceKey
	expect(wfi).toBeTruthy()

	await zbc.setVariables({
		elementInstanceKey: wfi,
		local: false,
		variables: {
			conditionVariable: false,
		},
	})

	await new Promise((resolve) =>
		zbc.createWorker({
			taskType: 'wait-worker-failure',
			taskHandler: async (job) => {
				// Succeed on the third attempt
				if (job.retries === 1) {
					const res1 = await job.complete()
					expect(job.processInstanceKey).toBe(wfi)
					expect(job.retries).toBe(1)
					wf = undefined

					resolve(null)
					return res1
				}
				return job.fail('Triggering a retry')
			},
			loglevel: 'NONE',
		})
	)
})

test('Does not fail a process when the handler throws, by default', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: bpmnProcessId2,
		variables: {},
	})

	let alreadyFailed = false

	await new Promise((resolve) => {
		// Faulty worker - throws an unhandled exception in task handler
		const w = zbc.createWorker({
			taskType: 'console-log-worker-failure-2',
			taskHandler: async (job) => {
				if (alreadyFailed) {
					await zbc.cancelProcessInstance(wf!.processInstanceKey) // throws if not found. Should NOT throw in this test
					job.complete()
					return w.close().then(() => resolve(null))
				}
				alreadyFailed = true
				throw new Error(
					'Unhandled exception in task handler for testing purposes'
				) // Will be caught in the library
			},

			loglevel: 'NONE',
			pollInterval: 10000,
		})
	})
})

test('Fails a process when the handler throws and options.failProcessOnException is set', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: bpmnProcessId3,
		variables: {},
	})

	let alreadyFailed = false

	await new Promise((resolve) => {
		// Faulty worker
		const w = zbc.createWorker({
			taskType: 'console-log-worker-failure-3',
			taskHandler: (job) => {
				if (alreadyFailed) {
					// It polls multiple times a second, and we need it to only throw once
					return job.forward()
				}
				alreadyFailed = true
				testProcessInstanceExists() // waits 1000ms then checks
				throw new Error('Unhandled exception in task handler for test purposes') // Will be caught in the library
			},
			failProcessOnException: true,
			loglevel: 'NONE',
		})

		function testProcessInstanceExists() {
			setTimeout(async () => {
				try {
					await zbc.cancelProcessInstance(wf!.processInstanceKey) // throws if not found. SHOULD throw in this test
				} catch (e: unknown) {
					w.close().then(() => resolve(null))
				}
			}, 1500)
		}
	})
})
