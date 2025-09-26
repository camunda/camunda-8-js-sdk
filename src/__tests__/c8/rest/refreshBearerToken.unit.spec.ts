import path from 'path'

import { Server, ServerCredentials, loadPackageDefinition } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'

import { Camunda8 } from '../../../c8'
import { BearerAuthProvider } from '../../../oauth'
import { matrix } from '../../../test-support/testTags'

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('it can refresh the bearer token with a custom OAuth provider', async () => {
	let currentToken = ''

	function createServer(): Promise<{ server: Server; port: number }> {
		return new Promise((resolve, reject) => {
			// Load the protobuf definition
			const packageDefinition = loadSync(
				path.join(__dirname, '..', '..', '..', 'proto', 'zeebe.proto'),
				{
					keepCase: true,
					longs: String,
					enums: String,
					defaults: true,
					oneofs: true,
				}
			)

			const zeebeProto = loadPackageDefinition(
				packageDefinition
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
			) as unknown as { gateway_protocol: { Gateway: any } }

			// Create the server
			const server = new Server()

			// Add a service to the server
			server.addService(zeebeProto.gateway_protocol.Gateway.service, {
				Topology: (call, callback) => {
					const t = new TopologyResponse()
					const b = new BrokerInfo()
					b.setHost('localhost')
					const partition = new Partition()
					partition.setHealth(0)
					partition.setPartitionid(0)
					partition.setRole(0)
					b.setPartitionsList([partition])
					t.setBrokersList([b])
					const authHeader = call.metadata.get('authorization')
					currentToken = authHeader.length > 0 ? authHeader[0] : ''
					callback(null, t)
				},
				// Implement your service methods here
			})

			const credentials = ServerCredentials.createInsecure()
			// Start the server - use port 0 to bind to any available port
			server.bindAsync('localhost:0', credentials, (err, port) => {
				if (err) {
					reject(err)
				}
				resolve({ server, port })
			})
		})
	}

	const bearerAuth = new BearerAuthProvider({
		config: {
			CAMUNDA_OAUTH_TOKEN: 'initialToken',
		},
	})

	const c8 = new Camunda8({ oAuthProvider: bearerAuth })
	bearerAuth.setToken('newToken')
	const { server, port } = await createServer()
	const zbc = c8.getZeebeGrpcApiClient({
		CAMUNDA_OAUTH_DISABLED: true,
		ZEEBE_GRPC_ADDRESS: `grpc://localhost:${port}`,
		zeebeGrpcSettings: {
			ZEEBE_CLIENT_LOG_LEVEL: 'NONE',
		},
	})
	await zbc.topology()
	expect(currentToken).toEqual('Bearer newToken')
	bearerAuth.setToken('somethingElse')
	await zbc.topology()
	expect(currentToken).toEqual('Bearer somethingElse')
	server.tryShutdown((e) => e && console.error(e))
})
