/**
 * In this scenario, we turn off authentication in the client. Methods are called without an authorization token.
 *
 * We expect this case to fail if the gateway is configured to require authentication.
 */
import { Camunda8 } from '../../../c8/index'

jest.setTimeout(15000)

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: '<default>',
	CAMUNDA_AUTH_STRATEGY: 'NONE',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const camunda = c8.getCamundaRestClient()

describe('Unauthenticated REST client (default tenant)', () => {
	test('cannot activate jobs', async () =>
		await expect(async () =>
			camunda.activateJobs({
				maxJobsToActivate: 10,
				timeout: 30000,
				type: 'anything',
				worker: 'test',
				requestTimeout: 5000,
			})
		).rejects.toThrow())
})
