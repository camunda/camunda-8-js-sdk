/**
 * Socket tap: records the raw bytes on every outgoing TCP/TLS client socket, so
 * a test that fails with an HTTP parse error can show what was on the wire.
 *
 * Why this exists: `deleteDocument.spec.ts` fails intermittently in CI with
 * `Parse Error: Invalid header token` (HPE_INVALID_HEADER_TOKEN), see #562.
 * Every CI failure so far has recorded the symptom and none of the evidence.
 * This tap keeps a per-socket transcript (bytes written and received, in
 * order) which `describe()` renders with control characters escaped, so the
 * offending bytes are visible in the log.
 *
 * How: it subscribes to the `net.client.socket` diagnostics channel, which
 * fires for TLS sockets too, for both undici and node:http(s), on Node 22 and
 * 24. It wraps the socket's stream-level writers and adds a `data` listener; it
 * never changes what the HTTP client reads or writes. `stop()` undoes all of
 * that on every socket it touched, because keep-alive sockets outlive the test.
 *
 * Safety: transcripts end up in public CI logs, so `describe()` redacts
 * credentials (auth headers and cookies; OAuth secrets and tokens in bodies).
 */
import diagnosticsChannel from 'node:diagnostics_channel'
import net from 'node:net'

type Chunk = { at: number; dir: '>>' | '<<'; data: Buffer; length: number }
type Transcript = { id: number; remote: string; chunks: Chunk[] }

/**
 * Each chunk keeps its first MAX_BYTES_PER_CHUNK bytes, which always covers
 * the status line and headers, where parse errors occur. A per-socket byte
 * budget would not do: an upload and a download on one keep-alive socket can
 * exhaust it before the response that fails.
 */
const MAX_BYTES_PER_CHUNK = 16 * 1024
const MAX_CHUNKS_PER_SOCKET = 2000

/** Header lines whose values must never be logged. */
const SECRET_HEADER =
	/^((?:authorization|proxy-authorization|cookie|set-cookie|x-api-key)\s*:\s*)[^\r\n]*/gim
/** Credential fields in JSON or form-encoded bodies (OAuth requests/responses). */
const SECRET_FIELD =
	/((?:^|[?&{,\s"])(?:client_secret|client_id|access_token|refresh_token|id_token|password|assertion)"?\s*[:=]\s*"?)[^"&,}\s]+/gim

export function redact(text: string): string {
	return text
		.replace(SECRET_HEADER, '$1[redacted]')
		.replace(SECRET_FIELD, '$1[redacted]')
}

export function createSocketTap(
	filter: (port: number) => boolean = () => true
) {
	const transcripts: Transcript[] = []
	const cleanups: Array<() => void> = []
	let nextId = 1
	let stopped = false
	const start = Date.now()

	const onSocket = (message: unknown) => {
		if (stopped) return
		const socket = (message as { socket: net.Socket }).socket
		const transcript: Transcript = { id: nextId++, remote: '?', chunks: [] }
		const record = (dir: Chunk['dir'], data: unknown) => {
			if (transcript.chunks.length >= MAX_CHUNKS_PER_SOCKET) return
			const buf = Buffer.isBuffer(data)
				? data
				: Buffer.from(String(data), 'latin1')
			transcript.chunks.push({
				at: Date.now() - start,
				dir,
				// Copy: the client may reuse the buffer after the write completes.
				data: Buffer.from(buf.subarray(0, MAX_BYTES_PER_CHUNK)),
				length: buf.length,
			})
		}

		// Hook the stream-level writers rather than write(): the HTTP client may
		// cork the socket and flush through _writev, bypassing write() entirely.
		type Writer = (...a: unknown[]) => unknown
		const s = socket as unknown as { _write: Writer; _writev?: Writer }
		const ownWrite = Object.prototype.hasOwnProperty.call(s, '_write')
		const ownWritev = Object.prototype.hasOwnProperty.call(s, '_writev')
		const _write = s._write
		const _writev = s._writev
		s._write = function (this: unknown, ...args: unknown[]) {
			record('>>', args[0])
			return _write.apply(this, args)
		}
		if (_writev) {
			s._writev = function (this: unknown, ...args: unknown[]) {
				for (const { chunk } of args[0] as { chunk: unknown }[])
					record('>>', chunk)
				return _writev.apply(this, args)
			}
		}
		const onData = (d: Buffer) => record('<<', d)
		const onConnect = () => {
			if (!filter(socket.remotePort ?? -1)) return
			transcript.remote = `${socket.remoteAddress}:${socket.remotePort}`
			transcripts.push(transcript)
		}
		socket.on('data', onData)
		// TLS sockets emit 'secureConnect' after 'connect'; 'connect' is enough
		// to learn the remote address for both.
		socket.once('connect', onConnect)

		cleanups.push(() => {
			// Restore the writers exactly: delete our own-property wrapper if the
			// original came from the prototype, otherwise put the original back.
			if (ownWrite) s._write = _write
			else delete (s as Partial<typeof s>)._write
			if (_writev) {
				if (ownWritev) s._writev = _writev
				else delete (s as Partial<typeof s>)._writev
			}
			socket.off('data', onData)
			socket.off('connect', onConnect)
		})
	}

	diagnosticsChannel.subscribe('net.client.socket', onSocket)

	return {
		/** Stop recording and remove every hook from every socket seen. */
		stop: () => {
			if (stopped) return
			stopped = true
			diagnosticsChannel.unsubscribe('net.client.socket', onSocket)
			for (const cleanup of cleanups.splice(0)) cleanup()
		},
		/**
		 * Render every recorded socket, escaping CR/LF and non-printables.
		 * Each chunk shows its full header block (everything up to the first
		 * blank line, or the whole kept chunk if there is none) and at most
		 * `maxBodyChars` of what follows, so the malformed bytes are never cut.
		 */
		describe: (maxBodyChars = 600) =>
			transcripts
				.map(
					(t) =>
						`socket #${t.id} ${t.remote}\n` +
						t.chunks
							.map((c) => {
								const text = c.data.toString('latin1')
								const end = text.indexOf('\r\n\r\n')
								const keep =
									end === -1 && /^HTTP\/|^[A-Z]+ \S+ HTTP\//.test(text)
										? text.length // headers without an end: show them all
										: end === -1
											? maxBodyChars
											: end + 4 + maxBodyChars
								const shown = redact(text.slice(0, keep))
								const note =
									c.length > shown.length
										? ` (showing ${shown.length} of ${c.length}B)`
										: ''
								return `  +${c.at}ms ${c.dir} ${
									c.length
								}B${note} ${JSON.stringify(shown)}`
							})
							.join('\n')
				)
				.join('\n'),
	}
}

type ErrorLike = {
	name?: unknown
	code?: unknown
	data?: unknown
	cause?: unknown
}

/** The first HTTP parse error in `e`'s cause chain, if any. */
function findParseError(e: unknown): ErrorLike | undefined {
	let err = e as ErrorLike | undefined
	for (let i = 0; i < 6 && err; i++) {
		// node:http (and got) report llhttp errors as code HPE_*. undici throws
		// an HTTPParserError whose code is often unset, so match the name too.
		if (/^HPE_/.test(String(err.code ?? '')) || err.name === 'HTTPParserError')
			return err
		err = err.cause as ErrorLike | undefined
	}
	return undefined
}

/**
 * True for llhttp parse errors, the case the tap is for. Through the SDK's
 * HttpClient these arrive as a RequestError (code ERR_GOT_REQUEST_ERROR) with
 * undici's HTTPParserError as its cause, so the cause chain is searched.
 */
export function isHttpParseError(e: unknown): boolean {
	return findParseError(e) !== undefined
}

/**
 * The unparsed bytes undici attaches to an HTTPParserError: the response from
 * the point where parsing failed. Escaped so control characters are visible.
 */
export function parseErrorData(e: unknown): string | undefined {
	const data = findParseError(e)?.data
	return data === undefined ? undefined : JSON.stringify(redact(String(data)))
}
