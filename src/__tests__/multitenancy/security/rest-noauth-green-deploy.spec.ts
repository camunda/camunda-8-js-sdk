/**
 * In this scenario, we turn off authentication in the client. Methods are called without an authorization token.
 *
 * We expect this case to fail if the gateway is configured to require authentication.
 */
import path from 'node:path'

import { Camunda8 } from '../../../c8/index'
import { matrix } from '../../../test-support/testTags'

vitest.setConfig({ testTimeout: 15_000 })

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: 'green',
	CAMUNDA_AUTH_STRATEGY: 'NONE',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const camunda = c8.getCamundaRestClient()

describe('Unauthenticated REST client (green tenant)', () => {
	test.runIf(
		matrix({
			include: {
				versions: ['8.8', '8.7'],
				deployments: ['saas', 'self-managed'],
				tenancy: ['multi-tenant'],
				security: ['secured'],
			},
		})
	)(
		'cannot deploy process',
		async () =>
			await expect(() =>
				camunda.deployResourcesFromFiles([
					path.join(
						'.',
						'src',
						'__tests__',
						'testdata',
						'create-process-rest.bpmn'
					),
				])
			).rejects.toThrow()
	)
})
