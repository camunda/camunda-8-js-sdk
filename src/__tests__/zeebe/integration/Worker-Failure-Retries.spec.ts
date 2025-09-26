import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 60_000 })

let zbc: ZeebeGrpcClient
let wf: CreateProcessInstanceResponse | undefined

beforeEach(() => {
	zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
	await zbc.close() // Makes sure we don't forget to close connection
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Decrements the retries count by default',
	async () => {
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
				loglevel: 'NONE',
				taskType: 'service-task-worker-failure-retries',
				taskHandler: (job) => {
					if (!called) {
						expect(job.retries).toBe(100)
						called = true
						return job.fail('Some reason')
					}
					expect(job.retries).toBe(99)
					return job.complete().then(async (res) => {
						await worker.close()
						resolve(null)
						return res
					})
				},
			})
		})
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Set the retries to a specific number when provided with one via simple signature',
	async () => {
		const { processDefinitionKey, bpmnProcessId } = (
			await zbc.deployResource({
				processFilename: './src/__tests__/testdata/Worker-Failure-Retries.bpmn',
			})
		).deployments[0].process

		await cancelProcesses(processDefinitionKey)

		wf = await zbc.createProcessInstance({
			bpmnProcessId,
			variables: {
				conditionVariable: true,
			},
		})
		let called = false

		await new Promise((resolve) => {
			const worker = zbc.createWorker({
				loglevel: 'NONE',
				taskType: 'service-task-worker-failure-retries',
				taskHandler: (job) => {
					if (!called) {
						expect(job.retries).toBe(100)
						called = true
						return job.fail('Some reason', 101)
					}
					expect(job.retries).toBe(101)

					return job.complete().then(async (res) => {
						resolve(null)
						await worker.close()
						return res
					})
				},
			})
		})
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Set the retries to a specific number when provided with one via object signature',
	async () => {
		const { processDefinitionKey, bpmnProcessId } = (
			await zbc.deployResource({
				processFilename: './src/__tests__/testdata/Worker-Failure-Retries.bpmn',
			})
		).deployments[0].process
		await cancelProcesses(processDefinitionKey)
		wf = await zbc.createProcessInstance({
			bpmnProcessId,
			variables: {
				conditionVariable: true,
			},
		})
		let called = false

		await new Promise((resolve) => {
			const worker = zbc.createWorker({
				loglevel: 'NONE',
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

					return job.complete().then(async (res) => {
						await worker.close()
						resolve(null)
						return res
					})
				},
			})
		})
	}
)
