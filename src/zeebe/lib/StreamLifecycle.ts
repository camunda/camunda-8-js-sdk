import type { ClientReadableStream } from '@grpc/grpc-js'

/**
 * Stream lifecycle adapter.
 *
 * A long-lived gRPC stream has four ways to stop delivering: it errors, the
 * server ends it, the connection hangs silently, or it cannot be opened. This
 * module exists so that none of them can go unobserved:
 *
 * - `attachStream` is the ONLY code in the SDK's stream workers that attaches
 *   listeners to a raw gRPC stream. Its handler contract, `StreamHandlers`,
 *   requires a handler for every event. Omitting `error` (the classic
 *   `stream.on('data', ...)` with a `console.error` on the side) does not
 *   compile. ESLint rules (see `.eslintrc.json`) forbid attaching listeners to
 *   a stream anywhere else in the stream modules.
 * - `StreamHandle` is the branded value that a streaming API returns. It has a
 *   failure channel: `state` (a discriminated union) and `done` (a promise of
 *   the terminal reason). An API whose return type is not a `StreamHandle`
 *   is not a streaming API as far as the conformance registry is concerned.
 *
 * The conformance registry in `src/__tests__/zeebe/conformance` derives the set
 * of streaming operations from the return types of `ZeebeGrpcClient`, so
 * adding a streaming method without registering it fails `tsc`.
 */

/** Why a stream stopped delivering. */
export type StreamFailure =
	/** The stream emitted an `error` event. */
	| { readonly kind: 'error'; readonly error: Error }
	/** The server ended or closed the stream without an error. */
	| { readonly kind: 'end' }
	/** The stream could not be opened. */
	| { readonly kind: 'open-failed'; readonly error: Error }

/** Why a handle reached its terminal `closed` state. */
export type StreamClosedReason =
	/** `close()` was called on the handle. */
	| { readonly kind: 'closed-by-caller' }
	/** The owning client was closed. */
	| { readonly kind: 'client-closed' }
	/**
	 * The stream failed and reconnection is disabled, so it will not be
	 * re-opened. Other work owned by the handle (for example `streamJobs`'
	 * sidecar poll) keeps running until `close()` is called.
	 */
	| { readonly kind: 'stream-failed'; readonly failure: StreamFailure }

/** The observable state of a stream handle. */
export type StreamState =
	/** The stream is established. */
	| { readonly status: 'open' }
	/** The stream is down and a re-open attempt is scheduled or in flight. */
	| {
			readonly status: 'reconnecting'
			/** Consecutive failed streams or open attempts, starting at 1. */
			readonly attempt: number
			readonly cause: StreamFailure
	  }
	/** Terminal: the stream is down and will not be re-opened. */
	| { readonly status: 'closed'; readonly reason: StreamClosedReason }

/**
 * The listener contract for a raw stream. Every key is required: leaving one
 * out is a compile error, so "forgot to handle `error`" cannot be written.
 */
export interface StreamHandlers<T> {
	/** One item was received. Must not throw; if it does it is treated as a stream `error`. */
	readonly data: (item: T) => void
	/**
	 * The stream failed. Called at most once per stream, and never after `end`
	 * for the same stream.
	 */
	readonly error: (error: Error) => void
	/**
	 * The server ended the stream (an `end` event, or a `close` with no prior
	 * `end` or `error`). Called at most once per stream, and never after `error`
	 * for the same stream.
	 */
	readonly end: () => void
	/**
	 * Called exactly once per stream, immediately after the `error` or `end`
	 * handler, so that the stream's resources can be released and recovery
	 * scheduled in one place. Not called after `dispose()`.
	 */
	readonly close: () => void
}

export interface StreamAttachment {
	/**
	 * Cancel and destroy the stream and suppress all further handler calls.
	 * The adapter's own listeners stay attached on purpose: removing the
	 * `error` listener from a stream that is then cancelled would turn the
	 * resulting CANCELLED `error` event into an uncaught exception.
	 */
	readonly dispose: () => void
}

/**
 * Narrow the value that a stream-opening call resolved to (after
 * `getOpenError` found no error) to a stream. Lives here so that stream workers
 * never need to name, and therefore never hold a typed reference to, the raw
 * gRPC stream type.
 */
export const asStream = <T>(opened: unknown): ClientReadableStream<T> =>
	opened as ClientReadableStream<T>

/**
 * Cancel and destroy a raw stream. Also used for a stream that was never
 * attached (for example one that finished opening after its handle was
 * closed): cancelling reports CANCELLED as an `error` event, which with no
 * listener would be an uncaught exception, so a listener for that expected
 * error is added first.
 */
export const cancelStream = (stream: ClientReadableStream<unknown>): void => {
	stream.on('error', () => undefined)
	stream.cancel()
	stream.destroy()
}

export const toError = (e: unknown): Error =>
	e instanceof Error ? e : new Error(String(e))

/**
 * Attach the lifecycle handlers to a raw gRPC stream. The only place in the
 * stream modules that calls `.on(...)` on a stream.
 *
 * `error`, `end` and `close` events can all fire for one dead stream; the first
 * one decides which handler runs, and the `close` handler runs exactly once.
 */
export function attachStream<T>(
	stream: ClientReadableStream<T>,
	handlers: StreamHandlers<T>
): StreamAttachment {
	let settled = false

	const settle = (deliverCause: () => void) => {
		if (settled) {
			return
		}
		settled = true
		try {
			deliverCause()
		} finally {
			handlers.close()
		}
	}

	stream.on('data', (item: T) => {
		if (settled) {
			return
		}
		try {
			handlers.data(item)
		} catch (e) {
			// A throwing data handler is a bug, but it must not be silent and it
			// must not leave a stream running that nobody is processing.
			cancelStream(stream)
			settle(() => handlers.error(toError(e)))
		}
	})
	stream.on('error', (e: unknown) => settle(() => handlers.error(toError(e))))
	stream.on('end', () => settle(() => handlers.end()))
	stream.on('close', () => settle(() => handlers.end()))

	return {
		dispose: () => {
			settled = true
			cancelStream(stream)
		},
	}
}

/**
 * `streamActivatedJobsStream` resolves to `{ error }` (or `undefined` when the
 * client is closing) instead of a stream when the stream cannot be opened.
 * Returns the open error, or `undefined` when `result` is a usable stream.
 */
export const getOpenError = (result: unknown): Error | undefined => {
	if (!result) return new Error('Stream could not be opened')
	if (typeof result === 'object' && 'error' in result) {
		return toError((result as { error: unknown }).error)
	}
	return undefined
}

/** Delay before reconnect `attempt` (1-based): exponential, capped. */
export const backoffDelayMs = (
	attempt: number,
	initialDelayMs: number,
	maxDelayMs: number
): number => Math.min(initialDelayMs * 2 ** (attempt - 1), maxDelayMs)

export const STREAM_HANDLE_BRAND: unique symbol = Symbol('StreamHandle')

/**
 * The value returned by every streaming API in the SDK. Extends the original
 * `{ close }` return type backward-compatibly with a failure channel.
 *
 * - `state` is the current state; read it any time.
 * - `done` resolves (never rejects) with the terminal reason when the handle
 *   reaches `closed`.
 *
 * Handle states are only ever produced by `createStreamHandle`; the brand
 * stops a structural `{ close }` literal from passing as a stream handle.
 */
export interface StreamHandle {
	readonly [STREAM_HANDLE_BRAND]: true
	/** Stop the stream and any reconnection. Idempotent. */
	close(): void
	/** The current state of the stream. */
	readonly state: StreamState
	/** Resolves with the terminal reason when the handle becomes `closed`. */
	readonly done: Promise<StreamClosedReason>
}

export interface StreamStateMachine {
	readonly state: StreamState
	readonly done: Promise<StreamClosedReason>
	/**
	 * Move to `next`. `closed` is terminal: transitions after it are ignored
	 * and return `false`.
	 */
	readonly transition: (next: StreamState) => boolean
}

export function createStreamStateMachine(
	initial: StreamState = { status: 'open' }
): StreamStateMachine {
	let state = initial
	let resolveDone: (reason: StreamClosedReason) => void = () => {}
	const done = new Promise<StreamClosedReason>((resolve) => {
		resolveDone = resolve
	})
	return {
		get state() {
			return state
		},
		done,
		transition: (next) => {
			if (state.status === 'closed') {
				return false
			}
			state = next
			if (next.status === 'closed') {
				resolveDone(next.reason)
			}
			return true
		},
	}
}

export function createStreamHandle(
	machine: Pick<StreamStateMachine, 'state' | 'done'>,
	close: () => void
): StreamHandle {
	return {
		[STREAM_HANDLE_BRAND]: true,
		close,
		get state() {
			return machine.state
		},
		done: machine.done,
	}
}

type StateDescribers = {
	[S in StreamState['status']]: (
		state: Extract<StreamState, { status: S }>
	) => string
}

const describeFailure = (failure: StreamFailure): string =>
	failure.kind === 'end'
		? 'stream ended'
		: `${failure.kind}: ${failure.error.message}`

const describeReason = (reason: StreamClosedReason): string =>
	reason.kind === 'stream-failed'
		? `stream failed (${describeFailure(reason.failure)})`
		: reason.kind

// An exhaustive lookup rather than a `switch` (see STYLE.md): adding a state
// to `StreamState` without describing it here fails `tsc`.
const describers: StateDescribers = {
	open: () => 'open',
	reconnecting: (s) =>
		`reconnecting (attempt ${s.attempt}, ${describeFailure(s.cause)})`,
	closed: (s) => `closed (${describeReason(s.reason)})`,
}

/** Human-readable description of a state, for logs. */
export const describeStreamState = (state: StreamState): string =>
	(describers[state.status] as (s: StreamState) => string)(state)

type IsAny<T> = 0 extends 1 & T ? true : false

/**
 * The names of the methods of `Client` that return (or resolve to) a
 * `StreamHandle`: its streaming operations. Type-level only.
 *
 * The conformance registry is keyed by this type, so a new streaming method on
 * the client cannot be added without a registry entry (and therefore the
 * conformance suite) or `tsc` fails.
 */
export type StreamingOpsOf<Client> = {
	[K in keyof Client & string]: Client[K] extends (...args: never[]) => infer R
		? IsAny<Awaited<R>> extends true
			? never
			: Awaited<R> extends StreamHandle
				? K
				: never
		: never
}[keyof Client & string]
