import { ZeebeGrpcClient } from '../zeebe'
import { StreamState } from '../zeebe/lib/StreamLifecycle'

import { TcpFaultProxy } from './TcpFaultProxy'

/**
 * Fault-injection scenarios for `streamJobs`, shared by the integration test
 * (a real broker) and the unit test (a fake gateway over real gRPC). Both put a
 * TcpFaultProxy between the SDK and the gateway and cut the connection.
 *
 * The scenarios disable the recurring sidecar poll (`pollInterval: 0`), so a job
 * created after the stream has been re-established can only reach the worker if
 * the stream itself recovered. The single backfill poll that follows a
 * reconnect is the only poll.
 */

export interface FaultEnvironment {
	proxy: TcpFaultProxy
	jobType: string
	/** Create a job of `jobType`, without going through the proxy. */
	produceJob: () => Promise<void>
	/** Resolve once the gateway has registered the worker's job stream. */
	waitForStream: () => Promise<void>
}

const RECONNECT = { initialDelayMs: 200, maxDelayMs: 1_000 }

export const waitFor = async (
	condition: () => boolean,
	description: string,
	timeoutMs = 30_000
): Promise<void> => {
	const deadline = Date.now() + timeoutMs
	while (!condition()) {
		if (Date.now() > deadline) {
			throw new Error(
				`Timed out after ${timeoutMs}ms waiting for: ${description}`
			)
		}
		await new Promise((resolve) => setTimeout(resolve, 50))
	}
}

const describeState = (state: StreamState) => JSON.stringify(state)

const startWorker = async (env: FaultEnvironment) => {
	const client = new ZeebeGrpcClient({
		config: {
			ZEEBE_GRPC_ADDRESS: env.proxy.grpcAddress,
			CAMUNDA_LOG_LEVEL: 'none',
		},
	})
	const handled: string[] = []
	const streamErrors: Error[] = []
	const streamEnds: number[] = []
	const reconnects: number[] = []
	const handle = await client.streamJobs({
		type: env.jobType,
		worker: 'fault-injection-worker',
		tenantIds: ['<default>'],
		taskHandler: (job) => {
			handled.push(job.key)
			return job.complete({})
		},
		inputVariableDto: class {
			foo!: string
		},
		fetchVariables: [],
		timeout: 30_000,
		pollInterval: 0,
		streamReconnect: RECONNECT,
		onStreamError: (e) => void streamErrors.push(e),
		onStreamEnd: () => void streamEnds.push(streamEnds.length + 1),
		onStreamReconnect: (attempt) => void reconnects.push(attempt),
	})
	const failures = () => streamErrors.length + streamEnds.length
	return { client, handle, handled, failures, reconnects }
}

/**
 * The connection is cut once and the gateway stays reachable. The caller is
 * told, the stream is re-opened, and a job created afterwards is handled by
 * the stream.
 */
export const severAndRecover = async (env: FaultEnvironment) => {
	const { client, handle, handled, failures, reconnects } =
		await startWorker(env)
	try {
		await env.waitForStream()
		await env.produceJob()
		await waitFor(() => handled.length === 1, 'the first job is handled')

		expect(
			env.proxy.sever(),
			'there was a connection to sever'
		).toBeGreaterThan(0)
		await waitFor(
			() => failures() >= 1,
			'the caller is told that the stream died'
		)
		await waitFor(
			() => reconnects.length >= 1 && handle.state.status === 'open',
			'the stream is re-opened'
		)
		await env.waitForStream()

		await env.produceJob()
		await waitFor(
			() => handled.length === 2,
			`a job created after recovery is handled (state ${describeState(
				handle.state
			)})`
		)
		expect(handle.state).toEqual({ status: 'open' })
	} finally {
		handle.close()
		await expect(handle.done).resolves.toEqual({ kind: 'closed-by-caller' })
		await client.close()
	}
}

/**
 * The gateway is unreachable for a while: the worker keeps retrying with
 * backoff, reports each failure, and when the gateway is back it recovers and
 * handles the job that was created during the outage.
 */
export const outageAndRecover = async (env: FaultEnvironment) => {
	const { client, handle, handled, failures, reconnects } =
		await startWorker(env)
	try {
		await env.waitForStream()

		env.proxy.pause()
		await waitFor(() => failures() >= 3, 'the outage is reported repeatedly')
		expect(handle.state.status).toBe('reconnecting')
		await env.produceJob()
		expect(handled, 'nothing is handled during the outage').toEqual([])

		env.proxy.resume()
		await waitFor(
			() => handled.length === 1,
			`the job created during the outage is handled (state ${describeState(
				handle.state
			)})`,
			60_000
		)
		await waitFor(
			() => handle.state.status === 'open',
			'the stream is open again'
		)
		expect(reconnects.length).toBeGreaterThanOrEqual(1)
	} finally {
		handle.close()
		await client.close()
	}
}

/**
 * Closing the client during an outage stops the retries: the gateway side sees
 * no further connection attempts.
 */
export const closeStopsReconnecting = async (env: FaultEnvironment) => {
	const { client, handle, failures } = await startWorker(env)
	try {
		await env.waitForStream()
		env.proxy.pause()
		await waitFor(() => failures() >= 1, 'the outage is reported')
		await client.close()
		await new Promise((resolve) => setTimeout(resolve, 500))
		const settled = env.proxy.acceptedConnections

		await new Promise((resolve) =>
			setTimeout(resolve, 3 * RECONNECT.maxDelayMs)
		)
		expect(
			env.proxy.acceptedConnections,
			'no connection attempts after the client is closed'
		).toBe(settled)
		await expect(handle.done).resolves.toEqual({ kind: 'client-closed' })
	} finally {
		handle.close()
	}
}
