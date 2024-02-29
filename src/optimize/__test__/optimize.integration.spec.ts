import { promises as fsPromises } from 'fs'

import { OptimizeApiClient } from '../lib/OptimizeApiClient'

xtest('Can get Dashboards', async () => {
	const id = '8a7103a7-c086-48f8-b5b7-a7f83e864688'
	const client = new OptimizeApiClient()
	const res = await client.exportDashboardDefinitions([id])
	await fsPromises.writeFile(
		'exported-dashboard.json',
		JSON.stringify(res, null, 2)
	)
	expect(res).toBeTruthy()
})

test('Can get readiness', async () => {
	const client = new OptimizeApiClient()
	const res = await client.getReadiness()
	expect(res).toBe('')
})
