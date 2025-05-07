import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { Camunda8ClientConfiguration } from '../../../lib/Configuration'
import { IOAuthProvider } from '../../../oauth'

class TestCamundaRestClient extends CamundaRestClient {
	constructor(options?: {
		config?: Camunda8ClientConfiguration
		oAuthProvider?: IOAuthProvider
	}) {
		super(options)
	}
	getBearerToken() {
		return this.oAuthProvider.getToken('ZEEBE')
	}
}

test('it can refresh the bearer token', async () => {
	const client = new TestCamundaRestClient({
		config: {
			CAMUNDA_AUTH_STRATEGY: 'BEARER',
			CAMUNDA_OAUTH_TOKEN: 'initialToken',
		},
	})
	const initialToken = await client.getBearerToken()
	expect(initialToken.authorization).toEqual('Bearer initialToken')
	client.setBearerToken('newToken')
	const newToken = await client.getBearerToken()
	expect(newToken.authorization).toEqual('Bearer newToken')
})
