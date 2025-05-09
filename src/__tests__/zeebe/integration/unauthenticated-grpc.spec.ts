import { ZeebeGrpcClient } from '../../../zeebe'

jest.setTimeout(30000)

afterAll(() => {
	unauthenticatedGrpcClient.close()
})

const unauthenticatedGrpcClient = new ZeebeGrpcClient({
	config: {
		CAMUNDA_AUTH_STRATEGY: 'NONE',
	},
})
test('Unauthenticated gRPC client cannot get Topology', async () => {
	await expect(async () => {
		const topologyGrpc = await unauthenticatedGrpcClient.topology()
		return topologyGrpc
	}).rejects.toThrow()
})
test('Unauthenticated gRPC client cannot activate jobs', async () => {
	await expect(async () => {
		const jobs = await unauthenticatedGrpcClient.activateJobs({
			maxJobsToActivate: 10,
			timeout: 10000,
			type: 'whatever',
			worker: 'unauthenticated-worker',
			requestTimeout: 5000,
		})
		return jobs
	}).rejects.toThrow()
})
test('Unauthenticated gRPC client cannot deploy resources', async () => {
	await expect(async () => {
		const deployment = await unauthenticatedGrpcClient.deployResources([
			{ processFilename: './src/__tests__/testdata/rest-message-test.bpmn' },
		])
		return deployment
	}).rejects.toThrow()
})
