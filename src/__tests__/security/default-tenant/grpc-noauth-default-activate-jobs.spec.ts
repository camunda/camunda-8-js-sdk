/**
 * In this scenario, we turn off authentication in the client. Methods are called without an authorization token.
 *
 * We expect this case to fail if the gateway is configured to require authentication.
 */
import { Camunda8 } from '../../../c8/index'

jest.setTimeout(15000)

// Suppress logging
process.env.ZEEBE_CLIENT_LOG_LEVEL = 'NONE'

const c8 = new Camunda8({
	CAMUNDA_AUTH_STRATEGY: 'NONE',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
	CAMUNDA_TENANT_ID: '<default>',
})
const zeebe = c8.getZeebeGrpcApiClient()
afterAll(() => zeebe.close())

describe('Unauthenticated gRPC client (default tenant)', () => {
	test('cannot activate jobs', async () => {
		await expect(
			async () =>
				await zeebe.activateJobs({
					maxJobsToActivate: 10,
					timeout: 10000,
					type: 'anything',
					worker: 'test',
				})
		).rejects.toThrow()
	})
})
