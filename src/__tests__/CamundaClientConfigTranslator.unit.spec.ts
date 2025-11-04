import { describe, expect, it } from 'vitest'

import { translateToOcaEnvOverrides } from '../lib/CamundaClientConfigTranslator'

describe('CamundaClientConfigTranslator.translateToOcaEnvOverrides', () => {
	it('maps auth strategy NONE', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: { CAMUNDA_AUTH_STRATEGY: 'NONE' },
		})
		expect(result.CAMUNDA_AUTH_STRATEGY).toBe('NONE')
	})

	it('throws on unsupported auth strategy BEARER', () => {
		expect(() =>
			translateToOcaEnvOverrides({
				sdkConfig: { CAMUNDA_AUTH_STRATEGY: 'BEARER' as any },
			})
		).toThrow()
	})

	it('derives clientId and secret from Zeebe credentials', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: {
				CAMUNDA_AUTH_STRATEGY: 'OAUTH',
				ZEEBE_CLIENT_ID: 'abc',
				ZEEBE_CLIENT_SECRET: 'def',
			},
		})
		expect(result.CAMUNDA_CLIENT_ID).toBe('abc')
		expect(result.CAMUNDA_CLIENT_SECRET).toBe('def')
	})

	it('falls back to console client id if Zeebe id absent', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: {
				CAMUNDA_AUTH_STRATEGY: 'OAUTH',
				CAMUNDA_CONSOLE_CLIENT_ID: 'console-id',
			},
		})
		expect(result.CAMUNDA_CLIENT_ID).toBe('console-id')
	})

	it('selects audience from CAMUNDA_ZEEBE_OAUTH_AUDIENCE first', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'preferred',
				ZEEBE_TOKEN_AUDIENCE: 'fallback',
			},
		})
		expect(result.CAMUNDA_TOKEN_AUDIENCE).toBe('preferred')
	})

	it('appends /v2 to rest address when derived', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: { ZEEBE_REST_ADDRESS: 'http://localhost:8080' },
		})
		expect(result.CAMUNDA_REST_ADDRESS).toBe('http://localhost:8080/v2')
	})

	it('does not double append /v2', () => {
		const r1 = translateToOcaEnvOverrides({
			sdkConfig: { ZEEBE_REST_ADDRESS: 'http://localhost:8080/v2' },
		})
		expect(r1.CAMUNDA_REST_ADDRESS).toBe('http://localhost:8080/v2')
		const r2 = translateToOcaEnvOverrides({
			sdkConfig: {
				ZEEBE_REST_ADDRESS: 'http://localhost:8080/api/v2/resource',
			},
		})
		expect(r2.CAMUNDA_REST_ADDRESS).toBe(
			'http://localhost:8080/api/v2/resource'
		)
	})

	it('log level mapping http -> debug', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: { CAMUNDA_LOG_LEVEL: 'http' },
		})
		expect(result.CAMUNDA_SDK_LOG_LEVEL).toBe('debug')
	})

	it('token cache omitted when disk cache disabled', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: {
				CAMUNDA_TOKEN_CACHE_DIR: '/tmp/tokens',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			},
		})
		expect(result.CAMUNDA_OAUTH_CACHE_DIR).toBeUndefined()
	})

	it('mTLS path precedence over inline CA', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: {
				CAMUNDA_CUSTOM_CERT_CHAIN_PATH: '/certs/cert.pem',
				CAMUNDA_CUSTOM_PRIVATE_KEY_PATH: '/certs/key.pem',
				CAMUNDA_CUSTOM_ROOT_CERT_PATH: '/certs/ca.pem',
				CAMUNDA_CUSTOM_ROOT_CERT_STRING: 'INLINE-CA',
			},
		})
		expect(result.CAMUNDA_MTLS_CERT_PATH).toBe('/certs/cert.pem')
		expect(result.CAMUNDA_MTLS_KEY_PATH).toBe('/certs/key.pem')
		expect(result.CAMUNDA_MTLS_CA_PATH).toBe('/certs/ca.pem')
		expect(result.CAMUNDA_MTLS_CA).toBeUndefined()
	})

	it('tenant id mapped', () => {
		const result = translateToOcaEnvOverrides({
			sdkConfig: { CAMUNDA_TENANT_ID: 't-123' },
		})
		expect(result.CAMUNDA_DEFAULT_TENANT_ID).toBe('t-123')
	})

	it('OCA env key shadows SDK derived value', () => {
		const result = translateToOcaEnvOverrides({
			env: { CAMUNDA_CLIENT_ID: 'env-client' },
			sdkConfig: { ZEEBE_CLIENT_ID: 'sdk-client' },
		})
		expect(result.CAMUNDA_CLIENT_ID).toBe('env-client')
	})
})
