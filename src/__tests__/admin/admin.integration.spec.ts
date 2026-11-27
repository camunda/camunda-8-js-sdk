import { randomUUID } from 'node:crypto'

import { AdminApiClient } from '../../admin/index'
import { matrix } from '../../test-support/testTags'

vi.setConfig({ testTimeout: 10_000 })

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('getParameters', async () => {
	const c = new AdminApiClient()
	const res = await c.getParameters()
	expect(res).toBeTruthy()
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('getClusters', async () => {
	const c = new AdminApiClient()
	const res = await c.getClusters()
	expect(res).toBeTruthy()
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('createClient', async () => {
	const c = new AdminApiClient()
	const clusters = await c.getClusters()
	const clusterUuid = clusters[0].uuid
	const clientName = `test_generated-delete-me-${randomUUID()}`
	c.getClient(clusterUuid, clientName)
		.then((res) => c.deleteClient(clusterUuid, res.ZEEBE_CLIENT_ID))
		.catch((e) => e)

	const res = await c.createClient({
		clusterUuid,
		clientName,
		permissions: ['Zeebe'],
	})
	const client = await c.getClient(clusterUuid, res.clientId)
	expect(client.ZEEBE_ADDRESS).toBeTruthy()
	await c.deleteClient(clusterUuid, res.clientId)
	expect(c).toBeTruthy()
})
