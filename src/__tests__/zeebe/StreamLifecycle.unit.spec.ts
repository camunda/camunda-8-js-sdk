import { allowAny } from '../../test-support/testTags'
import {
	StreamHandle,
	StreamHandlers,
	StreamState,
	StreamingOpsOf,
	attachStream,
	backoffDelayMs,
	createStreamHandle,
	createStreamStateMachine,
	describeStreamState,
} from '../../zeebe/lib/StreamLifecycle'

import { FakeGrpcStream, asGrpcStream } from './conformance/FakeStreamTransport'

/** Type-level equality: `true` only if A and B are mutually identical. */
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B
	? 1
	: 2
	? true
	: false

const recorder = () => {
	const calls: string[] = []
	const handlers: StreamHandlers<string> = {
		data: (item) => void calls.push(`data:${item}`),
		error: (e) => void calls.push(`error:${e.message}`),
		end: () => void calls.push('end'),
		close: () => void calls.push('close'),
	}
	return { calls, handlers }
}

const tick = () => new Promise((resolve) => setImmediate(resolve))

describe.runIf(allowAny([{ deployment: 'unit-test' }]))('attachStream', () => {
	test('requires a handler for every event (compile-time)', () => {
		const f = () => undefined
		// @ts-expect-error `error` is required: a stream with no failure handler does not compile
		const noError: StreamHandlers<string> = { data: f, end: f, close: f }
		// @ts-expect-error `end` is required
		const noEnd: StreamHandlers<string> = { data: f, error: f, close: f }
		// @ts-expect-error `close` is required
		const noClose: StreamHandlers<string> = { data: f, error: f, end: f }
		// @ts-expect-error `data` is required
		const noData: StreamHandlers<string> = { error: f, end: f, close: f }
		const all: StreamHandlers<string> = { data: f, error: f, end: f, close: f }
		expect([noError, noEnd, noClose, noData, all]).toHaveLength(5)
	})

	test('delivers data, then error, then close exactly once', async () => {
		const { calls, handlers } = recorder()
		const stream = new FakeGrpcStream()
		attachStream(asGrpcStream<string>(stream), handlers)

		stream.serverSend('a')
		stream.serverSend('b')
		await tick()
		stream.serverError(new Error('boom'))
		await tick()

		expect(calls).toEqual(['data:a', 'data:b', 'error:boom', 'close'])
	})

	test('end is followed by close, and the raw close event is not delivered twice', async () => {
		const { calls, handlers } = recorder()
		const stream = new FakeGrpcStream()
		attachStream(asGrpcStream<string>(stream), handlers)

		stream.serverEnd()
		await tick()

		expect(calls).toEqual(['end', 'close'])
	})

	test('a raw close with no prior end or error is reported as end', async () => {
		const { calls, handlers } = recorder()
		const stream = new FakeGrpcStream()
		attachStream(asGrpcStream<string>(stream), handlers)

		stream.destroy()
		await tick()

		expect(calls).toEqual(['end', 'close'])
	})

	test('a throwing data handler is reported as a stream error and the stream is cancelled', async () => {
		const { calls, handlers } = recorder()
		const stream = new FakeGrpcStream()
		attachStream(asGrpcStream<string>(stream), {
			...handlers,
			data: () => {
				throw new Error('handler bug')
			},
		})

		stream.serverSend('a')
		await tick()

		expect(calls).toEqual(['error:handler bug', 'close'])
		expect(stream.cancelled).toBe(true)
	})

	test('close still runs if the error handler throws', async () => {
		const calls: string[] = []
		const stream = new FakeGrpcStream()
		attachStream(asGrpcStream<string>(stream), {
			data: () => undefined,
			error: () => {
				throw new Error('handler bug')
			},
			end: () => undefined,
			close: () => void calls.push('close'),
		})
		const uncaught: unknown[] = []
		const onUncaught = (e: unknown) => uncaught.push(e)
		process.on('uncaughtException', onUncaught)
		try {
			stream.serverError(new Error('boom'))
			await tick()
			// The adapter does not swallow the handler's exception.
			expect(calls).toEqual(['close'])
			expect(uncaught).toHaveLength(1)
		} finally {
			process.off('uncaughtException', onUncaught)
		}
	})

	test('dispose cancels the stream, suppresses handlers, and survives the CANCELLED error', async () => {
		const { calls, handlers } = recorder()
		const stream = new FakeGrpcStream()
		const attachment = attachStream(asGrpcStream<string>(stream), handlers)

		attachment.dispose()
		await tick()

		// The stream reports CANCELLED as an `error` event. If the adapter had
		// removed its error listener this would be an uncaught exception.
		expect(stream.cancelled).toBe(true)
		expect(stream.listenerCount('error')).toBeGreaterThan(0)
		expect(calls).toEqual([])
	})
})

describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'stream state machine',
	() => {
		test('starts open, and closed is terminal', async () => {
			const machine = createStreamStateMachine()
			expect(machine.state).toEqual({ status: 'open' })

			const cause = { kind: 'end' } as const
			expect(
				machine.transition({ status: 'reconnecting', attempt: 1, cause })
			).toBe(true)
			expect(machine.transition({ status: 'open' })).toBe(true)
			expect(
				machine.transition({
					status: 'closed',
					reason: { kind: 'closed-by-caller' },
				})
			).toBe(true)

			// Terminal: nothing moves it out of `closed`, and `done` keeps the first reason.
			expect(machine.transition({ status: 'open' })).toBe(false)
			expect(
				machine.transition({
					status: 'closed',
					reason: { kind: 'client-closed' },
				})
			).toBe(false)
			expect(machine.state).toEqual({
				status: 'closed',
				reason: { kind: 'closed-by-caller' },
			})
			await expect(machine.done).resolves.toEqual({ kind: 'closed-by-caller' })
		})

		test('done stays pending until closed', async () => {
			const machine = createStreamStateMachine()
			let resolved = false
			void machine.done.then(() => (resolved = true))
			machine.transition({
				status: 'reconnecting',
				attempt: 1,
				cause: { kind: 'end' },
			})
			await tick()
			expect(resolved).toBe(false)
		})

		test('a handle reflects the machine and carries the brand', () => {
			const machine = createStreamStateMachine()
			const close = vi.fn()
			const handle = createStreamHandle(machine, close)
			handle.close()
			expect(close).toHaveBeenCalledTimes(1)
			expect(handle.state).toEqual({ status: 'open' })
			machine.transition({
				status: 'closed',
				reason: { kind: 'client-closed' },
			})
			expect(handle.state.status).toBe('closed')
		})

		test('describeStreamState describes every state', () => {
			const states: StreamState[] = [
				{ status: 'open' },
				{
					status: 'reconnecting',
					attempt: 2,
					cause: { kind: 'error', error: new Error('boom') },
				},
				{
					status: 'closed',
					reason: { kind: 'stream-failed', failure: { kind: 'end' } },
				},
			]
			expect(states.map(describeStreamState)).toEqual([
				'open',
				'reconnecting (attempt 2, error: boom)',
				'closed (stream failed (stream ended))',
			])
		})

		test('backoffDelayMs doubles and is capped', () => {
			expect([1, 2, 3, 4, 5].map((n) => backoffDelayMs(n, 1000, 8000))).toEqual(
				[1000, 2000, 4000, 8000, 8000]
			)
		})
	}
)

describe('stream handle types (compile-time)', () => {
	test('only a handle made by createStreamHandle is a StreamHandle', () => {
		// @ts-expect-error a plain `{ close }` (the old return type) is not a StreamHandle
		const notAHandle: StreamHandle = { close: () => undefined }
		expect(notAHandle).toBeDefined()
	})

	test('StreamingOpsOf finds the methods that return a StreamHandle', () => {
		interface FakeClient {
			stream(): Promise<StreamHandle>
			streamSync(): StreamHandle
			plain(): Promise<{ close(): void }>
			value: number
			untyped(): Promise<any> // eslint-disable-line @typescript-eslint/no-explicit-any
		}
		const equal: Equal<
			StreamingOpsOf<FakeClient>,
			'stream' | 'streamSync'
		> = true
		expect(equal).toBe(true)
	})
})
