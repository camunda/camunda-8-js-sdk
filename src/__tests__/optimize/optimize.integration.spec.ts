import { OptimizeApiClient } from '../../optimize/lib/OptimizeApiClient'

/**
 * Automatically spun up environments for testing do not have data in them for read operations from Optimize.
 * So this test 404s as expected.
 * It is testing that we can auth correctly, and access the endpoint.
 */
// Test disabled. See: https://github.com/camunda/camunda-8-js-sdk/issues/253
xtest('Can get Dashboards', async () => {
	const id = '8a7103a7-c086-48f8-b5b7-a7f83e864688'
	const client = new OptimizeApiClient()
	await expect(client.exportDashboardDefinitions([id])).rejects.toThrow('404')
})

test('Can get readiness', async () => {
	const client = new OptimizeApiClient()
	const res = await client.getReadiness()
	expect(res).toBe('')
})
