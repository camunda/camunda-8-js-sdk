import { ZeebeGrpcClient } from '../../../zeebe'
import type {
	StreamHandle,
	StreamingOpsOf,
} from '../../../zeebe/lib/StreamLifecycle'
import { StatefulLogInterceptor } from '../../../zeebe/lib/StatefulLogInterceptor'
import { ZBStreamWorker } from '../../../zeebe/lib/ZBStreamWorker'
import { ZBGrpc } from '../../../zeebe/lib/interfaces-1.0'
import { LosslessDto } from '../../../lib'

import { FakeStreamTransport } from './FakeStreamTransport'

/**
 * How a streaming operation tells its caller what happened to the stream.
 * Each case maps these onto the operation's own options.
 */
export interface StreamObservers {
	onError: (error: Error) => void | Promise<void>
	onEnd: () => void | Promise<void>
	onReconnect: (attempt: number) => void | Promise<void>
}

export interface StreamBackoff {
	initialDelayMs: number
	maxDelayMs: number
	/**
	 * Random source for the reconnect jitter. The suite pins it at the top of
	 * the range so the jittered delay is exactly the exponential cap and the
	 * timing assertions stay exact.
	 */
	random?: () => number
}

export interface OpenedStream {
	handle: StreamHandle
	/** Close whatever owns the handle (for `streamJobs`, the client's stream worker). */
	closeOwner: () => Promise<unknown>
}

/**
 * Everything the shared conformance suite needs to know about one streaming
 * operation.
 */
export interface StreamConformanceCase {
	/** Open the operation against `transport`. */
	open(args: {
		transport: FakeStreamTransport
		observers: StreamObservers
		/** `false` disables reconnection. */
		reconnect: StreamBackoff | false
	}): Promise<OpenedStream>
	/**
	 * Call the operation on an owner (for `streamJobs`, the client's stream
	 * worker) that has already been closed. It must not throw and must open
	 * nothing; the handle it returns must be closed (`client-closed`).
	 */
	openOnClosedOwner(args: {
		transport: FakeStreamTransport
		observers: StreamObservers
		reconnect: StreamBackoff | false
	}): Promise<StreamHandle>
	/**
	 * How the operation detects a connection that has silently stopped
	 * delivering without any event. The suite asserts that the mechanism is
	 * configured; it cannot simulate the network.
	 *
	 * - `grpc-keepalive`: HTTP/2 keepalive pings on the channel. The transport
	 *   closes a connection whose ping is not acknowledged, which surfaces as a
	 *   stream `error`, which the lifecycle handlers then see.
	 */
	hang: { mechanism: 'grpc-keepalive' }
}

/**
 * The streaming operations of `ZeebeGrpcClient`: every method whose return type
 * is a `StreamHandle`.
 */
export type StreamingOp = StreamingOpsOf<ZeebeGrpcClient>

/**
 * One conformance case per streaming operation. Adding a streaming method to
 * `ZeebeGrpcClient` without adding it here fails `tsc` (`npm run
 * typecheck:tests`, part of `npm test`).
 */
export type StreamConformanceRegistry<Op extends string = StreamingOp> = {
	readonly [K in Op]: StreamConformanceCase
}

const silentLog = {
	logInfo: () => undefined,
	logDebug: () => undefined,
	logError: () => undefined,
}

/**
 * A random source pinned at the top of the jitter range: the jittered delay
 * is exactly the exponential cap, so the suite's timing assertions stay exact.
 */
const maxJitter = () => 1 - Number.EPSILON

const newStreamJobsWorker = (transport: FakeStreamTransport) =>
	new ZBStreamWorker({
		grpcClient: {
			streamActivatedJobsStream: transport.open,
			close: async () => undefined,
		} as unknown as ZBGrpc,
		log: silentLog as unknown as StatefulLogInterceptor,
		zbClient: {
			activateJobs: async () => [],
			failJob: async () => undefined,
		} as unknown as ZeebeGrpcClient,
	})

const callStreamJobs = (
	worker: ZBStreamWorker,
	observers: StreamObservers,
	reconnect: StreamBackoff | false
) =>
	worker.streamJobs({
		type: 'conformance-task',
		worker: 'conformance-worker',
		timeout: 30_000,
		tenantIds: ['<default>'],
		taskHandler: () => {
			throw new Error('no jobs are activated in the conformance suite')
		},
		inputVariableDto: LosslessDto,
		customHeadersDto: LosslessDto,
		// The sidecar poll is left on, so that "no leaked timers after
		// close" also covers it.
		pollInterval: 5_000,
		// The max-lifetime recycle and inactivity watchdog are disabled here:
		// the suite pins down failure/reconnect timing exactly, and a stream
		// recycling itself mid-scenario would break those assertions. Their
		// behaviour is covered by the ZBStreamWorker lifecycle spec.
		streamTimeout: false,
		streamInactivityTimeout: false,
		onStreamError: observers.onError,
		onStreamEnd: observers.onEnd,
		onStreamReconnect: observers.onReconnect,
		streamReconnect:
			reconnect === false
				? false
				: { ...reconnect, random: reconnect.random ?? maxJitter },
	})

const streamJobsCase: StreamConformanceCase = {
	open: async ({ transport, observers, reconnect }) => {
		const worker = newStreamJobsWorker(transport)
		const handle = await callStreamJobs(worker, observers, reconnect)
		return { handle, closeOwner: () => worker.close() }
	},
	openOnClosedOwner: async ({ transport, observers, reconnect }) => {
		const worker = newStreamJobsWorker(transport)
		await worker.close()
		return callStreamJobs(worker, observers, reconnect)
	},
	hang: { mechanism: 'grpc-keepalive' },
}

export const streamConformanceRegistry: StreamConformanceRegistry = {
	streamJobs: streamJobsCase,
}
