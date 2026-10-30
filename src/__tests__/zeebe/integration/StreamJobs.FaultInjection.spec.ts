import { CamundaEnvironmentConfigurator } from '../../../lib/Configuration'
import { parseZeebeGrpcAddress } from '../../../lib/ZeebeGrpcAddressUtils'
import { TcpFaultProxy } from '../../../test-support/TcpFaultProxy'
import { allowAny } from '../../../test-support/testTags'
import {
	FaultEnvironment,
	closeStopsReconnecting,
	outageAndRecover,
	severAndRecover,
} from '../../../test-support/streamFaultScenarios'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

/**
 * Fault injection for streamJobs against a real broker.
 *
 * A TCP proxy sits between the SDK and the gateway, and the tests cut the
 * connection the way a gateway restart or a network fault would. They assert
 * what unit tests with a mocked stream cannot: that the caller is told, that
 * the worker re-opens the stream, and that jobs created afterwards are handled
 * by the worker.
 *
 * Needs a plaintext, unauthenticated gateway (`grpc://`, auth strategy NONE),
 * which is what the self-managed docker-compose stacks used by CI provide.
 * Process instances and deployment bypass the proxy.
 */

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 90_000 })

const JOB_TYPE = 'stream-job-fault-injection'
const runs = allowAny([{ deployment: 'self-managed', security: 'unsecured' }])

let direct: ZeebeGrpcClient
let proxy: TcpFaultProxy
let bpmnProcessId: string
let processDefinitionKey: string

beforeAll(async () => {
	if (!runs) return
	direct = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })
	;({ bpmnProcessId, processDefinitionKey } = (
		await direct.deployResource({
			processFilename: './src/__tests__/testdata/StreamJobsFaultInjection.bpmn',
		})
	).deployments[0].process)
	await cancelProcesses(processDefinitionKey)

	// The proxy targets the gateway the test environment is configured with.
	const { hostPort } = parseZeebeGrpcAddress(
		CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({})
			.ZEEBE_GRPC_ADDRESS ?? 'grpc://localhost:26500'
	)
	const [host, port] = hostPort.split(':')
	proxy = await TcpFaultProxy.start({ host, port: Number(port) })
})

afterEach(async () => {
	if (!runs) return
	proxy.resume()
	await cancelProcesses(processDefinitionKey)
})

afterAll(async () => {
	if (!runs) return
	await cancelProcesses(processDefinitionKey)
	await proxy.close()
	await direct.close()
})

const environment = (): FaultEnvironment => ({
	proxy,
	jobType: JOB_TYPE,
	produceJob: async () => {
		await direct.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})
	},
	// The gateway does not say when it has registered a stream; give it time,
	// as the other StreamJobs tests do.
	waitForStream: () => new Promise((resolve) => setTimeout(resolve, 2000)),
})

test.runIf(runs)(
	'Recovers and handles jobs after the gateway connection is severed',
	async () => {
		await severAndRecover(environment())
	}
)

test.runIf(runs)(
	'Keeps retrying through a gateway outage and recovers when it is back',
	async () => {
		await outageAndRecover(environment())
	}
)

test.runIf(runs)(
	'Stops retrying when the client is closed during an outage',
	async () => {
		await closeStopsReconnecting(environment())
	}
)
