import { EnvironmentSetup } from 'lib'

import { AdminApiClient } from '../../admin/index'

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv())

test('Censtructor throws without base url', () => {
	try {
		new AdminApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
	} catch (e) {
		expect((e as Error).message.includes('CAMUNDA_CONSOLE_BASE_URL')).toBe(true)
	}
})

test('Can get construct a client', () => {
	const client = new AdminApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_CONSOLE_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})
