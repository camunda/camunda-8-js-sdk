import { ZeebeGrpcClient } from '../../../zeebe/index'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(20000)

test('deploys a process', async () => {
	const zbc = new ZeebeGrpcClient()
	const result = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Client-DeployWorkflow.bpmn',
	})
	await zbc.close()
	expect(result.deployments[0].process.bpmnProcessId).toBeTruthy()
})
