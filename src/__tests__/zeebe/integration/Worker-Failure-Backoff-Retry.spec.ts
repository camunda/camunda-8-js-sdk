import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(60000)

suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse | undefined
let processId: string

beforeAll(async () => {
	const res = await zbc.deployProcess(
		'./src/__tests__/testdata/Worker-Failure1.bpmn'
	)
	processId = res.processes[0].bpmnProcessId
	await cancelProcesses(processId)
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
})

afterAll(async () => {
	await zbc.close()
	restoreZeebeLogging()
	await cancelProcesses(processId)
})

test('Can specify a retryBackoff with complete.failure()', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId: processId,
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

	let then = new Date()
	await new Promise((resolve) => {
		const w = zbc.createWorker({
			taskType: 'wait-worker-failure',
			taskHandler: async (job) => {
				// Succeed on the third attempt
				if (job.retries === 1) {
					const now = new Date()
					const res1 = await job.complete()
					expect(job.processInstanceKey).toBe(wfi)
					expect(now.getTime() - then.getTime()).toBeGreaterThan(1800)
					wf = undefined

					zbc.cancelProcessInstance(wfi)
					resolve(null)
					await w.close()
					return res1
				}
				then = new Date()
				// Fail on the first attempt, with a 2s backoff
				return job.fail({
					errorMessage: 'Triggering a retry with a two second back-off',
					retryBackOff: 2000,
					retries: 1,
				})
			},
			loglevel: 'NONE',
		})
	})
})
