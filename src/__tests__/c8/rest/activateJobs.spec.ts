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
	res = await grpcClient.deployResource({
		processFilename: './src/__tests__/testdata/hello-world-complete.bpmn',
	})
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
			variables: {},
		})
		.then((r) => {
			console.log(r)
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
					console.log(jobs)
					const res = jobs.map((job) => job.complete())
					console.log(res)
					Promise.all(res).then(() => done())
				})
		})
})
