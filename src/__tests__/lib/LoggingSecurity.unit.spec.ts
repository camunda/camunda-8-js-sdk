import fs from 'node:fs'

import { beforeEach, describe, expect, it, vi } from 'vitest'

import safeStringify, {
	CamundaSupportLogger,
} from '../../lib/CamundaSupportLogger'
import { CamundaPlatform8Configuration } from '../../lib/Configuration'
import { gotBeforeErrorHook } from '../../lib/GotErrors'
import { beforeCallHook, supportLogger } from '../../lib/GotHooks'
import { NormalizedOptions, RequestError } from '../../lib/HttpClient'

describe('HTTP diagnostic logging', () => {
	beforeEach(() => {
		vi.restoreAllMocks()
	})

	it('does not log request bodies, authorization, cookies, or TLS keys', () => {
		const log = vi
			.spyOn(supportLogger, 'log')
			.mockImplementation(() => undefined)
		const options = {
			context: {},
			method: 'POST',
			url: new URL(
				'https://api.example.test/v1/jobs?access_token=query-token&tenant=one'
			),
			headers: {
				authorization: 'Bearer header-token',
				cookie: 'session=cookie-secret',
				'content-type': 'application/json',
			},
			body: JSON.stringify({ client_secret: 'body-secret' }),
			https: {
				key: 'private-key-material',
				cert: 'client-certificate-material',
			},
		} as unknown as NormalizedOptions

		beforeCallHook(options)

		const output = safeStringify(log.mock.calls)
		expect(output).toContain('POST')
		expect(output).toContain('/v1/jobs')
		expect(output).not.toContain('access_token')
		expect(output).not.toContain('query-token')
		expect(output).not.toContain('header-token')
		expect(output).not.toContain('cookie-secret')
		expect(output).not.toContain('body-secret')
		expect(output).not.toContain('private-key-material')
		expect(output).not.toContain('client-certificate-material')
	})

	it('does not attach raw request options to support-log errors', () => {
		const log = vi
			.spyOn(supportLogger, 'log')
			.mockImplementation(() => undefined)
		const options = {
			context: {},
			method: 'POST',
			url: new URL('https://api.example.test/v1/jobs?access_token=query-token'),
			headers: { authorization: 'Bearer header-token' },
			body: 'client_secret=body-secret',
		}
		const error = Object.assign(new Error('request failed'), {
			code: 'ERR_TEST',
			options,
			request: { options },
		}) as unknown as RequestError

		gotBeforeErrorHook({} as CamundaPlatform8Configuration)(error)

		const output = safeStringify(log.mock.calls)
		expect(output).not.toContain('requestOptions')
		expect(output).not.toContain('query-token')
		expect(output).not.toContain('header-token')
		expect(output).not.toContain('body-secret')
	})

	it('redacts every cookie in invalid response headers', async () => {
		const log = vi
			.spyOn(supportLogger, 'log')
			.mockImplementation(() => undefined)
		const options = {
			context: {},
			method: 'GET',
			url: new URL('https://api.example.test/v1/clusters'),
			headers: {},
		}
		const error = Object.assign(new Error('Invalid header token'), {
			options,
			request: { options },
			response: {
				headers: {
					'set-cookie': [
						'session=first-cookie-secret',
						'refresh=second-cookie-secret',
					],
				},
			},
		}) as unknown as RequestError

		const result = await gotBeforeErrorHook(
			{} as CamundaPlatform8Configuration
		)(error)
		const output = `${safeStringify(log.mock.calls)}\n${safeStringify(result)}`

		expect(output).not.toContain('first-cookie-secret')
		expect(output).not.toContain('second-cookie-secret')
	})

	it('omits credential-bearing URLs from support-log error text', async () => {
		const log = vi
			.spyOn(supportLogger, 'log')
			.mockImplementation(() => undefined)
		const credentialUrl =
			'https://api-user:url-password@api.example.test/v1/jobs?api_key=query-secret'
		const options = {
			context: {},
			method: 'POST',
			url: new URL(credentialUrl),
			headers: {},
		}
		const error = Object.assign(
			new Error(`Request failed for ${credentialUrl}`),
			{
				code: 'ERR_TEST',
				options,
				request: { options },
				originalStack: `RequestError: ${credentialUrl}`,
			}
		) as unknown as RequestError
		error.stack = `RequestError: ${credentialUrl}`

		const result = await gotBeforeErrorHook(
			{} as CamundaPlatform8Configuration
		)(error)
		const output = safeStringify(log.mock.calls)

		expect(output).not.toContain('api-user')
		expect(output).not.toContain('url-password')
		expect(output).not.toContain('query-secret')
		expect(result.message).toContain(credentialUrl)
		expect(result.stack).toContain(credentialUrl)
	})

	it('logs only safe metadata when a response body echoes credentials', async () => {
		const log = vi
			.spyOn(supportLogger, 'log')
			.mockImplementation(() => undefined)
		const options = {
			context: {},
			method: 'POST',
			url: new URL('https://api.example.test/v1/jobs'),
			headers: {},
		}
		// HTTPError appends non-HTML response bodies to error.message, and the
		// parsed body lands in `detail`. Neither may reach the support file.
		const error = Object.assign(
			new Error('Request failed - {"tenantSecret":"echoed-credential"}'),
			{
				code: 'ERR_TEST',
				options,
				request: { options },
			}
		) as unknown as RequestError
		error.stack = 'RequestError: Request failed'

		await gotBeforeErrorHook({} as CamundaPlatform8Configuration)(error)
		const output = safeStringify(log.mock.calls)

		expect(output).not.toContain('echoed-credential')
		expect(output).not.toContain('tenantSecret')
		expect(output).not.toContain('"message"')
		expect(output).not.toContain('"detail"')
		expect(output).toContain('"method": "POST"')
	})
})

describe('CamundaSupportLogger redaction', () => {
	it('recursively redacts credentials from structured and string log data', () => {
		const input = {
			authorization: 'Bearer access-token',
			headers: {
				Authorization: 'Basic basic-token',
				Cookie: 'session=cookie-secret',
				'Set-Cookie': 'refresh=cookie-refresh',
				'X-Debug': 'safe-header',
			},
			request: {
				body: 'client_secret=client-secret&grant_type=client_credentials',
				https: {
					key: 'tls-private-key',
					cert: 'tls-certificate',
				},
			},
			access_token: 'response-access-token',
			refresh_token: 'response-refresh-token',
			CAMUNDA_BASIC_AUTH_PASSWORD: 'basic-auth-password',
			CAMUNDA_COOKIE_AUTH_PASSWORD: 'cookie-auth-password',
			CAMUNDA_CUSTOM_ROOT_CERT_STRING: 'inline-root-certificate',
			ZEEBE_CLIENT_SECRET: 'configured-client-secret',
			customSSL: {
				certChain: Buffer.from('client-certificate-chain'),
				rootCerts: Buffer.from('root-certificate-chain'),
				privateKey: Buffer.from('private-key'),
			},
			nested: {
				password: 'nested-password',
				message:
					'authorization=Bearer message-token client_secret=message-secret\n' +
					'-----BEGIN PRIVATE KEY-----\nunqualified-private-key\n-----END PRIVATE KEY-----\n' +
					'-----BEGIN RSA PRIVATE KEY-----\nrsa-private-key\n-----END RSA PRIVATE KEY-----',
			},
		}

		const output = safeStringify(input)

		for (const secret of [
			'access-token',
			'basic-token',
			'cookie-secret',
			'cookie-refresh',
			'client-secret',
			'tls-private-key',
			'tls-certificate',
			'response-access-token',
			'response-refresh-token',
			'basic-auth-password',
			'cookie-auth-password',
			'configured-client-secret',
			'unqualified-private-key',
			'rsa-private-key',
			'nested-password',
			'message-token',
			'message-secret',
		]) {
			expect(output).not.toContain(secret)
		}
		expect(output).toContain('[REDACTED]')
		expect(output).toContain('safe-header')
		expect(output).toContain('"certChain": "[REDACTED]"')
		expect(output).toContain('"rootCerts": "[REDACTED]"')
		expect(output).toContain('"CAMUNDA_CUSTOM_ROOT_CERT_STRING": "[REDACTED]"')
	})

	it('redacts sensitive strings at the public support-log boundary', () => {
		const logger = Object.create(
			CamundaSupportLogger.prototype
		) as CamundaSupportLogger
		Object.assign(logger, {
			enabled: true,
			filepath: '/tmp/camunda-support-logger-redaction-test.log',
		})
		const append = vi
			.spyOn(fs, 'appendFileSync')
			.mockImplementation(() => undefined)

		logger.log(
			'Bearer string-token client_secret=string-secret password=password-secret'
		)

		const output = append.mock.calls.flat().join('\n')
		expect(output).not.toContain('string-token')
		expect(output).not.toContain('string-secret')
		expect(output).not.toContain('password-secret')
	})

	it('redacts complete cookie headers, JSON arrays, and gRPC-propagated token errors', () => {
		const output = safeStringify({
			message:
				'Cookie: session=first-cookie; refresh=second-cookie-secret\n' +
				'{"access_token":["first-token","second-token-secret"]}',
		})
		expect(output).not.toContain('first-cookie')
		expect(output).not.toContain('second-cookie-secret')
		expect(output).not.toContain('first-token')
		expect(output).not.toContain('second-token-secret')

		// gRPC stream setup failures propagate the OAuth error message to the
		// application logger; credentials embedded in it must be stripped.
		const propagated =
			'Error requesting token for Client Id zeebe-client: POST ' +
			'https://oauth.example.test/token?client_secret=embedded-secret failed'
		const sanitized = safeStringify({ message: propagated })
		expect(sanitized).not.toContain('embedded-secret')
	})
})
