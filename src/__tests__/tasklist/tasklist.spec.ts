import { EnvironmentSetup } from 'lib'

import { TasklistApiClient } from '../../tasklist/index'

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv())

test('Constructor throws without base url', () => {
	try {
		new TasklistApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
	} catch (e) {
		expect((e as Error).message.includes('Missing')).toBe(true)
	}
})

test('Can get construct a client', () => {
	const client = new TasklistApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_TASKLIST_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})
