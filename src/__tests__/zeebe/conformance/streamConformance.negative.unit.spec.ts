import { allowAny } from '../../../test-support/testTags'
import {
	StreamFailure,
	StreamHandle,
	attachStream,
	asStream,
	backoffDelayMs,
	cancelStream,
	createStreamHandle,
	createStreamStateMachine,
	getOpenError,
} from '../../../zeebe/lib/StreamLifecycle'

import { FakeStreamTransport } from './FakeStreamTransport'
import {
	StreamConformanceCase,
	StreamConformanceRegistry,
	StreamingOp,
	streamConformanceRegistry,
} from './registry'
import { ScenarioName, runScenario, scenarios } from './scenarios'

/**
 * The conformance suite is only worth having if it fails on the defect it
 * exists to catch. These tests build a small, correct streaming operation and
 * then break it in one specific way at a time (including the original defect:
 * an `error` handler that only logs) and assert that the suite rejects each
 * broken variant.
 */

interface Flaws {
	/** The defect that shipped: errors are logged to the console and nothing else. */
	consoleOnly: boolean
	/** Ignores a graceful end. */
	ignoresEnd: boolean
	/** Reports the failure but never re-opens. */
	noRecovery: boolean
	/** Re-opens as fast as possible instead of backing off. */
	noBackoff: boolean
	/** `close()` does not cancel the pending re-open. */
	reopensAfterClose: boolean
	/** `close()` leaves a timer running. */
	leaksTimer: boolean
	/** `close()` leaves the stream running. */
	doesNotCancelOnClose: boolean
	/** Calls caller callbacks without observing the promise they return. */
	leaksCallbackRejection: boolean
	/** Called on a closed owner, returns a handle that claims to be open forever. */
	ignoresClosedOwner: boolean
	/** Never moves out of `open`. */
	stateNeverChanges: boolean
}

const miniOp = (flaws: Partial<Flaws> = {}): StreamConformanceCase => ({
	hang: { mechanism: 'grpc-keepalive' },
	openOnClosedOwner: async () => {
		const machine = createStreamStateMachine()
		if (!flaws.ignoresClosedOwner) {
			machine.transition({
				status: 'closed',
				reason: { kind: 'client-closed' },
			})
		}
		return createStreamHandle(machine, () => undefined)
	},
	open: async ({ transport, observers, reconnect }) => {
		const machine = createStreamStateMachine()
		const initialDelayMs = reconnect === false ? 0 : reconnect.initialDelayMs
		const maxDelayMs = reconnect === false ? 0 : reconnect.maxDelayMs
		let closed = false
		let failures = 0
		let timer: ReturnType<typeof setTimeout> | undefined
		let leak: ReturnType<typeof setInterval> | undefined
		let current: ReturnType<typeof attachStream> | undefined
		let cause: StreamFailure = { kind: 'end' }

		const notify = (callback: () => void | Promise<void>) => {
			const result = callback()
			if (flaws.leaksCallbackRejection) return
			Promise.resolve(result).catch(() => undefined)
		}

		const down = (cause: StreamFailure) => {
			if (closed && !flaws.reopensAfterClose) return
			if (reconnect === false || flaws.noRecovery) {
				if (!flaws.stateNeverChanges)
					machine.transition({
						status: 'closed',
						reason: { kind: 'stream-failed', failure: cause },
					})
				return
			}
			failures++
			if (!flaws.stateNeverChanges)
				machine.transition({
					status: 'reconnecting',
					attempt: failures,
					cause,
				})
			const delay = flaws.noBackoff
				? 0
				: backoffDelayMs(failures, initialDelayMs, maxDelayMs)
			timer = setTimeout(() => {
				notify(() => observers.onReconnect(failures))
				void open()
			}, delay)
		}

		const open = async (): Promise<void> => {
			let result: unknown
			try {
				result = await transport.open()
			} catch (e) {
				result = { error: e }
			}
			if (closed && !flaws.reopensAfterClose) {
				if (!getOpenError(result)) cancelStream(asStream(result))
				return
			}
			const openError = getOpenError(result)
			if (openError) {
				notify(() => observers.onError(openError))
				down({ kind: 'open-failed', error: openError })
				return
			}
			const stream = asStream<unknown>(result)
			current = attachStream(stream, {
				data: () => undefined,
				error: (error) => {
					cause = { kind: 'error', error }
					if (flaws.consoleOnly) {
						// eslint-disable-next-line no-console
						console.error(error)
						return
					}
					notify(() => observers.onError(error))
				},
				end: () => {
					cause = { kind: 'end' }
					if (flaws.ignoresEnd) return
					notify(() => observers.onEnd())
				},
				close: () => {
					if (flaws.consoleOnly) return
					if (flaws.ignoresEnd && stream.readableEnded) return
					down(cause)
				},
			})
			if (!flaws.stateNeverChanges) machine.transition({ status: 'open' })
		}

		await open()
		if (flaws.leaksTimer) leak = setInterval(() => undefined, 60_000)

		const close = () => {
			closed = true
			if (!flaws.reopensAfterClose && timer) clearTimeout(timer)
			if (!flaws.leaksTimer && leak) clearInterval(leak)
			if (!flaws.doesNotCancelOnClose) current?.dispose()
			machine.transition({
				status: 'closed',
				reason: { kind: 'closed-by-caller' },
			})
		}
		const handle: StreamHandle = createStreamHandle(machine, close)
		return {
			handle,
			closeOwner: async () => {
				closed = true
				if (timer) clearTimeout(timer)
				current?.dispose()
				machine.transition({
					status: 'closed',
					reason: { kind: 'client-closed' },
				})
			},
		}
	},
})

const failsScenarios = async (
	testCase: StreamConformanceCase,
	names: ScenarioName[]
) => {
	for (const name of names) {
		await expect(
			runScenario(name, testCase),
			`scenario "${name}" should detect the defect`
		).rejects.toThrow()
	}
}

describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'the conformance suite detects broken streaming operations',
	() => {
		const all = Object.keys(scenarios) as ScenarioName[]

		test('control: a correct operation passes every scenario', async () => {
			for (const name of all) {
				await runScenario(name, miniOp())
			}
		})

		test('an error handler that only logs to the console (the original defect) fails', async () => {
			const consoleError = vi
				.spyOn(console, 'error')
				.mockImplementation(() => {})
			try {
				await failsScenarios(miniOp({ consoleOnly: true }), [
					'stream error: caller notified, state reconnecting, re-opened with backoff',
					'graceful end: caller notified, state reconnecting, re-opened with backoff',
				])
				expect(consoleError).toHaveBeenCalled()
			} finally {
				consoleError.mockRestore()
			}
		})

		test('ignoring a graceful end fails', async () => {
			await failsScenarios(miniOp({ ignoresEnd: true }), [
				'graceful end: caller notified, state reconnecting, re-opened with backoff',
			])
		})

		test('reporting a failure but never recovering fails', async () => {
			await failsScenarios(miniOp({ noRecovery: true }), [
				'stream error: caller notified, state reconnecting, re-opened with backoff',
				'open failure: caller notified, retried with exponential capped backoff',
			])
		})

		test('re-opening without backoff fails', async () => {
			await failsScenarios(miniOp({ noBackoff: true }), [
				'stream error: caller notified, state reconnecting, re-opened with backoff',
				'open failure: caller notified, retried with exponential capped backoff',
			])
		})

		test('re-opening after close fails', async () => {
			await failsScenarios(miniOp({ reopensAfterClose: true }), [
				'close() while reconnecting: no re-open, no leaks',
			])
		})

		test('a timer left running after close fails', async () => {
			await failsScenarios(miniOp({ leaksTimer: true }), [
				'close(): terminal state, stream cancelled, no re-open, no leaks',
			])
		})

		test('not cancelling the stream on close fails', async () => {
			await failsScenarios(miniOp({ doesNotCancelOnClose: true }), [
				'close(): terminal state, stream cancelled, no re-open, no leaks',
			])
		})

		test('an async callback whose rejection is not observed fails', async () => {
			await failsScenarios(miniOp({ leaksCallbackRejection: true }), [
				'async rejecting callbacks: no unhandled rejection, recovery continues',
			])
		})

		test('a handle from a closed owner that reports open forever fails', async () => {
			await failsScenarios(miniOp({ ignoresClosedOwner: true }), [
				'owner already closed: closed handle (client-closed), nothing opened, no leaks',
			])
		})

		test('a state that never changes fails', async () => {
			await failsScenarios(miniOp({ stateNeverChanges: true }), [
				'stream error: caller notified, state reconnecting, re-opened with backoff',
				'reconnect disabled: caller notified, state closed (stream-failed), no re-open',
			])
		})
	}
)

describe('the registry has exactly one case per streaming operation (compile-time)', () => {
	test('every streaming operation is registered', () => {
		const registered = Object.keys(streamConformanceRegistry)
		const expected: StreamingOp[] = ['streamJobs']
		expect(registered.sort()).toEqual(expected.sort())
	})

	test('a registry that is missing an operation does not compile', () => {
		const c = streamConformanceRegistry.streamJobs
		// @ts-expect-error `streamJobs` is a streaming operation, so it must have an entry
		const missing: StreamConformanceRegistry = {}
		// @ts-expect-error an entry for something that is not a streaming operation is rejected
		const extra: StreamConformanceRegistry = { streamJobs: c, x: c }
		// A registry for a client with a second streaming operation needs both.
		type Two = StreamConformanceRegistry<'streamJobs' | 'streamNewThing'>
		// @ts-expect-error `streamNewThing` has no entry
		const incomplete: Two = { streamJobs: c }
		const complete: Two = { streamJobs: c, streamNewThing: c }
		expect([missing, extra, incomplete, complete]).toHaveLength(4)
	})

	test('a new streaming method on the client changes the set of operations', () => {
		// `StreamingOp` is computed from the return types of ZeebeGrpcClient's
		// methods. See StreamLifecycle.unit.spec.ts for the type-level checks of
		// that computation; this asserts the instantiation used by the registry.
		const ops: Record<StreamingOp, true> = { streamJobs: true }
		expect(Object.keys(ops)).toEqual(['streamJobs'])
		// Keep the helper referenced for the transport used by the cases above.
		expect(new FakeStreamTransport().opens).toBe(0)
	})
})
