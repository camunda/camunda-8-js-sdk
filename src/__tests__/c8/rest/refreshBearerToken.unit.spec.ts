import path from 'path'

import { Server, ServerCredentials, loadPackageDefinition } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'

import { Camunda8 } from '../../../c8'
import {
	BrokerInfo,
	Partition,
	TopologyResponse,
} from '../../../generated/zeebe_pb'
import { BearerAuthProvider } from '../../../oauth'

test('it can refresh the bearer token with a custom OAuth provider', async () => {
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
				Topology: (_, callback) => {
					const t = new TopologyResponse()
					const b = new BrokerInfo()
					b.setHost('localhost')
					const partition = new Partition()
					partition.setHealth(0)
					partition.setPartitionid(0)
					partition.setRole(0)
					b.setPartitionsList([partition])
					t.setBrokersList([b])
					currentToken = _.metadata.get('authorization')[0]
					callback(null, t)
				},
				// Implement your service methods here
			})

			const credentials = ServerCredentials.createInsecure()
			// Start the server
			server.bindAsync('localhost:50051', credentials, (err, port) => {
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
		ZEEBE_ADDRESS: `localhost:${port}`,
		CAMUNDA_SECURE_CONNECTION: false,
		zeebeGrpcSettings: {
			ZEEBE_CLIENT_LOG_LEVEL: 'NONE',
			ZEEBE_INSECURE_CONNECTION: true,
		},
	})
	await zbc.topology()
	expect(currentToken).toEqual('Bearer newToken')
	bearerAuth.setToken('somethingElse')
	await zbc.topology()
	expect(currentToken).toEqual('Bearer somethingElse')
	server.tryShutdown((e) => e && console.error(e))
})
