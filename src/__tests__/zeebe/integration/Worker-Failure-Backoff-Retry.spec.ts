import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 60_000 })

let zbc: ZeebeGrpcClient
let wf: CreateProcessInstanceResponse | undefined
let processDefinitionKey: string
let processId: string

beforeAll(async () => {
	zbc = new ZeebeGrpcClient()

	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure-Backoff.bpmn',
	})
	processDefinitionKey = res.deployments[0].process.processDefinitionKey
	processId = res.deployments[0].process.bpmnProcessId
	await cancelProcesses(processDefinitionKey)
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
})

afterAll(async () => {
	await zbc.close()
	await cancelProcesses(processDefinitionKey)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Can specify a retryBackoff with job.fail()',
	async () => {
		wf = await zbc.createProcessInstance({
			bpmnProcessId: processId,
			variables: {
				conditionVariable: true,
			},
		})
		const { processInstanceKey } = wf
		expect(processInstanceKey).toBeTruthy()

		await zbc.setVariables({
			elementInstanceKey: processInstanceKey,
			local: false,
			variables: {
				conditionVariable: false,
			},
		})

		let then = new Date()
		await new Promise((resolve) => {
			const w = zbc.createWorker({
				taskType: 'wait-worker-failure-backoff',
				taskHandler: async (job) => {
					// Succeed on the successive attempt
					if (job.retries === 1) {
						const now = new Date()
						const res1 = await job.complete()
						expect(job.processInstanceKey).toBe(processInstanceKey)
						const elapsedTime = now.getTime() - then.getTime()
						expect(elapsedTime).toBeGreaterThan(1800) // 1.8
						wf = undefined
						zbc.cancelProcessInstance(processInstanceKey)
						resolve(null)
						await w.close()
						await zbc.close()
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
	}
)
