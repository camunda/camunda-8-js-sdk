import { C8RestClient } from '../../../c8/lib/C8RestClient'
import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { DeployResourceResponse, ProcessDeployment } from '../../../zeebe/types'

suppressZeebeLogging()
let res: DeployResourceResponse<ProcessDeployment>
let bpmnProcessId: string
const grpcClient = new ZeebeGrpcClient({
	config: {
		CAMUNDA_TENANT_ID: '<default>',
	},
})
const restClient = new C8RestClient()

beforeAll(async () => {
	res = (await restClient.deployResourcesFromFiles([
		'./src/__tests__/testdata/hello-world-complete.bpmn',
	])) as unknown as DeployResourceResponse<ProcessDeployment>
	// res = await grpcClient.deployResource({
	// 	processFilename: './src/__tests__/testdata/hello-world-complete.bpmn',
	// })
	console.log(res)
	bpmnProcessId = res.deployments[0].process.bpmnProcessId
})

afterAll(async () => {
	restoreZeebeLogging()
	await grpcClient.close()
})

test('Can service a task', (done) => {
	grpcClient
		.createProcessInstance({
			bpmnProcessId,
			variables: {
				someNumberField: 8,
			},
		})
		.then(() => {
			restClient
				.activateJobs({
					maxJobsToActivate: 2,
					requestTimeout: 5000,
					timeout: 5000,
					type: 'console-log-complete',
					worker: 'test',
				})
				.then((jobs) => {
					expect(jobs.length).toBe(1)

					jobs[0].complete().then(() => done())
				})
		})
})
