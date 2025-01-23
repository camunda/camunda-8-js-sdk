import { EnvironmentSetup } from '../../lib'
import { ModelerApiClient } from '../../modeler/index'

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv())

test('Constructor does not throws without base url', () => {
	const thrown = false
	try {
		const m = new ModelerApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
		expect(m).toBeTruthy()
	} catch (e) {
		expect((e as Error).message.includes('Missing')).toBe(true)
	}
	expect(thrown).toBe(false)
})

test('Can get construct a client', () => {
	const client = new ModelerApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})
