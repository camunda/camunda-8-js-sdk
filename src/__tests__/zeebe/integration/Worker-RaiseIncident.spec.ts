import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

/**
 * Note: This test needs to be modified to leave its process instance active so the incident can be manually verified
 */
vi.setConfig({ testTimeout: 30_000 })

let processInstanceKey: string

let zbc: ZeebeGrpcClient
let bpmnProcessId: string
let processDefinitionKey: string

beforeAll(async () => {
	zbc = new ZeebeGrpcClient()
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Worker-RaiseIncident.bpmn',
	})
	;({ bpmnProcessId, processDefinitionKey } = res.deployments[0].process)
	await cancelProcesses(processDefinitionKey)
})

afterAll(async () => {
	if (processInstanceKey) {
		// Normally already cancelled by the test; NOT_FOUND is expected then.
		await zbc.cancelProcessInstance(processInstanceKey).catch(() => {})
	}
	await zbc.close()
	await cancelProcesses(processDefinitionKey)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Can raise an Operate incident with complete.failure()',
	async () => {
		const wf = await zbc.createProcessInstance({
			bpmnProcessId,
			variables: {
				conditionVariable: true,
			},
		})
		processInstanceKey = wf.processInstanceKey
		expect(processInstanceKey).toBeTruthy()

		await zbc.setVariables({
			elementInstanceKey: processInstanceKey,
			local: false,
			variables: {
				conditionVariable: false,
			},
		})

		// Assertions and errors inside a task handler are thrown on the worker,
		// not in this test, so on their own they only show up as an anonymous
		// timeout. Route every failure into `outcome` so the test fails at once
		// with the real reason.
		let fail: (reason: unknown) => void = () => {}
		const outcome = new Promise<void>((resolve, reject) => {
			fail = reject
			zbc.createWorker({
				taskType: 'pathB-raise-incident',
				taskHandler: async (job) => {
					try {
						expect(job.processInstanceKey).toBe(processInstanceKey)
						expect(job.variables.conditionVariable).toBe(false)
						const res1 = await job.fail('Raise an incident in Operate', 0)
						/* @TODO: delay, then check for incident in Operate via the API */
						await job.cancelWorkflow()
						// comment out the preceding line for the verification test
						resolve()
						return res1
					} catch (e) {
						reject(e)
						throw e
					}
				},
				maxJobsToActivate: 1,
				loglevel: 'NONE',
			})
		})

		zbc.createWorker({
			taskType: 'wait-raise-incident',
			taskHandler: async (job) => {
				try {
					expect(job.processInstanceKey).toBe(processInstanceKey)
					return await job.complete(job.variables)
				} catch (e) {
					fail(e)
					throw e
				}
			},
			loglevel: 'NONE',
		})

		await outcome
	}
)
