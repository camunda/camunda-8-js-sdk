import { FakeZeebeGateway } from '../../test-support/FakeZeebeGateway'
import { TcpFaultProxy } from '../../test-support/TcpFaultProxy'
import { allowAny } from '../../test-support/testTags'
import {
	FaultEnvironment,
	closeStopsReconnecting,
	outageAndRecover,
	severAndRecover,
	waitFor,
} from '../../test-support/streamFaultScenarios'

/**
 * The fault-injection scenarios of the StreamJobs integration test, run in the
 * unit-test job against a fake gateway: a real gRPC server, real grpc-js client
 * streams and a real TCP connection that is cut by a proxy. This is the part
 * of the integration test that can be verified without a broker.
 */

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 90_000 })

const JOB_TYPE = 'fault-injection-job'

const withEnvironment = async (
	run: (env: FaultEnvironment, gateway: FakeZeebeGateway) => Promise<void>
) => {
	const gateway = await FakeZeebeGateway.start()
	const proxy = await TcpFaultProxy.start({
		host: '127.0.0.1',
		port: gateway.port,
	})
	try {
		await run(
			{
				proxy,
				jobType: JOB_TYPE,
				produceJob: async () => void gateway.offerJob(JOB_TYPE, { foo: 'bar' }),
				waitForStream: () =>
					waitFor(
						() => gateway.openStreams >= 1,
						'the gateway has the job stream',
						15_000
					),
			},
			gateway
		)
	} finally {
		await proxy.close()
		await gateway.close()
	}
}

describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'streamJobs fault injection against a fake gateway',
	() => {
		test('recovers and handles jobs after the connection is severed', async () => {
			await withEnvironment(async (env, gateway) => {
				await severAndRecover(env)
				expect(
					gateway.streamCalls,
					'the stream was re-opened'
				).toBeGreaterThanOrEqual(2)
			})
		})

		test('keeps retrying through an outage and recovers when the gateway is back', async () => {
			await withEnvironment(outageAndRecover)
		})

		test('stops retrying when the client is closed during an outage', async () => {
			await withEnvironment(closeStopsReconnecting)
		})
	}
)
