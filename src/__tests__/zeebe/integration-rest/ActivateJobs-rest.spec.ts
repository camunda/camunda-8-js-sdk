import { ZeebeGrpcClient, ZeebeRestClient } from '../../../zeebe'

jest.setTimeout(30000)
test('can update a task', async () => {
	const grpc = new ZeebeGrpcClient()

	await grpc.deployResource({
		processFilename: './src/__tests__/testdata/rest-job-activation.bpmn',
	})
	await grpc.createProcessInstance({
		bpmnProcessId: 'rest-job-activation',
		variables: {},
	})

	const zbc = new ZeebeRestClient()
	const res = await zbc.activateJobs({
		type: 'rest-job',
		maxJobsToActivate: 100,
		requestTimeout: 10,
		timeout: 10,
		worker: 'rest-worker',
	})
	console.log(res)
	res.jobs.map((job) => {
		grpc.completeJob({
			jobKey: job.key,
			variables: {},
		})
	})
	expect(res.jobs.length > 0).toBe(true)
})
