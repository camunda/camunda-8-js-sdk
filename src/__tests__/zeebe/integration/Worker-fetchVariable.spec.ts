import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(30000)
suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse | undefined
let processId: string

beforeAll(async () => {
	const res = await zbc.deployProcess(
		'./src/__tests__/testdata/hello-world.bpmn'
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
	await cancelProcesses(processId)
	await zbc.close()
	restoreZeebeLogging()
})

test('Can retrieve only specified variables using fetchVariable', (done) => {
	zbc
		.createProcessInstance({
			bpmnProcessId: processId,
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
					done(null)
					return res1
				},
				loglevel: 'NONE',
			})
		})
})
