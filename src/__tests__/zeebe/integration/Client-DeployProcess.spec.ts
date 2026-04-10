import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe/index'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 20_000 })

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'deploys a process',
	async () => {
		const zbc = new ZeebeGrpcClient()
		const result = await zbc.deployResource({
			processFilename: './src/__tests__/testdata/Client-DeployWorkflow.bpmn',
		})
		await zbc.close()
		expect(result.deployments[0].process.bpmnProcessId).toBeTruthy()
	}
)
