import {
	CamundaEnvironmentConfigurator,
	EnvironmentSetup,
	EnvironmentStorage,
} from '../../lib'
import { GrpcClient, MiddlewareSignals } from '../../zeebe/lib/GrpcClient'

let storage: EnvironmentStorage = {}

beforeAll(() => (storage = EnvironmentSetup.storeEnv()))
beforeEach(() => EnvironmentSetup.wipeEnv())
afterAll(() => EnvironmentSetup.restoreEnv(storage))

describe('GrpcClient stream-setup failure logging', () => {
	it.each([
		{
			name: 'an OAuth error_description echoing a secret in free text',
			thrown: new Error(
				'Error requesting token for Client Id zeebe-client: Supplied value logging-secret was rejected'
			),
		},
		{
			name: 'a provider rejecting with a non-Error string',
			thrown: 'Supplied value logging-secret was rejected',
		},
	])(
		'emits a fixed log message and preserves the original failure: $name',
		async ({ thrown }) => {
			const grpc = new GrpcClient({
				config: CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
					CAMUNDA_OAUTH_DISABLED: true,
				}),
				connectionTolerance: 100,
				host: 'localhost:1',
				loglevel: 'NONE',
				namespace: 'GrpcClientLoggingTest',
				oAuth: {
					getHeaders: async () => {
						throw thrown
					},
				},
				options: { longPoll: 100 },
				packageName: 'gateway_protocol',
				protoPath: 'src/proto/zeebe.proto',
				service: 'Gateway',
				stdout: console,
				useTLS: false,
			})
			const errors: string[] = []
			grpc.on(MiddlewareSignals.Log.Error, (message: string) =>
				errors.push(message)
			)

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const result = await (grpc as any).topologyStream({})

			// The original failure is preserved for the caller...
			expect(result.error).toBe(thrown)
			// ...but the application logger receives a fixed, secret-free message.
			const logged = errors.join('\n')
			expect(logged).toContain('gRPC stream setup failed for topology')
			expect(logged).not.toContain('logging-secret')
			expect(logged).not.toContain('zeebe-client')

			await grpc.close()
		}
	)
})
