/**
 * In this scenario, we authenticate the REST client with a valid id and secret to get a bearer token.
 *
 * We expect this case to succeed.
 */
import { Camunda8 } from '../../../c8/index'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: '<default>',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const restClientAuthed = c8.getCamundaRestClient()

describe('Authenticated REST client (default tenant)', () => {
	test.runIf(
		matrix({
			include: {
				versions: ['8.8', '8.7'],
				deployments: ['saas', 'self-managed'],
				tenancy: ['multi-tenant', 'single-tenant'],
				security: ['secured'],
			},
		})
	)('can get topology', async () => {
		const res = await restClientAuthed.getTopology()
		expect(res).toHaveProperty('gatewayVersion')
	})
})
