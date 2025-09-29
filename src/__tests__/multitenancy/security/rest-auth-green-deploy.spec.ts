/**
 * In this scenario, we authenticate the REST client with a valid id and secret to get a bearer token.
 *
 * We expect this case to succeed.
 */
import path from 'node:path'

import { Camunda8 } from '../../../c8/index'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: 'green',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const restClientAuthed = c8.getCamundaRestClient()

describe('Authenticated REST client (green tenant)', () => {
	test.runIf(
		matrix({
			include: {
				versions: ['8.8', '8.7'],
				deployments: ['saas', 'self-managed'],
				tenancy: ['multi-tenant'],
				security: ['secured'],
			},
		})
	)('can deploy process', async () => {
		const res = await restClientAuthed.deployResourcesFromFiles([
			path.join(
				'.',
				'src',
				'__tests__',
				'testdata',
				'create-process-rest.bpmn'
			),
		])
		expect(res.deployments.length).toBe(1)
	})
})
