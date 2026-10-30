import { StreamState } from '../../../zeebe/lib/StreamLifecycle'

import { FakeStreamTransport } from './FakeStreamTransport'
import {
	OpenedStream,
	StreamBackoff,
	StreamConformanceCase,
	StreamObservers,
} from './registry'

/**
 * The shared conformance scenarios. Each takes one registered streaming
 * operation, drives it with a fake transport and asserts, with vitest's
 * `expect`, that a failure of the stream is observable by the caller and
 * recovered.
 *
 * They run under fake timers, so backoff delays are asserted exactly, and every
 * scenario ends by asserting that no timers are left (no leaks).
 *
 * A scenario that fails throws. The suite registers each as a test; the
 * negative tests run them against deliberately broken operations and assert
 * that they throw, which is how we know the suite can detect the defect class.
 */

export const BACKOFF: StreamBackoff = {
	initialDelayMs: 1_000,
	maxDelayMs: 8_000,
}

const OPEN: StreamState = { status: 'open' }

const settle = async () => {
	await vi.advanceTimersByTimeAsync(0)
}

const advance = async (ms: number) => {
	await vi.advanceTimersByTimeAsync(ms)
}

const failure = (message: string) =>
	Object.assign(new Error(message), { code: 14 })

/** Cleanups to run when the scenario ends, whether or not it passed. */
const cleanups: Array<() => void> = []

interface Run {
	transport: FakeStreamTransport
	opened: OpenedStream
	errors: Error[]
	ends: number[]
	reconnects: number[]
	uncaught: unknown[]
	/** Close the handle, then assert it is closed and nothing is left running. */
	finish: () => Promise<void>
}

const start = async (
	testCase: StreamConformanceCase,
	options: {
		reconnect?: StreamBackoff | false
		/** Make every observer an async function that rejects after recording. */
		rejectingObservers?: boolean
		prepare?: (transport: FakeStreamTransport) => void
	} = {}
): Promise<Run> => {
	const transport = new FakeStreamTransport()
	options.prepare?.(transport)
	const errors: Error[] = []
	const ends: number[] = []
	const reconnects: number[] = []
	const uncaught: unknown[] = []
	const onUncaught = (e: unknown) => uncaught.push(e)
	process.on('uncaughtException', onUncaught)
	process.on('unhandledRejection', onUncaught)
	cleanups.push(() => {
		process.off('uncaughtException', onUncaught)
		process.off('unhandledRejection', onUncaught)
	})
	const callbackBug = async () => {
		throw new Error('bug in the caller callback')
	}
	const observers: StreamObservers = options.rejectingObservers
		? {
				onError: async (e) => {
					errors.push(e)
					await callbackBug()
				},
				onEnd: async () => {
					ends.push(ends.length + 1)
					await callbackBug()
				},
				onReconnect: async (attempt) => {
					reconnects.push(attempt)
					await callbackBug()
				},
			}
		: {
				onError: (e) => void errors.push(e),
				onEnd: () => void ends.push(ends.length + 1),
				onReconnect: (attempt) => void reconnects.push(attempt),
			}
	const opened = await testCase.open({
		transport,
		observers,
		reconnect: options.reconnect === undefined ? BACKOFF : options.reconnect,
	})
	await settle()
	const finish = async () => {
		opened.handle.close()
		await settle()
		expect(opened.handle.state.status).toBe('closed')
		expect(vi.getTimerCount(), 'close() cancels every timer').toBe(0)
		await opened.handle.done
		await advance(10 * BACKOFF.maxDelayMs)
		expect(uncaught, 'no uncaught exception or unhandled rejection').toEqual([])
		expect(vi.getTimerCount(), 'no timers left running after close').toBe(0)
	}
	return { transport, opened, errors, ends, reconnects, uncaught, finish }
}

export const scenarios = {
	/** The stream errors: the caller is told, and the stream is re-opened after the backoff. */
	'stream error: caller notified, state reconnecting, re-opened with backoff':
		async (testCase: StreamConformanceCase) => {
			const run = await start(testCase)
			const { handle } = run.opened
			expect(handle.state).toEqual(OPEN)
			expect(run.transport.opens).toBe(1)

			const error = failure('14 UNAVAILABLE: connection reset')
			run.transport.latest.serverError(error)
			await settle()

			expect(run.errors, 'caller is notified of the error').toEqual([error])
			expect(run.ends).toEqual([])
			expect(handle.state).toMatchObject({
				status: 'reconnecting',
				attempt: 1,
				cause: { kind: 'error', error },
			})

			await advance(BACKOFF.initialDelayMs - 1)
			expect(run.transport.opens, 'no re-open before the backoff').toBe(1)
			await advance(1)
			expect(run.transport.opens, 're-opened after the backoff').toBe(2)
			expect(run.reconnects).toEqual([1])
			expect(handle.state).toEqual(OPEN)
			await run.finish()
		},

	/** The server ends the stream gracefully: same obligations as an error. */
	'graceful end: caller notified, state reconnecting, re-opened with backoff':
		async (testCase: StreamConformanceCase) => {
			const run = await start(testCase)
			const { handle } = run.opened

			run.transport.latest.serverEnd()
			await settle()

			expect(run.ends, 'caller is notified that the stream ended').toEqual([1])
			expect(run.errors).toEqual([])
			expect(handle.state).toMatchObject({
				status: 'reconnecting',
				attempt: 1,
				cause: { kind: 'end' },
			})

			await advance(BACKOFF.initialDelayMs)
			expect(run.transport.opens).toBe(2)
			expect(run.reconnects).toEqual([1])
			expect(handle.state).toEqual(OPEN)
			await run.finish()
		},

	/** The stream cannot be opened (resolves to `{ error }` or rejects): notified, retried with doubling, capped delays. */
	'open failure: caller notified, retried with exponential capped backoff':
		async (testCase: StreamConformanceCase) => {
			const failures = [1, 2, 3, 4, 5].map((n) => failure(`open failed ${n}`))
			const run = await start(testCase, {
				prepare: (transport) =>
					failures.forEach((error, i) =>
						// Exercise both shapes of failure.
						i % 2 === 0
							? transport.failNextOpen(error)
							: transport.rejectNextOpen(error)
					),
			})
			const { handle } = run.opened
			expect(run.errors, 'the first open failure is reported').toEqual([
				failures[0],
			])
			expect(handle.state).toMatchObject({
				status: 'reconnecting',
				attempt: 1,
				cause: { kind: 'open-failed', error: failures[0] },
			})

			// Delays: 1000, 2000, 4000, then capped at 8000, 8000.
			const delays = [1_000, 2_000, 4_000, 8_000, 8_000]
			for (const [i, delay] of delays.entries()) {
				const opensBefore = run.transport.opens
				await advance(delay - 1)
				expect(
					run.transport.opens,
					`attempt ${i + 1} waits for ${delay}ms`
				).toBe(opensBefore)
				await advance(1)
				expect(run.transport.opens).toBe(opensBefore + 1)
				expect(run.reconnects).toEqual(
					delays.slice(0, i + 1).map((_, n) => n + 1)
				)
			}
			// The fifth re-open succeeded, so the stream is open again.
			expect(run.errors).toEqual(failures.slice(0, 5))
			expect(handle.state).toEqual(OPEN)
			await run.finish()
		},

	/** A caller callback that is async and rejects must neither crash the process (unhandled rejection) nor stop recovery. */
	'async rejecting callbacks: no unhandled rejection, recovery continues':
		async (testCase: StreamConformanceCase) => {
			const run = await start(testCase, { rejectingObservers: true })
			const { handle } = run.opened

			run.transport.latest.serverError(failure('14 UNAVAILABLE'))
			await settle()
			expect(run.errors).toHaveLength(1)
			await advance(BACKOFF.initialDelayMs)
			expect(run.reconnects).toEqual([1])
			expect(run.transport.opens, 'still re-opened').toBe(2)

			run.transport.latest.serverEnd()
			await settle()
			expect(run.ends).toEqual([1])
			// The previous stream never delivered anything, so this is the second
			// consecutive failure and the delay has doubled.
			await advance(2 * BACKOFF.initialDelayMs)
			expect(run.transport.opens, 'still re-opened after an end').toBe(3)
			expect(handle.state).toEqual(OPEN)
			// `finish` asserts that no unhandled rejection was raised.
			await run.finish()
		},

	/** `close()` on the handle: terminal state, no re-open, no leaked timers, and the cancel it causes is not reported. */
	'close(): terminal state, stream cancelled, no re-open, no leaks': async (
		testCase: StreamConformanceCase
	) => {
		const run = await start(testCase)
		const { handle } = run.opened
		const stream = run.transport.latest

		handle.close()
		await settle()
		expect(handle.state).toEqual({
			status: 'closed',
			reason: { kind: 'closed-by-caller' },
		})
		await expect(handle.done).resolves.toEqual({ kind: 'closed-by-caller' })
		expect(stream.cancelled, 'the open stream is cancelled').toBe(true)
		expect(
			run.errors,
			'the CANCELLED error caused by close() is not a failure'
		).toEqual([])
		expect(run.ends).toEqual([])

		await advance(10 * BACKOFF.maxDelayMs)
		expect(run.transport.opens, 'no re-open after close').toBe(1)
		handle.close() // idempotent
		await run.finish()
	},

	/** `close()` while a re-open is pending: the pending re-open never happens. */
	'close() while reconnecting: no re-open, no leaks': async (
		testCase: StreamConformanceCase
	) => {
		const run = await start(testCase)
		const { handle } = run.opened
		run.transport.latest.serverError(failure('14 UNAVAILABLE'))
		await settle()
		expect(handle.state.status).toBe('reconnecting')

		handle.close()
		await advance(10 * BACKOFF.maxDelayMs)
		expect(run.transport.opens, 'no re-open after close').toBe(1)
		expect(run.reconnects).toEqual([])
		expect(run.errors).toHaveLength(1)
		expect(handle.state).toEqual({
			status: 'closed',
			reason: { kind: 'closed-by-caller' },
		})
		await run.finish()
	},

	/**
	 * `close()` while a re-open is in flight. Whatever the open resolves to is
	 * discarded: a failure is not reported to a caller who has gone away, and a
	 * stream that did open is cancelled instead of leaked.
	 */
	'close() during an in-flight re-open: late failure not reported, late stream cancelled':
		async (testCase: StreamConformanceCase) => {
			// Variant 1: the in-flight open fails after close().
			const failedOpen = await start(testCase)
			const deferredFailure = failedOpen.transport.deferNextOpen()
			failedOpen.transport.latest.serverError(failure('14 UNAVAILABLE'))
			await settle()
			await advance(BACKOFF.initialDelayMs) // re-open starts, stays pending
			expect(failedOpen.transport.opens).toBe(2)
			failedOpen.opened.handle.close()
			deferredFailure.resolve({ error: failure('open failed after close') })
			await settle()
			expect(
				failedOpen.errors,
				'only the original stream error was reported'
			).toHaveLength(1)
			await advance(10 * BACKOFF.maxDelayMs)
			expect(failedOpen.transport.opens, 'no retry after close').toBe(2)
			await failedOpen.finish()

			// Variant 2: the in-flight open succeeds after close().
			const succeededOpen = await start(testCase)
			const deferredStream = succeededOpen.transport.deferNextOpen()
			succeededOpen.transport.latest.serverError(failure('14 UNAVAILABLE'))
			await settle()
			await advance(BACKOFF.initialDelayMs)
			succeededOpen.opened.handle.close()
			const lateStream = succeededOpen.transport.newStream()
			deferredStream.resolve(lateStream)
			await settle()
			expect(lateStream.cancelled, 'the late stream is cancelled').toBe(true)
			await succeededOpen.finish()
		},

	/** Closing the owner of the handle (for `streamJobs`, the client) closes the handle with its own reason. */
	'owner close: state closed (client-closed), no re-open, no leaks': async (
		testCase: StreamConformanceCase
	) => {
		const run = await start(testCase)
		const { handle, closeOwner } = run.opened

		await closeOwner()
		await settle()
		expect(handle.state).toEqual({
			status: 'closed',
			reason: { kind: 'client-closed' },
		})
		await expect(handle.done).resolves.toEqual({ kind: 'client-closed' })
		expect(run.errors, 'closing the owner is not a failure').toEqual([])
		await advance(10 * BACKOFF.maxDelayMs)
		expect(run.transport.opens).toBe(1)
		await run.finish()
	},

	/** Reconnection disabled: the failure is still reported, and the handle says the stream is gone for good. */
	'reconnect disabled: caller notified, state closed (stream-failed), no re-open':
		async (testCase: StreamConformanceCase) => {
			const run = await start(testCase, { reconnect: false })
			const { handle } = run.opened
			const error = failure('14 UNAVAILABLE')

			run.transport.latest.serverError(error)
			await settle()

			expect(run.errors).toEqual([error])
			expect(handle.state).toEqual({
				status: 'closed',
				reason: { kind: 'stream-failed', failure: { kind: 'error', error } },
			})
			await expect(handle.done).resolves.toMatchObject({
				kind: 'stream-failed',
			})
			await advance(10 * BACKOFF.maxDelayMs)
			expect(run.transport.opens, 'no re-open when disabled').toBe(1)
			expect(run.reconnects).toEqual([])
			await run.finish()
		},
} as const satisfies Record<
	string,
	(testCase: StreamConformanceCase) => Promise<void>
>

export type ScenarioName = keyof typeof scenarios

/** Run one scenario under fake timers, always restoring real timers. */
export const runScenario = async (
	name: ScenarioName,
	testCase: StreamConformanceCase
): Promise<void> => {
	vi.useFakeTimers()
	try {
		await scenarios[name](testCase)
	} finally {
		cleanups.splice(0).forEach((cleanup) => cleanup())
		vi.clearAllTimers()
		vi.useRealTimers()
	}
}
