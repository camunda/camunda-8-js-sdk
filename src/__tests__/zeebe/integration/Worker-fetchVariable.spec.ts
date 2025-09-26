import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 30_000 })

let zbc: ZeebeGrpcClient
let wf: CreateProcessInstanceResponse | undefined
let processDefinitionKey: string
let bpmnProcessId: string

beforeAll(async () => {
	zbc = new ZeebeGrpcClient()
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/hello-world.bpmn',
	})
	;({ processDefinitionKey, bpmnProcessId } = res.deployments[0].process)
	await cancelProcesses(processDefinitionKey)
})

afterEach(async () => {
	if (wf?.processInstanceKey) {
		await zbc.cancelProcessInstance(wf.processInstanceKey).catch((e) => e)
	}
})

afterAll(async () => {
	await cancelProcesses(processDefinitionKey)
	await zbc.close()
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Can retrieve only specified variables using fetchVariable',
	() =>
		new Promise<void>((done) => {
			zbc
				.createProcessInstance({
					bpmnProcessId,
					variables: {
						var1: 'foo',
						var2: 'bar',
					},
				})
				.then((res) => {
					wf = res
					zbc.createWorker({
						fetchVariable: ['var2'],
						taskType: 'console-log',
						taskHandler: async (job) => {
							expect(job.processInstanceKey).toBe(wf?.processInstanceKey)
							expect(job.variables.var2).toEqual('bar')
							expect(Object.keys(job.variables).indexOf('var1')).toEqual(-1)
							const res1 = await job.complete(job.variables)
							done()
							return res1
						},
						loglevel: 'NONE',
					})
				})
		})
)
