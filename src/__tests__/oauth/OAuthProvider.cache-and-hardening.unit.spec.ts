import fs from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import os from 'os'
import path from 'path'

import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvironmentSetup } from '../../lib/EnvironmentSetup'

/**
 * Regression tests for the hardening changes in
 * https://github.com/camunda/camunda-8-js-sdk/pull/722
 *
 * These tests target *classes of defect* rather than specific instances:
 *
 * 1. Token cache keys must incorporate the client id actually used for the
 *    request. On SaaS, `ZEEBE`/`OPERATE`/`TASKLIST`/`OPTIMIZE` use the
 *    application client id, while `CONSOLE`/`MODELER` use the Console
 *    client id. A cache key that only discriminates by audience (and
 *    silently uses `this.clientId`) lets a Console token collide with a
 *    Zeebe token's cache slot, and vice versa. The tests below verify
 *    both audiences trigger their own token request with the correct
 *    client id, and both returned tokens are served back to the caller.
 *
 * 2. `flushFileCache()` must actually delete `oauth-token-*.json` files
 *    inside `cacheDir`, leave unrelated files alone, and tolerate a
 *    missing directory. A latent bug in the previous implementation made
 *    it a no-op in every realistic deployment (it called `unlinkSync`
 *    with bare filenames relative to `process.cwd()`).
 *
 * 3. `redactClientSecret()` must mask the `client_secret` value in any
 *    url-encoded body, regardless of what other fields surround it. Trace
 *    logs are emitted at `debug('camunda:oauth')` level and should never
 *    contain a plaintext secret.
 */

let tmpDirs: string[] = []

beforeEach(() => {
	vi.resetModules()
	EnvironmentSetup.wipeEnv()
})

afterEach(() => {
	for (const dir of tmpDirs) {
		try {
			fs.rmSync(dir, { recursive: true, force: true })
		} catch {
			/* ignore */
		}
	}
	tmpDirs = []
})

function makeTmpDir(prefix: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix))
	tmpDirs.push(dir)
	return dir
}

type TokenRequest = { body: string; audience: string }

function startTokenServer(onRequest?: (req: TokenRequest) => void): {
	url: string
	requests: TokenRequest[]
	close: () => Promise<void>
} {
	const requests: TokenRequest[] = []
	const secret = 'test-secret'
	const server = http.createServer((req, res) => {
		if (req.method !== 'POST') {
			res.statusCode = 405
			return res.end()
		}
		let body = ''
		req.on('data', (chunk) => {
			body += chunk.toString()
		})
		req.on('end', () => {
			const audienceMatch = /audience=([^&]+)/.exec(body)
			const audience = audienceMatch ? audienceMatch[1] : ''
			const entry = { body, audience }
			requests.push(entry)
			onRequest?.(entry)
			const token = jwt.sign(
				{ id: 1, aud: audience, sub: body }, // sub embeds body so test can distinguish tokens
				secret,
				{ expiresIn: 60 }
			)
			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ access_token: token, expires_in: 60 }))
		})
	})
	server.listen()
	const port = (server.address() as AddressInfo).port
	return {
		url: `http://127.0.0.1:${port}`,
		requests,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	}
}

describe('OAuthProvider memory cache key includes clientIdToUse', () => {
	it('CONSOLE and ZEEBE audiences on the same provider issue distinct token requests with their own client ids and do not collide in cache', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			OAuthProvider: any
		}
		const tokenCacheDir = makeTmpDir('oauth-cachekey-')
		const server = startTokenServer()

		try {
			const o = new OAuthProvider({
				config: {
					CAMUNDA_OAUTH_URL: server.url,
					// Force SaaS behaviour so CONSOLE/MODELER route to console credentials
					// without needing a real SaaS URL.
					ZEEBE_CLIENT_ID: 'zeebe-client',
					ZEEBE_CLIENT_SECRET: 'zeebe-secret',
					CAMUNDA_CONSOLE_CLIENT_ID: 'console-client',
					CAMUNDA_CONSOLE_CLIENT_SECRET: 'console-secret',
					CAMUNDA_CONSOLE_OAUTH_AUDIENCE: 'api.cloud.camunda.io',
					CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'zeebe.camunda.io',
					CAMUNDA_TOKEN_CACHE_DIR: tokenCacheDir,
					CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
					CAMUNDA_OAUTH_FAIL_ON_ERROR: true,
				},
			})
			// Pretend this is SaaS so that CONSOLE/MODELER use console credentials
			;(o as unknown as { isCamundaSaaS: boolean }).isCamundaSaaS = true

			const zeebeHeaders = await o.getHeaders('ZEEBE')
			const consoleHeaders = await o.getHeaders('CONSOLE')

			// Two distinct network requests — cache slots must not collide.
			expect(server.requests).toHaveLength(2)

			const zeebeReq = server.requests.find((r) =>
				r.body.includes('client_id=zeebe-client')
			)
			const consoleReq = server.requests.find((r) =>
				r.body.includes('client_id=console-client')
			)
			expect(zeebeReq, 'ZEEBE token request must use zeebe-client').toBeTruthy()
			expect(
				consoleReq,
				'CONSOLE token request must use console-client'
			).toBeTruthy()
			expect(zeebeReq!.body).toContain('client_secret=zeebe-secret')
			expect(consoleReq!.body).toContain('client_secret=console-secret')

			// Tokens returned to the caller must correspond to their respective requests.
			expect(zeebeHeaders.authorization).not.toEqual(
				consoleHeaders.authorization
			)

			// Second call to the same audience must hit the memory cache (no extra request).
			const zeebeHeaders2 = await o.getHeaders('ZEEBE')
			expect(server.requests).toHaveLength(2)
			expect(zeebeHeaders2.authorization).toEqual(zeebeHeaders.authorization)

			// Cache entries must be keyed by clientId+audience, not just audience.
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const keys = Object.keys((o as any).tokenCache)
			expect(keys.sort()).toEqual(
				['console-client-CONSOLE', 'zeebe-client-ZEEBE'].sort()
			)
		} finally {
			await server.close()
		}
	})

	it('getCacheKey derives from the provided clientId, not from this.clientId', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			OAuthProvider: any
		}
		const tokenCacheDir = makeTmpDir('oauth-cachekey-internal-')
		const o = new OAuthProvider({
			config: {
				CAMUNDA_OAUTH_URL: 'http://127.0.0.1:1',
				ZEEBE_CLIENT_ID: 'zeebe-client',
				ZEEBE_CLIENT_SECRET: 'zeebe-secret',
				CAMUNDA_CONSOLE_CLIENT_ID: 'console-client',
				CAMUNDA_CONSOLE_CLIENT_SECRET: 'console-secret',
				CAMUNDA_TOKEN_CACHE_DIR: tokenCacheDir,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			},
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const getCacheKey = (o as any).getCacheKey as (
			clientId: string,
			audience: string
		) => string

		// The class-of-defect check: different clientIds must yield different
		// keys even for the same audience. A regression where the key drops
		// clientId would collapse both of these to the same string.
		expect(getCacheKey('zeebe-client', 'ZEEBE')).toBe('zeebe-client-ZEEBE')
		expect(getCacheKey('console-client', 'ZEEBE')).toBe('console-client-ZEEBE')
		expect(getCacheKey('zeebe-client', 'CONSOLE')).toBe('zeebe-client-CONSOLE')
		expect(getCacheKey('zeebe-client', 'ZEEBE')).not.toBe(
			getCacheKey('console-client', 'ZEEBE')
		)
	})
})

describe('OAuthProvider flushFileCache', () => {
	it('removes oauth-token-*.json files, leaves unrelated files, and does not blow up on a missing directory', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			OAuthProvider: any
		}
		const tokenCacheDir = makeTmpDir('oauth-flush-')

		const tokenFileA = path.join(
			tokenCacheDir,
			'oauth-token-zeebe-client-ZEEBE.json'
		)
		const tokenFileB = path.join(
			tokenCacheDir,
			'oauth-token-console-client-CONSOLE.json'
		)
		const tarpitFile = path.join(
			tokenCacheDir,
			'oauth-401-tarpit-zeebe-client-ZEEBE-abc.json'
		)
		const unrelatedFile = path.join(tokenCacheDir, 'keep-me.txt')
		fs.writeFileSync(tokenFileA, '{}')
		fs.writeFileSync(tokenFileB, '{}')
		fs.writeFileSync(tarpitFile, '{}')
		fs.writeFileSync(unrelatedFile, 'keep')

		const o = new OAuthProvider({
			config: {
				CAMUNDA_OAUTH_URL: 'http://127.0.0.1:1',
				ZEEBE_CLIENT_ID: 'zeebe-client',
				ZEEBE_CLIENT_SECRET: 'zeebe-secret',
				CAMUNDA_TOKEN_CACHE_DIR: tokenCacheDir,
			},
		})

		o.flushFileCache()

		expect(fs.existsSync(tokenFileA)).toBe(false)
		expect(fs.existsSync(tokenFileB)).toBe(false)
		// Non-oauth-token files must be preserved (tarpit + unrelated).
		expect(fs.existsSync(tarpitFile)).toBe(true)
		expect(fs.existsSync(unrelatedFile)).toBe(true)

		// Missing directory must not throw.
		fs.rmSync(tokenCacheDir, { recursive: true, force: true })
		expect(() => o.flushFileCache()).not.toThrow()
	})
})

describe('OAuthProvider redactClientSecret', () => {
	it('masks client_secret in url-encoded bodies regardless of position', async () => {
		const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			OAuthProvider: any
		}
		const o = new OAuthProvider({
			config: {
				CAMUNDA_OAUTH_URL: 'http://127.0.0.1:1',
				ZEEBE_CLIENT_ID: 'zeebe-client',
				ZEEBE_CLIENT_SECRET: 'zeebe-secret',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			},
		})

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const redact = (o as any).redactClientSecret.bind(o) as (
			body: string
		) => string

		const inputs = [
			'client_id=zeebe-client&client_secret=supersecret&grant_type=client_credentials',
			'grant_type=client_credentials&client_secret=another-secret&audience=aud',
			'client_secret=only-field-here',
			'client_id=zeebe-client&client_secret=value-with-special%2Bchars&scope=foo',
		]

		for (const body of inputs) {
			const redacted = redact(body)
			// Class-of-defect: secret substring must never leak, regardless of position.
			expect(
				redacted,
				`redacted body must contain [REDACTED]: ${redacted}`
			).toContain('client_secret=[REDACTED]')
			const originalSecret = /client_secret=([^&]+)/.exec(body)![1]
			expect(
				redacted,
				`redacted body must not contain raw secret ${originalSecret}`
			).not.toContain(originalSecret)
			// Non-secret fields must be preserved verbatim.
			for (const part of body.split('&')) {
				if (part.startsWith('client_secret=')) continue
				expect(redacted).toContain(part)
			}
		}
	})
})
