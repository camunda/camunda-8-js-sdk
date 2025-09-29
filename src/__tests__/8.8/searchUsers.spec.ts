// import { randomUUID } from 'crypto'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()

vi.setConfig({ testTimeout: 10_000 })

// This test requires a specific setup related to OIDC
// Effectively turning it off for now — saas + multi-tenant is not a thing yet.
test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['saas'],
			tenancy: ['multi-tenant'],
			security: ['secured'],
		},
	})
)('It can search users', async () => {
	// const uuid = randomUUID()
	await c8
		.createUser({
			email: `jdoe@gmail.com`,
			name: 'John Doe',
			username: 'jdoe',
			password: 'password123',
		})
		.catch((e) => e) // throws 409 if user already exists

	const users = await PollingOperation({
		operation: () =>
			c8.searchUsers({
				page: {
					from: 0,
					limit: 10,
				},
				filter: {
					username: 'jdoe',
				},
				sort: [
					{
						field: 'name',
					},
				],
			}),
		interval: 500,
		timeout: 5000,
	})
	expect(users.items[0].email).toBe('jdoe@gmail.com')
})
