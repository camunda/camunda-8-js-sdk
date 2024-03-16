import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe/index'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(20000)

beforeAll(() => suppressZeebeLogging())
afterAll(() => restoreZeebeLogging())

test('deploys a process', async () => {
	const zbc = new ZeebeGrpcClient()
	const result = await zbc.deployProcess(
		'./src/__tests__/testdata/Client-DeployWorkflow.bpmn'
	)
	await zbc.close()
	expect(result.processes[0].bpmnProcessId).toBeTruthy()
})
