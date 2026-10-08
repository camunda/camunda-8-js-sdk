/**
 * Socket tap: records the raw bytes on every outgoing TCP client socket, so a
 * test that fails with an HTTP parse error can show what was actually on the wire.
 *
 * Why this exists: `deleteDocument.spec.ts` fails intermittently in CI with
 * `Parse Error: Invalid header token` (HPE_INVALID_HEADER_TOKEN) — see #562.
 * Node's parser error carries `rawPacket` and `bytesParsed`, but got drops both
 * when it wraps it in a RequestError, so every CI failure so far has recorded the
 * symptom and none of the evidence. This tap keeps a per-socket transcript
 * (bytes written and bytes received, in order) which `describe()` renders with
 * control characters escaped, so the offending bytes are visible in the log.
 *
 * It observes only: it subscribes to the `net.client.socket` diagnostics
 * channel and adds listeners, it does not change what the HTTP client reads.
 */
import diagnosticsChannel from 'node:diagnostics_channel'
import net from 'node:net'

type Chunk = { at: number; dir: '>>' | '<<'; data: Buffer }
type Transcript = { id: number; remote: string; chunks: Chunk[] }

const MAX_BYTES_PER_SOCKET = 64 * 1024

export function createSocketTap(
	filter: (port: number) => boolean = () => true
) {
	const transcripts: Transcript[] = []
	let nextId = 1
	const start = Date.now()

	const onSocket = (message: unknown) => {
		const socket = (message as { socket: net.Socket }).socket
		const transcript: Transcript = { id: nextId++, remote: '?', chunks: [] }
		let size = 0
		const record = (dir: Chunk['dir'], data: unknown) => {
			if (size >= MAX_BYTES_PER_SOCKET) return
			const buf = Buffer.isBuffer(data) ? data : Buffer.from(String(data))
			size += buf.length
			transcript.chunks.push({ at: Date.now() - start, dir, data: buf })
		}
		// Hook the stream-level writers rather than write(): the HTTP client may
		// cork the socket and flush through _writev, bypassing write() entirely.
		type Writer = (...a: unknown[]) => unknown
		const s = socket as unknown as { _write: Writer; _writev: Writer }
		const _write = s._write
		s._write = function (this: unknown, ...args: unknown[]) {
			record('>>', args[0])
			return _write.apply(this, args)
		}
		const _writev = s._writev
		s._writev = function (this: unknown, ...args: unknown[]) {
			for (const { chunk } of args[0] as { chunk: unknown }[])
				record('>>', chunk)
			return _writev.apply(this, args)
		}
		socket.on('data', (d) => record('<<', d))
		socket.once('connect', () => {
			if (!filter(socket.remotePort ?? -1)) return
			transcript.remote = `${socket.remoteAddress}:${socket.remotePort}`
			transcripts.push(transcript)
		})
	}

	diagnosticsChannel.subscribe('net.client.socket', onSocket)

	return {
		stop: () => diagnosticsChannel.unsubscribe('net.client.socket', onSocket),
		/** Render every recorded socket, escaping CR/LF and non-printables. */
		describe: (maxBodyChars = 600) =>
			transcripts
				.map(
					(t) =>
						`socket #${t.id} ${t.remote}\n` +
						t.chunks
							.map(
								(c) =>
									`  +${c.at}ms ${c.dir} ${c.data.length}B ${JSON.stringify(
										c.data.toString('latin1').slice(0, maxBodyChars)
									)}`
							)
							.join('\n')
				)
				.join('\n'),
	}
}

/** True for Node's llhttp parse errors (HPE_*), the case the tap is for. */
export function isHttpParseError(e: unknown): boolean {
	return /^HPE_/.test(String((e as { code?: unknown })?.code ?? ''))
}
