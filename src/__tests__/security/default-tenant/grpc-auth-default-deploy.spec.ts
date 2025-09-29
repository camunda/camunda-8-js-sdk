/**
 * In this scenario, we authenticate the REST client with a valid id and secret to get a bearer token.
 *
 * We expect this case to succeed.
 */
import path from 'node:path'

import { Camunda8 } from '../../../c8/index'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

// Suppress logging
process.env.ZEEBE_CLIENT_LOG_LEVEL = 'NONE'

const c8 = new Camunda8({
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
	CAMUNDA_TENANT_ID: '<default>',
})
const zeebe = c8.getZeebeGrpcApiClient()
afterAll(() => zeebe.close())

describe('Authenticated gRPC client (default tenant)', () => {
	test.runIf(
		matrix({
			include: {
				versions: ['8.8', '8.7'],
				deployments: ['saas', 'self-managed'],
				tenancy: ['multi-tenant', 'single-tenant'],
				security: ['secured', 'unsecured'],
			},
		})
	)('can deploy process', async () => {
		const res = await zeebe.deployResource({
			processFilename: path.join(
				'.',
				'src',
				'__tests__',
				'testdata',
				'create-process-rest.bpmn'
			),
		})
		expect(res.deployments.length).toBe(1)
	})
})
