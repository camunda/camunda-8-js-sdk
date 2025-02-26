/**
 * In this scenario we use a token that was issued by a different instance of the Platform and has expired.
 *
 * This case can occur if the client date is incorrect or if the token was issued by a different instance of the Platform (i.e. the instance was redeployed).
 *
 * We expect this case to fail because the token is invalid.
 */

import path from 'node:path'

import { Camunda8 } from '../../../c8/index'

jest.setTimeout(15000)

const token =
	'eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJWOGFfUlB2R1pWNjVQLXZ5VXhBd2tSSXlrUzNfbkZxMTRGdjJwOUdsSEtJIn0'

// Suppress logging
process.env.ZEEBE_CLIENT_LOG_LEVEL = 'NONE'

const c8 = new Camunda8({
	CAMUNDA_AUTH_STRATEGY: 'BEARER',
	CAMUNDA_OAUTH_TOKEN: token,
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
	CAMUNDA_TENANT_ID: '<default>',
})
const zeebe = c8.getZeebeGrpcApiClient()
afterAll(() => zeebe.close())

describe('Expired token gRPC client (default tenant)', () => {
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
			})
		).rejects.toThrow()
	})
})
