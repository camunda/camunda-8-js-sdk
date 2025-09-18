// import { randomUUID } from 'crypto'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'

const c8 = new CamundaRestClient()

jest.setTimeout(10000)
//     HTTPError: Response code 403 (Forbidden) (POST ***/v2/users/search).
// {"type":"about:blank","title":"Access issue","status":403,"detail":"/98a9c2da-a2dd-4c5a-aa9e-977f974daed5/v2/users/search endpoint is not accessible: Users API is disabled because the application is configured in OIDC mode.",
// "instance":"/98a9c2da-a2dd-4c5a-aa9e-977f974daed5/v2/users/search"}. Enhanced stack trace available as error.source.

xtest('It can search users', async () => {
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
