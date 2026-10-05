import fs from 'node:fs'
import http from 'node:http'
import https from 'node:https'
import { AddressInfo } from 'node:net'
import path from 'node:path'

import { afterEach, describe, expect, test } from 'vitest'

import {
	CancelError,
	createHttpClient,
	FormData,
	HTTPError,
	mergeOptions,
	RequestError,
	TimeoutError,
} from '../../lib/HttpClient'

type Handler = (req: http.IncomingMessage, res: http.ServerResponse) => void

const servers: (http.Server | https.Server)[] = []
afterEach(async () => {
	await Promise.all(
		servers.splice(0).map(
			(s) =>
				new Promise<void>((resolve) => {
					s.closeAllConnections?.()
					s.close(() => resolve())
				})
		)
	)
})

async function listen(server: http.Server | https.Server) {
	servers.push(server)
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
	return (server.address() as AddressInfo).port
}

async function startServer(handler: Handler) {
	const port = await listen(http.createServer(handler))
	return `http://127.0.0.1:${port}`
}

function readBody(req: http.IncomingMessage): Promise<string> {
	return new Promise((resolve) => {
		const chunks: Buffer[] = []
		req.on('data', (c) => chunks.push(c))
		req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
	})
}

/** A port with nothing listening on it */
async function closedPort() {
	const s = http.createServer()
	await new Promise<void>((r) => s.listen(0, '127.0.0.1', r))
	const port = (s.address() as AddressInfo).port
	await new Promise<void>((r) => s.close(() => r()))
	return port
}

describe('HttpClient', () => {
	test('prefixUrl, merged searchParams (undefined skipped), json body and .json()', async () => {
		let seen: { url?: string; body?: string; ct?: string } = {}
		const base = await startServer(async (req, res) => {
			seen = {
				url: req.url,
				body: await readBody(req),
				ct: req.headers['content-type'],
			}
			res.setHeader('content-type', 'application/json')
			res.end(JSON.stringify({ ok: true }))
		})
		const client = createHttpClient({
			prefixUrl: `${base}/v2`,
			searchParams: { a: '1' },
		})
		const result = await client
			.post('things/search', {
				json: { x: 1 },
				searchParams: { b: 2, skip: undefined },
			})
			.json<{ ok: boolean }>()
		expect(result).toEqual({ ok: true })
		expect(seen.url).toBe('/v2/things/search?a=1&b=2')
		expect(seen.body).toBe('{"x":1}')
		expect(seen.ct).toBe('application/json')
	})

	test('.json() on an empty body resolves to an empty string (got semantics)', async () => {
		const base = await startServer((_, res) => {
			res.statusCode = 204
			res.end()
		})
		const client = createHttpClient({ prefixUrl: base })
		expect(await client.post('x').json()).toBe('')
	})

	test('custom parseJson is used', async () => {
		const base = await startServer((_, res) => res.end('{"n":1}'))
		const client = createHttpClient({ prefixUrl: base })
		const out = await client
			.get('x', { parseJson: (t) => ({ raw: t }) })
			.json<{ raw: string }>()
		expect(out.raw).toBe('{"n":1}')
	})

	test('non-2xx throws HTTPError with got-compatible shape', async () => {
		const base = await startServer((_, res) => {
			res.statusCode = 404
			res.setHeader('content-type', 'application/problem+json')
			res.end('{"title":"NOT_FOUND"}')
		})
		const client = createHttpClient({ prefixUrl: base })
		const err = await client
			.get('missing')
			.json()
			.catch((e) => e)
		expect(err).toBeInstanceOf(HTTPError)
		expect(err.code).toBe('ERR_NON_2XX_3XX_RESPONSE')
		expect(err.message).toBe('Response code 404 (Not Found)')
		expect(err.response.statusCode).toBe(404)
		expect(err.response.body).toBe('{"title":"NOT_FOUND"}')
		expect(err.response.headers['content-type']).toBe(
			'application/problem+json'
		)
		expect(err.options.method).toBe('GET')
		expect(err.request.options.url.href).toBe(`${base}/missing`)
	})

	test('throwHttpErrors: false resolves with the response', async () => {
		const base = await startServer((_, res) => {
			res.statusCode = 500
			res.end('boom')
		})
		const client = createHttpClient({ prefixUrl: base })
		const res = await client.get('x', {
			throwHttpErrors: false,
			retry: { limit: 0 },
		})
		expect(res.statusCode).toBe(500)
		expect(res.body).toBe('boom')
	})

	test('throwHttpErrors: false still retries retriable statuses, then resolves with the final response', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			res.statusCode = 503
			res.setHeader('retry-after', '0')
			res.end(`attempt ${calls}`)
		})
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 2,
				methods: ['GET'],
				statusCodes: [503],
				calculateDelay: ({ computedValue }) => (computedValue ? 1 : 0),
			},
		})
		const res = await client.get('x', { throwHttpErrors: false })
		expect(calls).toBe(3) // initial + 2 retries
		expect(res.statusCode).toBe(503)
		expect(res.body).toBe('attempt 3')
	})

	test('retries configured status codes, honouring Retry-After, and calls beforeRetry', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			if (calls < 3) {
				res.statusCode = 503
				res.setHeader('retry-after', '0')
				return res.end()
			}
			res.end('{"done":true}')
		})
		const retries: number[] = []
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 3,
				methods: ['POST'],
				statusCodes: [503],
				calculateDelay: ({ computedValue }) => (computedValue ? 1 : 0),
			},
			hooks: { beforeRetry: [(_o, _e, n) => void retries.push(n!)] },
		})
		expect(await client.post('x').json()).toEqual({ done: true })
		expect(calls).toBe(3)
		expect(retries).toEqual([1, 2])
	})

	test('a throwing beforeRetry hook stops retrying', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			res.statusCode = 429
			res.setHeader('retry-after', '0')
			res.end()
		})
		const client = createHttpClient({
			prefixUrl: base,
			retry: { limit: 5, methods: ['GET'], statusCodes: [429] },
			hooks: {
				beforeRetry: [
					() => {
						throw new Error('stop')
					},
				],
			},
		})
		await expect(client.get('x')).rejects.toThrow('stop')
		expect(calls).toBe(1)
	})

	test('network errors are RequestErrors with a code, retried, and passed through beforeError', async () => {
		const port = await closedPort()
		let attempts = 0
		const client = createHttpClient({
			prefixUrl: `http://127.0.0.1:${port}`,
			context: { marker: 'ctx' },
			retry: {
				limit: 2,
				methods: ['POST'],
				calculateDelay: ({ computedValue }) => {
					attempts++
					return computedValue ? 1 : 0
				},
			},
			hooks: {
				beforeError: [
					(e) => {
						e.message = `wrapped: ${e.message}`
						return e
					},
				],
			},
		})
		const err = await client
			.post('x', { json: {} })
			.json()
			.catch((e) => e)
		expect(err).toBeInstanceOf(RequestError)
		expect(err.code).toBe('ECONNREFUSED')
		expect(err.message).toMatch(/^wrapped: /)
		expect(err.options.context.marker).toBe('ctx')
		expect(attempts).toBe(3) // 2 retries + final decision
	})

	test('beforeRequest hooks (middleware) see method, URL and serialised body and can mutate headers', async () => {
		let auth: string | undefined
		const base = await startServer((req, res) => {
			auth = req.headers['x-mw']
			res.end('ok')
		})
		const seen: { method?: string; path?: string; body?: unknown } = {}
		const client = createHttpClient({
			prefixUrl: base,
			hooks: {
				beforeRequest: [
					(options) => {
						seen.method = options.method
						seen.path = options.url.pathname
						seen.body = options.body
						options.headers['x-mw'] = 'yes'
					},
				],
			},
		})
		await client.put('a/b', { json: { y: 2 } }).text()
		expect(seen).toEqual({ method: 'PUT', path: '/a/b', body: '{"y":2}' })
		expect(auth).toBe('yes')
	})

	test('beforeRequest middleware runs on every retry attempt (not just the first)', async () => {
		let calls = 0
		const seenNonces: string[] = []
		const base = await startServer((req, res) => {
			calls++
			seenNonces.push(req.headers['x-nonce'] as string)
			if (calls < 3) {
				res.statusCode = 503
				res.setHeader('retry-after', '0')
				return res.end()
			}
			res.end('ok')
		})
		let nonce = 0
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 3,
				methods: ['GET'],
				statusCodes: [503],
				calculateDelay: ({ computedValue }) => (computedValue ? 1 : 0),
			},
			hooks: {
				beforeRequest: [
					(options) => {
						options.headers['x-nonce'] = String(++nonce)
					},
				],
			},
		})
		expect(await client.get('x').text()).toBe('ok')
		// A fresh nonce per attempt proves the hook ran on each retry.
		expect(seenNonces).toEqual(['1', '2', '3'])
	})

	test('ordinary errors thrown by hooks are surfaced through beforeError without masking', async () => {
		const base = await startServer((_, res) => res.end('ok'))
		const seen: unknown[] = []
		const client = createHttpClient({
			prefixUrl: base,
			retry: { limit: 0 },
			hooks: {
				beforeRequest: [
					() => {
						throw new Error('hook boom')
					},
				],
				beforeError: [
					(e) => {
						// This would throw a TypeError if `e` were a plain Error
						// without `.options` (the regressed behaviour).
						seen.push(e.options.method)
						e.message = `wrapped: ${e.message}`
						return e
					},
				],
			},
		})
		const err = await client.get('x').catch((e) => e)
		expect(err).toBeInstanceOf(RequestError)
		expect(err.message).toBe('wrapped: hook boom')
		expect(seen).toEqual(['GET'])
	})

	test('cancel() aborts an in-flight request with CancelError', async () => {
		const base = await startServer(() => {
			/* never respond */
		})
		const client = createHttpClient({ prefixUrl: base })
		const req = client.get('slow')
		setTimeout(() => req.cancel('bye'), 50)
		const err = await req.catch((e) => e)
		expect(err).toBeInstanceOf(CancelError)
		expect(req.isCanceled).toBe(true)
	})

	test('timeout.request rejects with TimeoutError (ETIMEDOUT)', async () => {
		const base = await startServer(() => {
			/* never respond */
		})
		const client = createHttpClient({
			prefixUrl: base,
			timeout: { request: 100 },
			retry: { limit: 0 },
		})
		const err = await client.get('slow').catch((e) => e)
		expect(err).toBeInstanceOf(TimeoutError)
		expect(err.code).toBe('ETIMEDOUT')
	})

	test('set-cookie is exposed as an array; basic auth via username/password', async () => {
		let authz: string | undefined
		const base = await startServer((req, res) => {
			authz = req.headers.authorization
			res.setHeader('set-cookie', ['a=1; Path=/', 'b=2; Path=/'])
			res.end()
		})
		const client = createHttpClient({ prefixUrl: base })
		const res = await client.post('login', { username: 'u', password: 'p' })
		expect(res.headers['set-cookie']).toEqual(['a=1; Path=/', 'b=2; Path=/'])
		expect(authz).toBe(`Basic ${Buffer.from('u:p').toString('base64')}`)
	})

	test('FormData bodies are sent as multipart with a boundary, overriding a JSON content-type', async () => {
		let ct: string | undefined
		let body = ''
		const base = await startServer(async (req, res) => {
			ct = req.headers['content-type']
			body = await readBody(req)
			res.end('{}')
		})
		const client = createHttpClient({
			prefixUrl: base,
			headers: { 'content-type': 'application/json' },
		})
		const fd = new FormData()
		fd.append('resources', new Blob(['<xml/>']), 'test.bpmn')
		fd.append('tenantId', '<default>')
		await client.post('deployments', { body: fd }).json()
		expect(ct).toMatch(/^multipart\/form-data; boundary=/)
		expect(body).toContain('filename="test.bpmn"')
		expect(body).toContain('<xml/>')
		expect(body).toContain('<default>')
	})

	test('async calculateDelay is awaited: a Promise<0> stops retrying (not treated as truthy)', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			res.statusCode = 500
			res.end('boom')
		})
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 5,
				methods: ['GET'],
				statusCodes: [500],
				// Returns a resolved Promise<0>. If the result is not awaited, the
				// Promise is truthy and retries proceed; awaited, 0 stops them.
				calculateDelay: async () => 0,
			},
		})
		const err = await client
			.get('x', { throwHttpErrors: false })
			.catch((e) => e)
		expect(calls).toBe(1)
		expect(err.statusCode ?? err.response?.statusCode).toBe(500)
	})

	test('async calculateDelay returning a positive delay is honoured and retries proceed', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			if (calls < 3) {
				res.statusCode = 503
				res.setHeader('retry-after', '0')
				return res.end()
			}
			res.end('ok')
		})
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 3,
				methods: ['GET'],
				statusCodes: [503],
				calculateDelay: async ({ computedValue }) => (computedValue ? 1 : 0),
			},
		})
		expect(await client.get('x').text()).toBe('ok')
		expect(calls).toBe(3)
	})

	test('maxRetryAfter defaults to the request timeout: a huge Retry-After stops retrying', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			res.statusCode = 503
			// One hour: far beyond the request timeout. With no maxRetryAfter cap
			// this would sleep for an hour; capped at the timeout it stops instead.
			res.setHeader('retry-after', '3600')
			res.end()
		})
		const client = createHttpClient({
			prefixUrl: base,
			timeout: { request: 500 },
			retry: { limit: 5, methods: ['GET'], statusCodes: [503] },
		})
		const err = await client
			.get('x', { throwHttpErrors: false })
			.catch((e) => e)
		expect(calls).toBe(1)
		expect(err.statusCode ?? err.response?.statusCode).toBe(503)
	})

	test('a throwing handler is enriched through beforeError like hook failures', async () => {
		const base = await startServer((_, res) => res.end('ok'))
		const seen: unknown[] = []
		const client = createHttpClient({
			prefixUrl: base,
			handlers: [
				() => {
					throw new Error('handler boom')
				},
			],
			hooks: {
				beforeError: [
					(e) => {
						// Would throw a TypeError if the handler error bypassed
						// wrapping and arrived as a plain Error without `.options`.
						seen.push(e.options.method)
						e.message = `wrapped: ${e.message}`
						return e
					},
				],
			},
		})
		const err = await client.get('x').catch((e) => e)
		expect(err).toBeInstanceOf(RequestError)
		expect(err.message).toBe('wrapped: handler boom')
		expect(seen).toEqual(['GET'])
	})

	test('mergeOptions preserves repeated override query params and replaces matching base keys', () => {
		const merged = mergeOptions(
			{ searchParams: new URLSearchParams('tag=base&keep=1') },
			{ searchParams: new URLSearchParams('tag=a&tag=b') }
		)
		const sp = merged.searchParams as URLSearchParams
		expect(sp.getAll('tag')).toEqual(['a', 'b'])
		expect(sp.get('keep')).toBe('1')
	})

	test('repeated query params survive URL normalization onto the wire', async () => {
		let seen: string | undefined
		const base = await startServer((req, res) => {
			seen = req.url
			res.end('ok')
		})
		// Repeated option params keep every value, and option keys replace
		// same-named keys already present in the request URL.
		const client = createHttpClient({ prefixUrl: base })
		await client
			.get('x?tag=url&keep=1', {
				searchParams: new URLSearchParams('tag=a&tag=b'),
			})
			.text()
		expect(seen).toBe('/x?keep=1&tag=a&tag=b')
	})

	test('afterResponse hook that recovers a 500 into a 2xx suppresses the HTTPError', async () => {
		const base = await startServer((_, res) => {
			res.statusCode = 500
			res.end('boom')
		})
		const client = createHttpClient({
			prefixUrl: base,
			retry: { limit: 0 },
			hooks: {
				afterResponse: [
					(response) => ({
						...response,
						statusCode: 200,
						statusMessage: 'OK',
						ok: true,
						body: 'recovered',
					}),
				],
			},
		})
		// The final status is evaluated from the hook's response, not the
		// original fetch status, so no HTTPError is thrown.
		expect(await client.get('x').text()).toBe('recovered')
	})

	test('afterResponse hook that downgrades a 200 into a 500 raises an HTTPError', async () => {
		const base = await startServer((_, res) => res.end('ok'))
		const client = createHttpClient({
			prefixUrl: base,
			retry: { limit: 0 },
			hooks: {
				afterResponse: [
					(response) => ({
						...response,
						statusCode: 500,
						statusMessage: 'Internal Server Error',
						ok: false,
					}),
				],
			},
		})
		const err = await client
			.get('x')
			.text()
			.catch((e) => e)
		expect(err).toBeInstanceOf(HTTPError)
		expect(err.response.statusCode).toBe(500)
	})

	test('a final 3xx response is not treated as success', async () => {
		const base = await startServer((_, res) => res.end('ok'))
		const client = createHttpClient({
			prefixUrl: base,
			retry: { limit: 0 },
			hooks: {
				// Rewrite the final response to a 3xx status, mirroring got's
				// semantics where only 2xx and 304 are successful.
				afterResponse: [
					(response) => ({
						...response,
						statusCode: 305,
						statusMessage: 'Use Proxy',
						ok: false,
					}),
				],
			},
		})
		const err = await client
			.get('x', { throwHttpErrors: true })
			.text()
			.catch((e) => e)
		expect(err).toBeInstanceOf(HTTPError)
		expect(err.response.statusCode).toBe(305)
	})

	test('a 304 response is treated as successful', async () => {
		const base = await startServer((_, res) => {
			res.statusCode = 304
			res.end()
		})
		const client = createHttpClient({ prefixUrl: base, retry: { limit: 0 } })
		const res = await client.get('x')
		expect(res.statusCode).toBe(304)
	})

	test('a malformed Retry-After date falls back to exponential backoff instead of stopping', async () => {
		let calls = 0
		const base = await startServer((_, res) => {
			calls++
			if (calls < 2) {
				res.statusCode = 503
				// An unparseable HTTP-date: Date.parse -> NaN. A NaN delay would
				// silently stop retrying; it must fall back to backoff instead.
				res.setHeader('retry-after', 'not-a-date')
				return res.end()
			}
			res.end('ok')
		})
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 3,
				methods: ['GET'],
				statusCodes: [503],
				// Collapse the backoff to 1ms so the test stays fast while still
				// proving a positive (non-NaN) delay was computed.
				calculateDelay: ({ computedValue }) =>
					computedValue && !Number.isNaN(computedValue) ? 1 : 0,
			},
		})
		expect(await client.get('x').text()).toBe('ok')
		expect(calls).toBe(2)
	})

	test('an exception thrown by a user calculateDelay propagates through beforeError', async () => {
		const base = await startServer((_, res) => {
			res.statusCode = 500
			res.end('boom')
		})
		const seen: unknown[] = []
		const client = createHttpClient({
			prefixUrl: base,
			retry: {
				limit: 3,
				methods: ['GET'],
				statusCodes: [500],
				calculateDelay: () => {
					throw new Error('calculateDelay boom')
				},
			},
			hooks: {
				beforeError: [
					(e) => {
						// Would throw a TypeError if the calculateDelay error bypassed
						// wrapping and arrived without `.options`.
						seen.push(e.options.method)
						return e
					},
				],
			},
		})
		const err = await client
			.get('x', { throwHttpErrors: false })
			.catch((e) => e)
		expect(err).toBeInstanceOf(RequestError)
		expect(err.message).toContain('calculateDelay boom')
		expect(seen).toEqual(['GET'])
	})
})

describe('HttpClient TLS', () => {
	const certFile = path.join(__dirname, 'localhost.crt')
	const keyFile = path.join(__dirname, 'localhost.key')
	const cert = fs.readFileSync(certFile)
	const key = fs.readFileSync(keyFile)

	test('custom certificateAuthority is honoured (undici dispatcher)', async () => {
		const port = await listen(
			https.createServer({ cert, key }, (_, res) => res.end('secure'))
		)
		const trusted = createHttpClient({
			prefixUrl: `https://localhost:${port}`,
			https: { certificateAuthority: cert },
		})
		expect(await trusted.get('x').text()).toBe('secure')

		const untrusted = createHttpClient({
			prefixUrl: `https://localhost:${port}`,
			retry: { limit: 0 },
		})
		const err = await untrusted
			.get('x')
			.text()
			.catch((e) => e)
		expect(err).toBeInstanceOf(RequestError)
		expect(err.code).toBe('DEPTH_ZERO_SELF_SIGNED_CERT')
	})

	test('mTLS: client certificate and key are presented to the server', async () => {
		const port = await listen(
			https.createServer(
				{ cert, key, ca: cert, requestCert: true, rejectUnauthorized: true },
				(req, res) => {
					const peer = (
						req.socket as import('node:tls').TLSSocket
					).getPeerCertificate()
					res.end(peer?.subject?.CN ?? 'none')
				}
			)
		)
		const withClientCert = createHttpClient({
			prefixUrl: `https://localhost:${port}`,
			https: { certificateAuthority: cert, certificate: cert, key },
		})
		expect(await withClientCert.get('x').text()).toBe('localhost')

		// `cert` alias (as passed by OAuthProvider) works too
		const withAlias = createHttpClient({
			prefixUrl: `https://localhost:${port}`,
			https: { certificateAuthority: cert, cert, key },
		})
		expect(await withAlias.get('x').text()).toBe('localhost')

		const withoutClientCert = createHttpClient({
			prefixUrl: `https://localhost:${port}`,
			https: { certificateAuthority: cert },
			retry: { limit: 0 },
		})
		await expect(withoutClientCert.get('x').text()).rejects.toBeInstanceOf(
			RequestError
		)
	})
})

/**
 * Behaviour that got 11 had and the SDK's public contract relies on. These
 * guard the class of "the transport silently differs from got" regressions,
 * not just one call site.
 */
describe('HttpClient got 11 behavioural parity', () => {
	/** Bind a server on the first free port from the fetch-spec "bad ports" list. */
	async function listenOnFetchBadPort(handler: Handler) {
		// https://fetch.spec.whatwg.org/#port-blocking (unprivileged entries)
		const candidates = [6000, 6566, 6665, 6666, 6667, 6668, 6669, 6697, 10080]
		for (const port of candidates) {
			const server = http.createServer(handler)
			const ok = await new Promise<boolean>((resolve) => {
				server.once('error', () => resolve(false))
				server.listen(port, '127.0.0.1', () => resolve(true))
			})
			if (ok) {
				servers.push(server)
				return port
			}
		}
		throw new Error('no fetch bad port available to bind')
	}

	test('requests to fetch-spec "bad ports" are not refused', async () => {
		const port = await listenOnFetchBadPort((_, res) => res.end('reached'))
		const client = createHttpClient({
			prefixUrl: `http://127.0.0.1:${port}`,
			retry: { limit: 0 },
		})
		expect(await client.get('x').text()).toBe('reached')
	})

	test('redirects are followed, and 303 turns a POST into a GET', async () => {
		const seen: string[] = []
		const base = await startServer((req, res) => {
			seen.push(`${req.method} ${req.url}`)
			if (req.url === '/a') {
				res.writeHead(302, { location: '/b' }).end()
			} else if (req.url === '/post') {
				res.writeHead(303, { location: '/b' }).end()
			} else {
				res.end(`at ${req.url}`)
			}
		})
		const client = createHttpClient({ prefixUrl: base, retry: { limit: 0 } })
		expect(await client.get('a').text()).toBe('at /b')
		expect(await client.post('post', { json: { x: 1 } }).text()).toBe('at /b')
		expect(seen).toEqual(['GET /a', 'GET /b', 'POST /post', 'GET /b'])
	})

	test('a beforeRequest hook can short-circuit by returning a response (got 11 contract)', async () => {
		const port = await closedPort()
		const client = createHttpClient({
			prefixUrl: `http://127.0.0.1:${port}`,
			retry: { limit: 0 },
			hooks: {
				beforeRequest: [
					() =>
						({
							statusCode: 200,
							headers: { 'content-type': 'application/json' },
							body: '{"cached":true}',
						}) as never,
				],
			},
		})
		expect(await client.get('x').json()).toEqual({ cached: true })
	})

	test('a short-circuit response with an error status still raises HTTPError', async () => {
		const port = await closedPort()
		const client = createHttpClient({
			prefixUrl: `http://127.0.0.1:${port}`,
			retry: { limit: 0 },
			hooks: {
				beforeRequest: [() => ({ statusCode: 418, body: 'teapot' }) as never],
			},
		})
		const err = await client
			.get('x')
			.text()
			.catch((e) => e)
		expect(err).toBeInstanceOf(HTTPError)
		expect(err.response.statusCode).toBe(418)
	})
})

describe('HttpClient dispatcher isolation', () => {
	// Node's bundled undici owns the process-global dispatcher, and its
	// version differs per Node release (6.x on Node 22, 7.x on Node 24).
	// Composing this package's interceptors onto it fails with
	// UND_ERR_INVALID_ARG ("invalid onError method") on mismatched versions,
	// so the client must never route through the global dispatcher.
	const GLOBAL_DISPATCHER = Symbol.for('undici.globalDispatcher.1')
	const globals = globalThis as unknown as Record<symbol, unknown>
	let saved: unknown
	afterEach(() => {
		globals[GLOBAL_DISPATCHER] = saved
	})

	test('requests do not depend on the process-global undici dispatcher', async () => {
		const base = await startServer((_, res) => res.end('ok'))
		saved = globals[GLOBAL_DISPATCHER]
		const foreign = {
			dispatch() {
				throw new Error('global dispatcher must not be used')
			},
			compose() {
				throw new Error('global dispatcher must not be used')
			},
		}
		globals[GLOBAL_DISPATCHER] = foreign
		const client = createHttpClient({ prefixUrl: base, retry: { limit: 0 } })
		expect(await client.get('x').text()).toBe('ok')
	})
})
