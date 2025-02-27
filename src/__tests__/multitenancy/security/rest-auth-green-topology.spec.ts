/**
 * In this scenario, we authenticate the REST client with a valid id and secret to get a bearer token.
 *
 * We expect this case to succeed.
 */
import { Camunda8 } from '../../../c8/index'

jest.setTimeout(15000)

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: 'green',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const restClientAuthed = c8.getCamundaRestClient()

describe('Authenticated REST client (green tenant)', () => {
	test('can get topology', async () => {
		const res = await restClientAuthed.getTopology()
		expect(res).toHaveProperty('gatewayVersion')
	})
})
