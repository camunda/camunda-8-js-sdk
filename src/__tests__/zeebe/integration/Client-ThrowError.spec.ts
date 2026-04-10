import { Duration } from 'typed-duration'

import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 25_000 })

let bpmnProcessId: string
let processDefinitionKey: string

afterAll(async () => {
	await cancelProcesses(processDefinitionKey)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Throws a business error that is caught in the process',
	async () => {
		const zbc = new ZeebeGrpcClient()
		;({ bpmnProcessId, processDefinitionKey } = (
			await zbc.deployResource({
				processFilename: './src/__tests__/testdata/Client-ThrowError.bpmn',
			})
		).deployments[0].process)
		await cancelProcesses(processDefinitionKey)

		zbc.createWorker({
			taskHandler: (job) => {
				return job.error('BUSINESS_ERROR', 'Well, that did not work')
			},
			taskType: 'throw-bpmn-error-task',
			timeout: Duration.seconds.of(30),
		})
		zbc.createWorker({
			taskType: 'sad-flow',
			taskHandler: (job) => {
				return job.complete({
					bpmnErrorCaught: true,
				})
			},
		})
		const result = await zbc.createProcessInstanceWithResult({
			bpmnProcessId,
			requestTimeout: 20000,
			variables: {},
		})
		expect(result.variables.bpmnErrorCaught).toBe(true)
		await zbc.close()
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Can set variables when throwing a BPMN Error',
	async () => {
		const zbc = new ZeebeGrpcClient()
		;({ bpmnProcessId, processDefinitionKey } = (
			await zbc.deployResource({
				processFilename: './src/__tests__/testdata/Client-ThrowError-2.bpmn',
			})
		).deployments[0].process)
		await cancelProcesses(processDefinitionKey)
		// This worker takes the first job and throws a BPMN error, setting a variable
		zbc.createWorker({
			taskHandler: (job) =>
				job.error({
					errorCode: 'BUSINESS_ERROR',
					errorMessage: "Well, that didn't work",
					variables: { something: 'someValue' },
				}),
			taskType: 'throw-bpmn-error-task-2',
		})
		// This worker is on the business error throw path
		zbc.createWorker({
			taskType: 'sad-flow-2',
			taskHandler: (job) =>
				job.complete({
					bpmnErrorCaught: true,
				}),
		})
		const result = await zbc.createProcessInstanceWithResult({
			bpmnProcessId,
			requestTimeout: 20000,
			variables: {},
		})
		expect(result.variables.bpmnErrorCaught).toBe(true)
		// This requires output mapping on the error in the BPMN diagram
		expect(result.variables.something).toBe('someValue')
		await zbc.close()
	}
)
