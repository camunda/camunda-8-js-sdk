import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

jest.setTimeout(30000)

const unauthenticatedRestClient = new CamundaRestClient({
	config: {
		CAMUNDA_AUTH_STRATEGY: 'NONE',
	},
})

xtest('Unauthenticated REST clients cannot get topology', async () => {
	await expect(async () => {
		const topology = await unauthenticatedRestClient.getTopology()
		return topology
	}).rejects.toThrow()
})
xtest('Unauthenticated REST client cannot activate jobs', async () => {
	await expect(async () => {
		const jobs = await unauthenticatedRestClient.activateJobs({
			maxJobsToActivate: 10,
			timeout: 10000,
			type: 'whatever',
			worker: 'unauthenticated-worker',
			requestTimeout: 5000,
		})
		return jobs
	}).rejects.toThrow()
})
xtest('Unauthenticated REST client cannot deploy resources', async () => {
	await expect(async () => {
		const deployment = await unauthenticatedRestClient.deployResourcesFromFiles(
			['./src/__tests__/testdata/rest-message-test.bpmn']
		)
		return deployment
	}).rejects.toThrow()
})
