import crypto from 'crypto'
import fs from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import path from 'path'

import jwt from 'jsonwebtoken'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvironmentSetup } from '../../lib/EnvironmentSetup'

// Test-only extended interface exposing private members we need to assert.
// We deliberately replicate shape; runtime type checks are not required.
type TestOAuthProvider = {
	getHeaders: (aud: 'ZEEBE' | 'OPERATE') => Promise<{ authorization: string }>
	isCamundaSaaS: boolean
	cacheDir: string
	hashSecret: (secret: string) => string
}

/**
 * Tests for SaaS persistent 401 tarpit logic in OAuthProvider.
 * Verifies that an initial 401 creates a persistent tarpit file (memoization) that blocks
 * further token endpoint calls until manually cleared, surviving process restarts.
 */

describe('OAuthProvider SaaS persistent 401 tarpit', () => {
	beforeEach(() => {
		vi.resetModules()
		EnvironmentSetup.wipeEnv()
	})

	it('creates persistent tarpit on first SaaS 401 and short-circuits subsequent requests', async () => {
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
		// First message is raw 401 (no tarpit yet)
		expect(firstError!.message).toMatch(/401/i)
		expect(firstError!.message).not.toMatch(/tarpit/i)
		// Second request should NOT hit endpoint again (persistent tarpit)
		let secondError: Error | undefined
		await provider.getHeaders('ZEEBE').catch((e: Error) => (secondError = e))
		expect(secondError).toBeTruthy()
		expect(secondError!.message).toMatch(/tarpit/i)
		expect(requestCount).toBe(1)
		// Verify tarpit file exists
		// Derive tarpit file path (replicates internal logic): truncated sha256 of secret
		const cacheDir: string = (provider as unknown as { cacheDir: string })
			.cacheDir

		const hash = crypto
			.createHash('sha256')
			.update('secret')
			.digest('hex')
			.slice(0, 16)
		const tarpitFile = path.join(
			cacheDir,
			`oauth-401-tarpit-ZEEBE-ZEEBE-${hash}.json`
		)
		expect(fs.existsSync(tarpitFile)).toBe(true)
		server.close()
	})

	it('after manual clear401Tarpit, token request is retried and can succeed', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			OAuthProvider: {
				new (args: { config: Record<string, unknown> }): TestOAuthProvider
				clear401Tarpit: (args: {
					cacheDir?: string
					clientId: string
					clientSecret: string
					audienceType: 'ZEEBE' | 'OPERATE'
				}) => void
			}
		}
		let requestCount = 0
		let firstPhase = true
		const signingSecret = 'super'
		const access_token = jwt.sign({ sub: 'user' }, signingSecret, {
			expiresIn: 60,
		})
		const server = http.createServer((_, res) => {
			requestCount++
			if (firstPhase) {
				res.statusCode = 401
				res.end('Access denied')
				firstPhase = false
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
				ZEEBE_CLIENT_ID: 'MANUAL',
				ZEEBE_CLIENT_SECRET: 'MANUALSECRET',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'manual-aud',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		;(provider as TestOAuthProvider).isCamundaSaaS = true
		await provider.getHeaders('ZEEBE').catch(() => null)
		expect(requestCount).toBe(1)
		// Second call blocked by tarpit
		await provider.getHeaders('ZEEBE').catch((e: Error) => {
			expect(e.message).toMatch(/tarpit/i)
		})
		expect(requestCount).toBe(1)
		// Clear tarpit
		OAuthProvider.clear401Tarpit({
			clientId: 'MANUAL',
			clientSecret: 'MANUALSECRET',
			cacheDir: (provider as TestOAuthProvider).cacheDir,
			audienceType: 'ZEEBE',
		})
		// Retry should hit endpoint and succeed
		const headers = await provider.getHeaders('ZEEBE')
		expect(headers.authorization.startsWith('Bearer ')).toBe(true)
		expect(requestCount).toBe(2)
		server.close()
	})

	it('tarpit persists across provider re-instantiation (restart simulation)', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			OAuthProvider: {
				new (args: { config: Record<string, unknown> }): TestOAuthProvider
				clear401Tarpit: (args: {
					cacheDir?: string
					clientId: string
					clientSecret: string
					audienceType: 'ZEEBE' | 'OPERATE'
				}) => void
			}
		}
		let requestCount = 0
		const server = http.createServer((_, res) => {
			requestCount++
			res.statusCode = 401
			res.end('Unauthorized')
		})
		server.listen()
		const port = (server.address() as AddressInfo).port
		const config = {
			ZEEBE_CLIENT_ID: 'RESTART',
			ZEEBE_CLIENT_SECRET: 'RESTARTSECRET',
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'restart-aud',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
			CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
			CAMUNDA_LOG_LEVEL: 'none',
		}
		const provider1 = new OAuthProvider({ config })
		;(provider1 as TestOAuthProvider).isCamundaSaaS = true
		await provider1.getHeaders('ZEEBE').catch(() => null)
		expect(requestCount).toBe(1)
		// New instance simulating process restart
		const provider2 = new OAuthProvider({ config })
		;(provider2 as TestOAuthProvider).isCamundaSaaS = true
		await provider2.getHeaders('ZEEBE').catch((e: Error) => {
			expect(e.message).toMatch(/tarpit/i)
		})
		expect(requestCount).toBe(1)
		server.close()
	})

	it('clear401Tarpit is idempotent (second call does nothing)', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			OAuthProvider: {
				new (args: { config: Record<string, unknown> }): TestOAuthProvider
				clear401Tarpit: (args: {
					cacheDir?: string
					clientId: string
					clientSecret: string
					audienceType: 'ZEEBE' | 'OPERATE'
				}) => void
			}
		}
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
				ZEEBE_CLIENT_ID: 'IDEMP',
				ZEEBE_CLIENT_SECRET: 'IDEMPSECRET',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'idem-aud',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				CAMUNDA_OAUTH_FAIL_ON_ERROR: false,
				CAMUNDA_LOG_LEVEL: 'none',
			},
		})
		;(provider as TestOAuthProvider).isCamundaSaaS = true
		await provider.getHeaders('ZEEBE').catch(() => null)
		expect(requestCount).toBe(1)
		const cacheDir = (provider as TestOAuthProvider).cacheDir
		OAuthProvider.clear401Tarpit({
			clientId: 'IDEMP',
			clientSecret: 'IDEMPSECRET',
			cacheDir,
			audienceType: 'ZEEBE',
		})
		// Second clear should not throw
		OAuthProvider.clear401Tarpit({
			clientId: 'IDEMP',
			clientSecret: 'IDEMPSECRET',
			cacheDir,
			audienceType: 'ZEEBE',
		})
		// After clearing, attempt should hit endpoint again (and still 401) increasing count
		await provider.getHeaders('ZEEBE').catch(() => null)
		expect(requestCount).toBe(2)
		server.close()
	})

	it('tarpit for one audience does not block another audience', async () => {
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
