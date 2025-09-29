import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import {
	CreateProcessInstanceResponse,
	DeployResourceResponse,
	ProcessDeployment,
} from '../../../zeebe/lib/interfaces-grpc-1.0'

vi.setConfig({ testTimeout: 60_000 })

let zbc: ZeebeGrpcClient
let wf: CreateProcessInstanceResponse | undefined

let wf1: DeployResourceResponse<ProcessDeployment>
let wf2: DeployResourceResponse<ProcessDeployment>
let wf3: DeployResourceResponse<ProcessDeployment>
let processDefinitionKey1: string
let processDefinitionKey2: string
let processDefinitionKey3: string
let bpmnProcessId1: string
let bpmnProcessId2: string
let bpmnProcessId3: string

beforeAll(async () => {
	zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })

	wf1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure1.bpmn',
	})
	;({
		processDefinitionKey: processDefinitionKey1,
		bpmnProcessId: bpmnProcessId1,
	} = wf1.deployments[0].process)
	bpmnProcessId1 = wf1.deployments[0].process.bpmnProcessId
	wf2 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure2.bpmn',
	})
	;({
		processDefinitionKey: processDefinitionKey2,
		bpmnProcessId: bpmnProcessId2,
	} = wf2.deployments[0].process)
	wf3 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-Failure3.bpmn',
	})
	;({
		processDefinitionKey: processDefinitionKey3,
		bpmnProcessId: bpmnProcessId3,
	} = wf3.deployments[0].process)
	await cancelProcesses(processDefinitionKey1)
	await cancelProcesses(processDefinitionKey2)
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

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Causes a retry with complete.failure()',
	async () => {
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
				loglevel: 'NONE',
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
			})
		)
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Does not fail a process when the handler throws, by default',
	async () => {
		wf = await zbc.createProcessInstance({
			bpmnProcessId: bpmnProcessId2,
			variables: {},
		})

		let alreadyFailed = false

		await new Promise((resolve) => {
			// Faulty worker - throws an unhandled exception in task handler
			const w = zbc.createWorker({
				loglevel: 'NONE',
				taskType: 'console-log-worker-failure-2',
				taskHandler: async (job) => {
					if (alreadyFailed) {
						// The job was failed and reactivated, so we can cancel the process instance
						await zbc.cancelProcessInstance(wf!.processInstanceKey) // throws if process instance is not found. Should NOT throw in this test
						resolve(null)
						w.close()
						return job.forward()
					}
					alreadyFailed = true
					throw new Error(
						'Unhandled exception in task handler for testing purposes'
					) // Will be caught in the library, and should fail the job, allowing it to be reactivated by this worker
				},
				pollInterval: 10000,
			})
		})
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Fails a process when the handler throws and options.failProcessOnException is set',
	async () => {
		wf = await zbc.createProcessInstance({
			bpmnProcessId: bpmnProcessId3,
			variables: {},
		})

		let alreadyFailed = false

		await new Promise((resolve) => {
			// Faulty worker
			const w = zbc.createWorker({
				loglevel: 'NONE',
				taskType: 'console-log-worker-failure-3',
				taskHandler: (job) => {
					if (alreadyFailed) {
						// It polls multiple times a second, and we need it to only throw once
						return job.forward()
					}
					alreadyFailed = true
					testProcessInstanceExists() // waits 1000ms then checks
					throw new Error(
						'Unhandled exception in task handler for test purposes'
					) // Will be caught in the library
				},
				failProcessOnException: true,
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
	}
)
