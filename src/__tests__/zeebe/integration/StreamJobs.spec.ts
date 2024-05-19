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
	// eslint-disable-next-line no-async-promise-executor
	await new Promise(async (resolve) => {
		const zbc = new ZeebeGrpcClient()
		;({ bpmnProcessId, processDefinitionKey } = (
			await zbc.deployResource({
				processFilename: './src/__tests__/testdata/StreamJobs.bpmn',
			})
		).deployments[0].process)
		await cancelProcesses(processDefinitionKey)
		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})
		zbc.streamJobs({
			type: 'stream-job',
			worker: 'test-worker',
			taskHandler: async (job) => {
				expect(job.variables.foo).toBe('bar')
				const res = job.complete({})
				zbc.close().then(() => resolve(res))
				return res
			},
			inputVariableDto: class {
				foo!: string
			},
			fetchVariables: [],
			timeout: 30000,
		})
	})
})
