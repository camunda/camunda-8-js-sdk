/**
 * In this scenario, we pass invalid credentials to the token endpoint.
 *
 * We expect this case to fail, and it will fail at the point of attempting to get a token, so the actual method endpoint is never addressed.
 */
import path from 'node:path'

import { Camunda8 } from '../../../c8/index'
import { NullLogger } from '../../../c8/lib/C8Logger'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: '<default>',
	ZEEBE_CLIENT_ID: 'invalid',
	ZEEBE_CLIENT_SECRET: 'invalid',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
	logger: NullLogger,
})

const restClientInvalidCreds = c8.getCamundaRestClient()

describe('Invalid credentials REST client (default tenant)', () => {
	test.runIf(
		matrix({
			include: {
				versions: ['8.8', '8.7'],
				deployments: ['saas', 'self-managed'],
				tenancy: ['multi-tenant', 'single-tenant'],
				security: ['secured'],
			},
		})
	)('cannot deploy process', async () => {
		await expect(() =>
			restClientInvalidCreds.deployResourcesFromFiles([
				path.join(
					'.',
					'src',
					'__tests__',
					'testdata',
					'create-process-rest.bpmn'
				),
			])
		).rejects.toThrow()
	})
})
