import { EnvironmentSetup } from '../../lib'
import { OptimizeApiClient } from '../../optimize/lib/OptimizeApiClient'

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv())

test('Censtructor throws without base url', () => {
	try {
		new OptimizeApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
	} catch (e) {
		expect((e as Error).message.includes('Missing')).toBe(true)
	}
})

test('Can get construct a client', () => {
	const client = new OptimizeApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPTIMIZE_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})
