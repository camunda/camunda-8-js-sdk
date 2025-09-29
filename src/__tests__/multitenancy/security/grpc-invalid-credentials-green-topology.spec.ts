/**
 * In this scenario, we pass invalid credentials to the token endpoint.
 *
 * We expect this case to fail, and it will fail at the point of attempting to get a token, so the actual method endpoint is never addressed.
 */
import { Camunda8 } from '../../../c8/index'
import { NullLogger } from '../../../c8/lib/C8Logger'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

// Suppress logging
process.env.ZEEBE_CLIENT_LOG_LEVEL = 'NONE'

const c8 = new Camunda8({
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
	ZEEBE_CLIENT_ID: 'invalid',
	ZEEBE_CLIENT_SECRET: 'invalid',
	CAMUNDA_TENANT_ID: 'green',
	logger: NullLogger,
})
const zeebe = c8.getZeebeGrpcApiClient()
afterAll(() => zeebe.close())

describe('Invalid credentials gRPC client (green tenant)', () => {
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
		'cannot get topology',
		async () => await expect(async () => zeebe.topology()).rejects.toThrow()
	)
})
