import http from 'node:http'

import got, { RequestError } from 'got'
import { afterEach, expect, test } from 'vitest'

import { GotRequestFunction } from '../../lib/GotHooks'

/**
 * On Node.js >= 24.20, got 11 retrying a connection error (e.g. ECONNREFUSED)
 * rejected with a raw ERR_SOCKET_CLOSED_BEFORE_CONNECTION error that had no
 * request context, then crashed the process with an uncaught
 * "The `onCancel` handler was attached after the promise settled" when the
 * retry timer fired. GotRequestFunction works around it; see its JSDoc.
 */

const uncaught: Error[] = []
const onUncaught = (e: Error) => uncaught.push(e)
process.on('uncaughtException', onUncaught)
afterEach(() => {
	process.off('uncaughtException', onUncaught)
})

test('retries connection errors and rejects with the real, enriched error', async () => {
	let error: unknown
	try {
		await got.post('http://127.0.0.1:9/', {
			json: {},
			request: GotRequestFunction,
			retry: {
				limit: 2,
				methods: ['POST'],
				calculateDelay: ({ computedValue }) => (computedValue ? 10 : 0),
			},
		})
	} catch (e) {
		error = e
	}
	expect(error).toBeInstanceOf(RequestError)
	const e = error as RequestError
	expect(e.code).toBe('ECONNREFUSED')
	expect(e.options).toBeDefined()
	expect(e.request?.retryCount).toBe(2)
	// Give any stray retry timer the chance to fire and crash
	await new Promise((r) => setTimeout(r, 100))
	expect(uncaught).toEqual([])
})

test('sends requests and bodies normally', async () => {
	const server = http
		.createServer((req, res) => {
			let body = ''
			req.on('data', (d) => (body += d))
			req.on('end', () => res.end(JSON.stringify({ echo: body })))
		})
		.listen(0)
	await new Promise((r) => server.once('listening', r))
	const { port } = server.address() as { port: number }
	try {
		const res = await got
			.post(`http://127.0.0.1:${port}/`, {
				json: { a: 1 },
				request: GotRequestFunction,
			})
			.json<{ echo: string }>()
		expect(res).toEqual({ echo: '{"a":1}' })
	} finally {
		server.close()
	}
})
