/**
 * In this scenario, we pass invalid credentials to the token endpoint.
 *
 * We expect this case to fail, and it will fail at the point of attempting to get a token, so the actual method endpoint is never addressed.
 */
import path from 'node:path'

import { Camunda8 } from '../../../c8/index'
import { NullLogger } from '../../../c8/lib/C8Logger'

jest.setTimeout(15000)

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
	test('cannot deploy process', async () => {
		await expect(async () =>
			zeebe.deployResource({
				processFilename: path.join(
					'.',
					'src',
					'__tests__',
					'testdata',
					'create-process-rest.bpmn'
				),
				tenantId: 'green',
			})
		).rejects.toThrow()
	})
})
