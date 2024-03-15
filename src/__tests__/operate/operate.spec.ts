import { EnvironmentSetup } from 'lib'

import { OperateApiClient } from '../../operate'

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv())

test('Censtructor throws without base url', () => {
	try {
		new OperateApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
	} catch (e) {
		expect((e as Error).message.includes('Missing')).toBe(true)
	}
})

test('Can get construct a client', () => {
	const client = new OperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})
