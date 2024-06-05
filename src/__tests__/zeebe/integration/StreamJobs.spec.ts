import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(25000)

let bpmnProcessId: string
let processDefinitionKey: string

beforeAll(async () => {
	suppressZeebeLogging()
})

afterAll(async () => {
	restoreZeebeLogging()
	await cancelProcesses(processDefinitionKey)
})

test('Can activate jobs using StreamActivatedJobs RPC', async () => {
	const zbc = new ZeebeGrpcClient()
	;({ bpmnProcessId, processDefinitionKey } = (
		await zbc.deployResource({
			processFilename: './src/__tests__/testdata/StreamJobs.bpmn',
		})
	).deployments[0].process)
	await cancelProcesses(processDefinitionKey)

	await new Promise((resolve) => {
		let counter = 0
		zbc.streamJobs({
			type: 'stream-job',
			worker: 'test-worker',
			tenantIds: ['<default>'],
			taskHandler: (job) => {
				counter++
				expect(job.variables.foo).toBe('bar')
				const res = job.complete({})
				if (counter === 3) {
					resolve(null)
				}
				return res
			},
			inputVariableDto: class {
				foo!: string
			},
			fetchVariables: [],
			timeout: 30000,
		})
		zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})
		zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})
		zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})
	})
})
