import { randomUUID } from 'crypto'
import fs from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import os from 'os'
import path from 'path'
import util from 'util'

import debug from 'debug'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvironmentSetup } from '../../lib/EnvironmentSetup'
import { CookieAuthProvider, OAuthProvider } from '../../oauth'

/**
 * Canary test for the token-request boundary (part 2 of
 * https://github.com/camunda/camunda-8-js-sdk/issues/917).
 *
 * Each credential is a unique sentinel. Every failure path of the token
 * request is driven, all output is captured, and every thrown error is
 * inspected in depth. The sentinel must appear nowhere.
 */

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void

let captured: string[] = []
let servers: http.Server[] = []
let cacheDir: string

function capture(...args: unknown[]) {
	captured.push(util.format(...args))
}

async function listen(handler: Handler) {
	const server = http.createServer(handler)
	await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
	servers.push(server)
	return `http://127.0.0.1:${(server.address() as AddressInfo).port}/token`
}

/** A URL nothing listens on. */
async function deadUrl() {
	const server = http.createServer()
	await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
	const { port } = server.address() as AddressInfo
	await new Promise((r) => server.close(r))
	return `http://127.0.0.1:${port}/token`
}

/** Every rendering of an error a logger or a user could produce. */
function renderError(e: unknown): string {
	const parts: string[] = []
	const seen = new Set<unknown>()
	let current: unknown = e
	while (current && !seen.has(current)) {
		seen.add(current)
		parts.push(
			util.inspect(current, {
				depth: Infinity,
				showHidden: true,
				getters: true,
			}),
			util.format('%s %o %O', current, current, current),
			String(current),
			(current as Error).stack ?? ''
		)
		try {
			parts.push(JSON.stringify(current) ?? '')
		} catch {
			/* covered by inspect */
		}
		for (const key of Reflect.ownKeys(current as object)) {
			const v = (current as Record<PropertyKey, unknown>)[key]
			parts.push(util.inspect(v, { depth: Infinity, showHidden: true }))
		}
		current = (current as { cause?: unknown }).cause
	}
	return parts.join('\n')
}

function filesIn(dir: string): string {
	if (!fs.existsSync(dir)) return ''
	return fs
		.readdirSync(dir)
		.map((f) => f + fs.readFileSync(path.join(dir, f), 'utf8'))
		.join('\n')
}

function assertNoCanary(secret: string, errors: unknown[]) {
	for (const e of errors) {
		expect(e).toBeDefined()
		expect(renderError(e)).not.toContain(secret)
		expect(renderError(e)).not.toContain(encodeURIComponent(secret))
	}
	const out = captured.join('\n')
	expect(out).not.toContain(secret)
	expect(out).not.toContain(encodeURIComponent(secret))
	expect(filesIn(cacheDir)).not.toContain(secret)
}

beforeEach(() => {
	EnvironmentSetup.wipeEnv()
	captured = []
	servers = []
	cacheDir = fs.mkdtempSync(path.join(os.tmpdir(), 'canary-'))
	for (const m of ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const) {
		vi.spyOn(console, m).mockImplementation(capture)
	}
	vi.spyOn(process.stdout, 'write').mockImplementation((chunk) => {
		captured.push(String(chunk))
		return true
	})
	vi.spyOn(process.stderr, 'write').mockImplementation((chunk) => {
		captured.push(String(chunk))
		return true
	})
	debug.enable('*')
	debug.log = capture
})

afterEach(async () => {
	debug.disable()
	vi.restoreAllMocks()
	await Promise.all(
		servers.map((s) => {
			s.closeAllConnections()
			return new Promise((r) => s.close(r))
		})
	)
	fs.rmSync(cacheDir, { recursive: true, force: true })
})

function provider(url: string, secret: string, saas = false) {
	const p = new OAuthProvider({
		config: {
			CAMUNDA_OAUTH_URL: url,
			ZEEBE_CLIENT_ID: 'canary-client',
			ZEEBE_CLIENT_SECRET: secret,
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'aud',
			CAMUNDA_OAUTH_FAIL_ON_ERROR: true,
			CAMUNDA_TOKEN_CACHE_DIR: cacheDir,
			CAMUNDA_LOG_LEVEL: 'debug',
		},
	})
	if (saas) {
		;(p as unknown as { isCamundaSaaS: boolean }).isCamundaSaaS = true
	}
	return p
}

async function failures(p: OAuthProvider, times = 1) {
	const errors: unknown[] = []
	for (let i = 0; i < times; i++) {
		errors.push(
			await p.getHeaders('ZEEBE').then(
				() => undefined,
				(e) => e
			)
		)
	}
	return errors
}

const echoBody: (status: number) => Handler = (status) => (req, res) => {
	let body = ''
	req.on('data', (c) => (body += c))
	req.on('end', () => {
		res.statusCode = status
		res.setHeader('content-type', 'application/json')
		// A misbehaving IdP that echoes the request back.
		res.end(JSON.stringify({ error: 'invalid_client', echo: body }))
	})
}

describe('token request failure paths do not leak the client secret', () => {
	const secret = () => `CANARY-${randomUUID()}`

	it.each([401, 400, 403, 500, 503])(
		'HTTP %i (endpoint echoes the request)',
		async (status) => {
			const s = secret()
			const url = await listen(echoBody(status))
			const errors = await failures(provider(url, s))
			assertNoCanary(s, errors)
		}
	)

	it('SaaS 401: first error, memoised rethrow and tarpit', async () => {
		const s = secret()
		const url = await listen(echoBody(401))
		const errors = await failures(provider(url, s, true), 3)
		assertNoCanary(s, errors)
	})

	it('SaaS 401 with the disk cache off: memoised rethrow', async () => {
		const s = secret()
		const url = await listen(echoBody(401))
		const p = new OAuthProvider({
			config: {
				CAMUNDA_OAUTH_URL: url,
				ZEEBE_CLIENT_ID: 'canary-client',
				ZEEBE_CLIENT_SECRET: s,
				CAMUNDA_OAUTH_FAIL_ON_ERROR: true,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				CAMUNDA_LOG_LEVEL: 'debug',
			},
		})
		;(p as unknown as { isCamundaSaaS: boolean }).isCamundaSaaS = true
		assertNoCanary(s, await failures(p, 3))
	})

	it('connection refused', async () => {
		const s = secret()
		assertNoCanary(s, await failures(provider(await deadUrl(), s)))
	})

	it('connection reset mid-request', async () => {
		const s = secret()
		const url = await listen((req) => req.socket.destroy())
		assertNoCanary(s, await failures(provider(url, s)))
	})

	it('malformed token response', async () => {
		const s = secret()
		const url = await listen((_req, res) => res.end('<html>not json</html>'))
		const errors = await failures(provider(url, s))
		assertNoCanary(s, errors)
		// The response body is not echoed into the message.
		expect((errors[0] as Error).message).not.toContain('<html>')
	})

	it('200 without access_token', async () => {
		const s = secret()
		const url = await listen((_req, res) => {
			res.setHeader('content-type', 'application/json')
			res.end('{}')
		})
		assertNoCanary(s, await failures(provider(url, s)))
	})

	it('errors keep the status code so callers can still branch on it', async () => {
		const url = await listen(echoBody(401))
		const [e] = await failures(provider(url, secret()))
		expect((e as { statusCode?: number }).statusCode).toBe(401)
	})
})

describe('cookie login does not leak the password', () => {
	it('sends the password in the request body, not the URL, and errors are clean', async () => {
		const password = `CANARY-${randomUUID()}`
		let seenUrl = ''
		let seenBody = ''
		const url = await listen((req, res) => {
			seenUrl = req.url ?? ''
			req.on('data', (c) => (seenBody += c))
			req.on('end', () => {
				res.statusCode = 401
				res.end(`bad login for ${req.url} ${seenBody}`)
			})
		})
		const p = new CookieAuthProvider({
			config: {
				CAMUNDA_COOKIE_AUTH_URL: url,
				CAMUNDA_COOKIE_AUTH_USERNAME: 'demo',
				CAMUNDA_COOKIE_AUTH_PASSWORD: password,
				CAMUNDA_LOG_LEVEL: 'debug',
			},
		})
		const e = await p.getHeaders('OPERATE').then(
			() => undefined,
			(err) => err
		)
		expect(seenUrl).not.toContain(password)
		expect(new URLSearchParams(seenBody).get('password')).toBe(password)
		assertNoCanary(password, [e])
	})
})
