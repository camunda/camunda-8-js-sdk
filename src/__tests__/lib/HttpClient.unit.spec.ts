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
