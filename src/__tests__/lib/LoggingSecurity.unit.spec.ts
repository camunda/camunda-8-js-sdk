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
			ZEEBE_CLIENT_SECRET: 'configured-client-secret',
			nested: {
				password: 'nested-password',
				message:
					'authorization=Bearer message-token client_secret=message-secret',
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
			'nested-password',
			'message-token',
			'message-secret',
		]) {
			expect(output).not.toContain(secret)
		}
		expect(output).toContain('[REDACTED]')
		expect(output).toContain('safe-header')
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
})
