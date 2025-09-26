/**
 * In this scenario we use a token that was issued by a different instance of the Platform and has expired.
 *
 * This case can occur if the client date is incorrect or if the token was issued by a different instance of the Platform (i.e. the instance was redeployed).
 *
 * We expect this case to fail because the token is invalid.
 */

import { Camunda8 } from '../../../c8/index'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 15_000 })

const token = `eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJWOGFfUlB2R1pWNjVQLXZ5VXhBd2tSSXlrUzNfbkZxMTRGdjJwOUdsSEtJIn0.eyJleHAiOjE3MzkzODUzMDIsImlhdCI6MTczOTM4NTAwMiwianRpIjoiZmVmYjg4YTItNTVkOS00MzMyLWE2NjgtMWUwOTNkNzYxODQ5IiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDoxODA4MC9hdXRoL3JlYWxtcy9jYW11bmRhLXBsYXRmb3JtIiwiYXVkIjpbInplZWJlIiwidGFza2xpc3QtYXBpIiwiemVlYmUtYXBpIiwib3BlcmF0ZS1hcGkiLCJvcHRpbWl6ZS1hcGkiLCJ3ZWItbW9kZWxlci1wdWJsaWMtYXBpIiwiYWNjb3VudCJdLCJzdWIiOiJhY2EzNzQ4Ny03ZTI3LTQyZTYtODIyMy1jNTNlZmQ0N2VhZjIiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ6ZWViZSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGVmYXVsdCB1c2VyIHJvbGUiXX0sInJlc291cmNlX2FjY2VzcyI6eyJ0YXNrbGlzdC1hcGkiOnsicm9sZXMiOlsicmVhZDoqIiwid3JpdGU6KiJdfSwiemVlYmUtYXBpIjp7InJvbGVzIjpbIndyaXRlOioiXX0sIm9wZXJhdGUtYXBpIjp7InJvbGVzIjpbInJlYWQ6KiIsIndyaXRlOioiXX0sIm9wdGltaXplLWFwaSI6eyJyb2xlcyI6WyJ3cml0ZToqIl19LCJ3ZWItbW9kZWxlci1wdWJsaWMtYXBpIjp7InJvbGVzIjpbImRlbGV0ZToqIiwicmVhZDoqIiwidXBkYXRlOioiLCJjcmVhdGU6KiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJlbWFpbCBwcm9maWxlIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJjbGllbnRIb3N0IjoiMTkyLjE2OC42NS4xIiwicGVybWlzc2lvbnMiOnsidGFza2xpc3QtYXBpIjpbInJlYWQ6KiIsIndyaXRlOioiXSwiemVlYmUtYXBpIjpbIndyaXRlOioiXSwib3BlcmF0ZS1hcGkiOlsicmVhZDoqIiwid3JpdGU6KiJdLCJvcHRpbWl6ZS1hcGkiOlsid3JpdGU6KiJdLCJ3ZWItbW9kZWxlci1wdWJsaWMtYXBpIjpbImRlbGV0ZToqIiwicmVhZDoqIiwidXBkYXRlOioiLCJjcmVhdGU6KiJdLCJhY2NvdW50IjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC16ZWViZSIsImNsaWVudEFkZHJlc3MiOiIxOTIuMTY4LjY1LjEiLCJjbGllbnRfaWQiOiJ6ZWViZSJ9.hmo6h75t0L7zugCXLxBkI1c4vvO4Cz6_sfaTp3P-DOQkrpQzJ_k6zs8j8yGNximorOZvdKBsUDFPyiIsEIPCcys9i-VJLCCsJ5dYBHyJimht1q4QwCH88d0Di0vSFs5RkAhHpm3fQg0X6VpZleXFrxk_9Wx19mentRiHjfEn80JCjNxpOKjsEJ9GRHogtBeGMA8Av7Wcf_5fcPrhzvNPCgL5-jwoC-rTLQcmj4KOQIuz4hjCsXkgBTxeULTTaRp3GL_-OebJtB0xwLNTFPTPKMNDTc_U9pWcsxMzqIiR2UJ45cMxz2tuTLwIJnZh0fO4zI3SatjFqsKNxRE_DFEstA`

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: '<default>',
	CAMUNDA_AUTH_STRATEGY: 'BEARER',
	CAMUNDA_OAUTH_TOKEN: token,
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const restClientExpiredToken = c8.getCamundaRestClient()

describe('Expired token REST client (default tenant)', () => {
	test.runIf(
		matrix({
			include: {
				versions: ['8.8', '8.7'],
				deployments: ['saas', 'self-managed'],
				tenancy: ['multi-tenant', 'single-tenant'],
				security: ['secured'],
			},
		})
	)('cannot get topology', async () => {
		await expect(async () =>
			restClientExpiredToken.getTopology()
		).rejects.toThrow()
	})
})
