import http from 'http'
import { AddressInfo } from 'net'

import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvironmentSetup } from '../../lib/EnvironmentSetup'

/**
 * Tests for SaaS 401 memoization cooldown buffering logic in OAuthProvider.
 * Verifies that repeated 401 responses within cooldown window do not trigger new token endpoint calls.
 */

describe('OAuthProvider SaaS 401 memoization', () => {
	beforeEach(() => {
		vi.resetModules()
		EnvironmentSetup.wipeEnv()
	})

	it('memoizes 401 for SaaS and short-circuits subsequent requests within cooldown', async () => {
		const mod = (await vi.importActual('../../oauth')) as {
			OAuthProvider: typeof import('../../oauth').OAuthProvider
		}
		const { OAuthProvider } = mod
		let requestCount = 0
		const server = http.createServer((_, res) => {
			requestCount++
			res.statusCode = 401
			res.end('Access denied')
		})
		server.listen()
		const port = (server.address() as AddressInfo).port

		const provider = new OAuthProvider({
			config: {
				ZEEBE_CLIENT_ID: 'ZEEBE',
				ZEEBE_CLIENT_SECRET: 'secret',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'aud',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				// Force SaaS-like fail-fast off so backoff not interfering; we want memo behavior only
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		// Simulate SaaS endpoint detection by overriding internal flag
		// @ts-expect-error accessing private flag for test purposes
		provider.isCamundaSaaS = true

		let firstError: Error | undefined
		await provider.getHeaders('ZEEBE').catch((e: Error) => (firstError = e))
		expect(firstError).toBeTruthy()
		// Second request should NOT hit endpoint again (still within 30s cooldown)
		let secondError: Error | undefined
		await provider.getHeaders('ZEEBE').catch((e: Error) => (secondError = e))
		expect(secondError).toBeTruthy()
		expect(secondError!.message).toEqual(firstError!.message)
		// Only one network request should have been made
		expect(requestCount).toBe(1)
		server.close()
	})

	it('expires memoized 401 after cooldown window and re-attempts request', async () => {
		interface OAuthProviderExtended {
			new (args: { config: Record<string, unknown> }): {
				getHeaders: (aud: 'ZEEBE') => Promise<{ authorization: string }>
				isCamundaSaaS: boolean
				constructor: { SAAS_401_COOLDOWN_MS: number }
			}
		}
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			OAuthProvider: OAuthProviderExtended
		}
		let requestCount = 0
		const server = http.createServer((_, res) => {
			requestCount++
			res.statusCode = 401
			res.end('Access denied')
		})
		server.listen()
		const port = (server.address() as AddressInfo).port

		const provider = new OAuthProvider({
			config: {
				ZEEBE_CLIENT_ID: 'ZEEBE2',
				ZEEBE_CLIENT_SECRET: 'secret2',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'aud2',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		provider.isCamundaSaaS = true
		// Shrink cooldown for test speed
		provider.constructor.SAAS_401_COOLDOWN_MS = 200

		await provider.getHeaders('ZEEBE').catch(() => null)
		await new Promise((r) => setTimeout(r, 300))
		await provider.getHeaders('ZEEBE').catch(() => null)
		// Two attempts after expiry
		expect(requestCount).toBe(2)
		server.close()
	})

	it('clears memoized 401 on successful token fetch', async () => {
		interface OAuthProviderExtended {
			new (args: { config: Record<string, unknown> }): {
				getHeaders: (aud: 'ZEEBE') => Promise<{ authorization: string }>
				isCamundaSaaS: boolean
			}
		}
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			OAuthProvider: OAuthProviderExtended
		}
		let requestCount = 0
		let toggle401 = true
		const secret = 'super'
		const access_token = jwt.sign({ sub: 'user' }, secret, { expiresIn: 60 })
		const server = http.createServer((_, res) => {
			requestCount++
			if (toggle401) {
				res.statusCode = 401
				res.end('Access denied')
				toggle401 = false
			} else {
				res.statusCode = 200
				res.setHeader('Content-Type', 'application/json')
				res.end(JSON.stringify({ access_token }))
			}
		})
		server.listen()
		const port = (server.address() as AddressInfo).port

		const provider = new OAuthProvider({
			config: {
				ZEEBE_CLIENT_ID: 'ZEEBE3',
				ZEEBE_CLIENT_SECRET: 'secret3',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'aud3',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		provider.isCamundaSaaS = true

		// First call -> 401 memoized
		await provider.getHeaders('ZEEBE').catch(() => null)
		expect(requestCount).toBe(1)
		// Second call should short-circuit (no new request) due to memoization
		await provider.getHeaders('ZEEBE').catch((e) => e)
		expect(requestCount).toBe(1)
		// Force cooldown expiry
		// @ts-expect-error mutate static for test speed
		OAuthProvider.SAAS_401_COOLDOWN_MS = 5
		await new Promise((r) => setTimeout(r, 10))
		// Third call should attempt again and succeed
		const headers = await provider.getHeaders('ZEEBE')
		expect(requestCount).toBe(2)
		expect(headers.authorization.startsWith('Bearer ')).toBe(true)
		server.close()
	})

	it('memoized 401 for one audience does not block another audience', async () => {
		const mod = (await vi.importActual('../../oauth')) as {
			OAuthProvider: typeof import('../../oauth').OAuthProvider
		}
		const { OAuthProvider } = mod
		let zeebeCount = 0
		let operateCount = 0
		const secret = 'another'
		const access_token = jwt.sign({ aud: 'operate' }, secret, { expiresIn: 60 })
		// One server that differentiates by audience param presence/body; simpler: two servers
		const zeebeServer = http.createServer((_, res) => {
			zeebeCount++
			res.statusCode = 401
			res.end('Access denied ZEEBE')
		})
		const operateServer = http.createServer((_, res) => {
			operateCount++
			res.statusCode = 200
			res.setHeader('Content-Type', 'application/json')
			res.end(JSON.stringify({ access_token }))
		})
		zeebeServer.listen()
		operateServer.listen()
		const zPort = (zeebeServer.address() as AddressInfo).port
		const oPort = (operateServer.address() as AddressInfo).port

		const provider = new OAuthProvider({
			config: {
				ZEEBE_CLIENT_ID: 'CLIENTX',
				ZEEBE_CLIENT_SECRET: 'secretx',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'aud-zeebe',
				CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'aud-operate',
				// Hack: we use separate token endpoints by swapping authServerUrl between calls
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${zPort}`,
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		// @ts-expect-error private test access
		provider.isCamundaSaaS = true

		// First, ZEEBE audience 401 -> memoized
		await provider.getHeaders('ZEEBE').catch(() => null)
		expect(zeebeCount).toBe(1)
		// Swap endpoint to operate server for OPERATE token
		// @ts-expect-error override private value
		provider.authServerUrl = `http://127.0.0.1:${oPort}`
		const opHeaders = await provider.getHeaders('OPERATE')
		expect(opHeaders.authorization).toBeTruthy()
		expect((opHeaders.authorization as string).startsWith('Bearer ')).toBe(true)
		expect(operateCount).toBe(1)
		// Ensure still only one zeebe request (memo prevents new call)
		await provider.getHeaders('ZEEBE').catch(() => null)
		expect(zeebeCount).toBe(1)

		zeebeServer.close()
		operateServer.close()
	})

	it('does not increment failureCount for SaaS 401 memoization', async () => {
		const mod = (await vi.importActual('../../oauth')) as {
			OAuthProvider: typeof import('../../oauth').OAuthProvider
		}
		const { OAuthProvider } = mod
		let requestCount = 0
		const server = http.createServer((_, res) => {
			requestCount++
			res.statusCode = 401
			res.end('Unauthorized')
		})
		server.listen()
		const port = (server.address() as AddressInfo).port

		const provider = new OAuthProvider({
			config: {
				ZEEBE_CLIENT_ID: 'ZFAIL',
				ZEEBE_CLIENT_SECRET: 'ZFAILSECRET',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'aud-failure',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				// Important: allow failure backoff logic (so failureCount would normally increment)
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		// Force SaaS behaviour
		// @ts-expect-error test access
		provider.isCamundaSaaS = true

		await provider.getHeaders('ZEEBE').catch(() => null)
		// @ts-expect-error accessing private for assertion
		expect(provider.failureCount).toBe(0)
		// Second call within cooldown should short-circuit and still not increment
		await provider.getHeaders('ZEEBE').catch(() => null)
		// Only one outbound request
		expect(requestCount).toBe(1)
		// @ts-expect-error accessing private for assertion
		expect(provider.failureCount).toBe(0)

		server.close()
	})
})
