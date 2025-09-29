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
	'Can activate jobs using StreamActivatedJobs RPC',
	async () => {
		const zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })
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
						zbc.close()
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
			// Wait two seconds to ensure the stream is active
			new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
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
	}
)
