import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

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
	try {
		if (wf?.processInstanceKey) {
			await zbc.cancelProcessInstance(wf.processInstanceKey)
		}
	} catch (e: unknown) {
		// console.log('Caught NOT FOUND') // @DEBUG
	} finally {
		await zbc.close() // Makes sure we don't forget to close connection
	}
})

test('Decrements the retries count by default', async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure-Retries.bpmn',
	})
	await cancelProcesses(res.deployments[0].process.processDefinitionKey)
	wf = await zbc.createProcessInstance({
		bpmnProcessId: 'worker-failure-retries',
		variables: {
			conditionVariable: true,
		},
	})
	let called = false

	await new Promise((resolve) => {
		const worker = zbc.createWorker({
			taskType: 'service-task-worker-failure-retries',
			taskHandler: (job) => {
				if (!called) {
					expect(job.retries).toBe(100)
					called = true
					return job.fail('Some reason')
				}
				expect(job.retries).toBe(99)
				resolve(null)
				return job.complete().then(async (res) => {
					await worker.close()
					return res
				})
			},
		})
	})
})

test('Set the retries to a specific number when provided with one via simple signature', async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure-Retries.bpmn',
	})
	cancelProcesses(res.deployments[0].process.processDefinitionKey)
	wf = await zbc.createProcessInstance({
		bpmnProcessId: 'worker-failure-retries',
		variables: {
			conditionVariable: true,
		},
	})
	let called = false

	await new Promise((resolve) => {
		const worker = zbc.createWorker({
			taskType: 'service-task-worker-failure-retries',
			taskHandler: (job) => {
				if (!called) {
					expect(job.retries).toBe(100)
					called = true
					return job.fail('Some reason', 101)
				}
				expect(job.retries).toBe(101)
				resolve(null)
				return job.complete().then(async (res) => {
					await worker.close()
					return res
				})
			},
		})
	})
})

test('Set the retries to a specific number when provided with one via object signature', async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure-Retries.bpmn',
	})
	await cancelProcesses(res.deployments[0].process.processDefinitionKey)
	wf = await zbc.createProcessInstance({
		bpmnProcessId: 'worker-failure-retries',
		variables: {
			conditionVariable: true,
		},
	})
	let called = false

	await new Promise((resolve) => {
		const worker = zbc.createWorker({
			taskType: 'service-task-worker-failure-retries',
			taskHandler: (job) => {
				if (!called) {
					expect(job.retries).toBe(100)
					called = true
					return job.fail({
						errorMessage: 'Some reason',
						retries: 101,
					})
				}
				expect(job.retries).toBe(101)
				resolve(null)
				return job.complete().then(async (res) => {
					await worker.close()
					return res
				})
			},
		})
	})
})
