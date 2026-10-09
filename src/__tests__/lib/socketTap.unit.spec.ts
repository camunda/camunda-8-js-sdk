import net from 'node:net'

import { afterEach, expect, test } from 'vitest'

import { createHttpClient } from '../../lib/HttpClient'
import {
	createSocketTap,
	isHttpParseError,
	parseErrorData,
	redact,
} from '../../test-support/socketTap'

/**
 * The tap exists to explain an intermittent HPE_INVALID_HEADER_TOKEN from the
 * document API (#562). These tests drive the SDK's real HTTP client (undici)
 * against a raw TCP server that answers one request normally, then sends a
 * response with an illegal header name on the same keep-alive socket.
 */
const BAD_HEADER = 'X-Bad\u0001Header: 1'

const servers: Array<{ server: net.Server; sockets: Set<net.Socket> }> = []
const taps: Array<ReturnType<typeof createSocketTap>> = []
afterEach(async () => {
	taps.splice(0).forEach((t) => t.stop())
	await Promise.all(
		servers.splice(0).map(({ server, sockets }) => {
			// Destroy keep-alive connections first, or close() waits for them.
			sockets.forEach((s) => s.destroy())
			return new Promise((r) => server.close(() => r(null)))
		})
	)
})

/** Answers requests whose path contains "bad" with an illegal header name. */
async function rawServer() {
	const sockets = new Set<net.Socket>()
	const server = net.createServer((socket) => {
		sockets.add(socket)
		socket.on('close', () => sockets.delete(socket))
		let buffered = ''
		socket.on('data', (d) => {
			buffered += d.toString('latin1')
			// Answer once the full request (headers + Content-Length body) is in.
			const end = buffered.indexOf('\r\n\r\n')
			if (end === -1) return
			const len = Number(/content-length:\s*(\d+)/i.exec(buffered)?.[1] ?? 0)
			if (buffered.length < end + 4 + len) return
			const requestLine = buffered.slice(0, buffered.indexOf('\r\n'))
			buffered = buffered.slice(end + 4 + len)
			socket.write(
				requestLine.includes('bad')
					? `HTTP/1.1 200 OK\r\n${BAD_HEADER}\r\nContent-Length: 2\r\n\r\nok`
					: 'HTTP/1.1 200 OK\r\nContent-Length: 5\r\n\r\nhello'
			)
		})
	})
	servers.push({ server, sockets })
	await new Promise<void>((r) => server.listen(0, '127.0.0.1', () => r()))
	return `http://127.0.0.1:${(server.address() as net.AddressInfo).port}`
}

test('shows the malformed response bytes after a large upload on the same socket', async () => {
	// 100 KB goes out before the bad response comes back on the same socket:
	// with the old per-socket 64 KB budget, the response was never recorded.
	const base = await rawServer()
	const tap = createSocketTap()
	taps.push(tap)
	const client = createHttpClient({ prefixUrl: base, retry: { limit: 0 } })

	const err = await client
		.post('upload-bad', {
			body: 'a'.repeat(100 * 1024),
			headers: { authorization: 'Bearer secret-token-123' },
		})
		.text()
		.then(
			() => undefined,
			(e: unknown) => e
		)

	const parseError = (err as { cause?: { name?: string } })?.cause
	expect(parseError?.name).toBe('HTTPParserError')
	expect(isHttpParseError(err)).toBe(true)
	// undici hands us the bytes where parsing stopped; got never did.
	expect(parseErrorData(err)).toContain('\\u0001Header: 1')
	const transcript = tap.describe()
	expect(transcript.match(/^socket #/gm)).toHaveLength(1)
	expect(transcript).toContain(JSON.stringify(BAD_HEADER).slice(1, -1))
	expect(transcript).toContain('(showing 600 of 102400B)')
	expect(transcript).not.toContain('secret-token-123')
	expect(transcript).toContain('authorization: [redacted]')
})

test('stop() removes every hook from sockets it touched', async () => {
	const base = await rawServer()
	const tap = createSocketTap()
	taps.push(tap)
	let socket: net.Socket | undefined
	const client = createHttpClient({
		prefixUrl: base,
		retry: { limit: 0 },
	})
	const grab = (m: unknown) => (socket = (m as { socket: net.Socket }).socket)
	const dc = await import('node:diagnostics_channel')
	dc.subscribe('net.client.socket', grab)
	try {
		await client.get('first').text()
	} finally {
		dc.unsubscribe('net.client.socket', grab)
	}
	expect(socket).toBeDefined()
	const s = socket as net.Socket
	expect(Object.prototype.hasOwnProperty.call(s, '_write')).toBe(true)
	const dataListeners = s.listenerCount('data')

	tap.stop()

	expect(Object.prototype.hasOwnProperty.call(s, '_write')).toBe(false)
	expect(Object.prototype.hasOwnProperty.call(s, '_writev')).toBe(false)
	expect(s.listenerCount('data')).toBe(dataListeners - 1)
	// Nothing is recorded after stop, even on a new connection.
	const before = tap.describe()
	await createHttpClient({ prefixUrl: await rawServer(), retry: { limit: 0 } })
		.get('again')
		.text()
	expect(tap.describe()).toBe(before)
})

test('redact() hides credentials in headers and OAuth bodies', () => {
	const out = redact(
		[
			'POST /oauth/token HTTP/1.1',
			'Authorization: Basic abc',
			'Cookie: session=xyz',
			'',
			'grant_type=client_credentials&client_id=my-id&client_secret=s3cret&audience=zeebe',
			'{"access_token":"eyJhbGciOi.payload.sig","expires_in":300}',
		].join('\r\n')
	)
	expect(out).not.toMatch(/abc|xyz|my-id|s3cret|eyJhbGciOi/)
	expect(out).toContain('grant_type=client_credentials')
	expect(out).toContain('audience=zeebe')
	expect(out).toContain('"expires_in":300')
})
