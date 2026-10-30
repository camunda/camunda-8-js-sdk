import { Readable } from 'node:stream'

import type { ClientReadableStream } from '@grpc/grpc-js'

/**
 * A fake gRPC server-streaming call that implements the real stream surface.
 *
 * It is a real `stream.Readable` in object mode, as `ClientReadableStream` is,
 * rather than a bare `EventEmitter`. That matters: a bare emitter accepts any
 * sequence of events, including ones a real stream cannot produce, so tests
 * written against it prove nothing about the real behaviour. This fake
 * inherits the constraints of the real thing:
 *
 * - `error` is emitted with `destroy(err)`; with no `error` listener attached
 *   it is an uncaught exception, so a worker that forgets to listen fails
 *   loudly instead of passing silently.
 * - `end` is only emitted once the data has been consumed, which needs a
 *   `data` listener (flowing mode), and is followed by `close`.
 * - `error` is followed by `close`; nothing is emitted after `destroy()`.
 * - `cancel()` reports a client-side CANCELLED status as an `error` event, as
 *   grpc-js does. A worker that removes its `error` listener when it closes a
 *   stream would crash the process here.
 */
export class FakeGrpcStream extends Readable {
	cancelled = false

	constructor() {
		super({ objectMode: true, read: () => undefined })
	}

	/** Client side: cancel the call. */
	cancel() {
		this.cancelled = true
		if (!this.destroyed) {
			this.destroy(
				Object.assign(new Error('1 CANCELLED: Cancelled on client'), {
					code: 1,
				})
			)
		}
	}

	/** Server side: the call fails (for example UNAVAILABLE). */
	serverError(error: Error) {
		this.destroy(error)
	}

	/** Server side: the call completes normally. */
	serverEnd() {
		this.push(null)
	}

	/** Server side: send one message. */
	serverSend(item: unknown) {
		this.push(item)
	}
}

/** The fake, typed as the gRPC stream the SDK expects. */
export const asGrpcStream = <T = unknown>(
	stream: FakeGrpcStream
): ClientReadableStream<T> => stream as unknown as ClientReadableStream<T>

type OpenResult = FakeGrpcStream | { error: Error }
type PlannedOpen =
	| { kind: 'ok' }
	| { kind: 'resolve-error'; error: Error }
	| { kind: 'reject'; error: Error }
	| { kind: 'deferred'; deferred: Deferred<OpenResult> }

interface Deferred<T> {
	promise: Promise<T>
	resolve: (value: T) => void
}

/**
 * A fake transport: the thing that opens streams. `open` has the contract of
 * the SDK's gRPC client stream methods: it resolves to a stream, or to
 * `{ error }` when the stream cannot be opened (a rejection is also tolerated).
 */
export class FakeStreamTransport {
	opens = 0
	readonly streams: FakeGrpcStream[] = []
	private readonly plan: PlannedOpen[] = []

	/** The most recently opened stream. */
	get latest(): FakeGrpcStream {
		const stream = this.streams[this.streams.length - 1]
		if (!stream) {
			throw new Error('FakeStreamTransport: no stream has been opened')
		}
		return stream
	}

	/** The next open resolves to `{ error }`. */
	failNextOpen(error: Error) {
		this.plan.push({ kind: 'resolve-error', error })
	}

	/** The next open rejects. */
	rejectNextOpen(error: Error) {
		this.plan.push({ kind: 'reject', error })
	}

	/** The next open stays pending until the returned `resolve` is called. */
	deferNextOpen(): Deferred<OpenResult> {
		let resolve: (value: OpenResult) => void = () => undefined
		const promise = new Promise<OpenResult>((r) => {
			resolve = r
		})
		const deferred = { promise, resolve }
		this.plan.push({ kind: 'deferred', deferred })
		return deferred
	}

	/** Create a stream as a deferred open's result. */
	newStream(): FakeGrpcStream {
		const stream = new FakeGrpcStream()
		this.streams.push(stream)
		return stream
	}

	readonly open = async (): Promise<OpenResult> => {
		this.opens++
		const next = this.plan.shift() ?? { kind: 'ok' as const }
		if (next.kind === 'resolve-error') return { error: next.error }
		if (next.kind === 'reject') throw next.error
		if (next.kind === 'deferred') return next.deferred.promise
		return this.newStream()
	}
}
