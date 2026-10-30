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

const streamJobsCase: StreamConformanceCase = {
	open: async ({ transport, observers, reconnect }) => {
		const worker = new ZBStreamWorker({
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
		const handle = await worker.streamJobs({
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
			onStreamError: observers.onError,
			onStreamEnd: observers.onEnd,
			onStreamReconnect: observers.onReconnect,
			streamReconnect: reconnect,
		})
		return { handle, closeOwner: () => worker.close() }
	},
	hang: { mechanism: 'grpc-keepalive' },
}

export const streamConformanceRegistry: StreamConformanceRegistry = {
	streamJobs: streamJobsCase,
}
