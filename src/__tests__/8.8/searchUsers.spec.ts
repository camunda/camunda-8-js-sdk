// import { randomUUID } from 'crypto'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()

jest.setTimeout(10000)
test('It can search users', async () => {
	// const uuid = randomUUID()
	await c8
		.createUser({
			email: `jdoe@gmail.com`,
			name: 'John Doe',
			username: 'jdoe',
			password: 'password123',
		})
		.catch((e) => e) // throws 409 if user already exists
	await new Promise((r) => setTimeout(r, 5000))

	const users = await c8.searchUsers({
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
	})
	expect(users.items[0].email).toBe('jdoe@gmail.com')
})
