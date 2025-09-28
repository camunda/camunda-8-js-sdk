import fs from 'fs'
import path from 'path'

import { loadPackageDefinition, Server, ServerCredentials } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'

import {
	BrokerInfo,
	Partition,
	TopologyResponse,
} from '../../generated/zeebe_pb'
import {
	EnvironmentSetup,
	EnvironmentStorage,
} from '../../lib/EnvironmentSetup'
import { ZeebeGrpcClient } from '../../zeebe'

vi.setConfig({ testTimeout: 20_000 })

let storage: EnvironmentStorage = {}
/** Store all env vars, then wipe them in the environment */
beforeAll(() => {
	storage = EnvironmentSetup.storeEnv()
})

beforeAll(() => {
	EnvironmentSetup.wipeEnv()
})

beforeEach(() => {
	EnvironmentSetup.wipeEnv()
	vi.resetModules()
})

/** Restore all env vars */
afterAll(() => EnvironmentSetup.restoreEnv(storage))

let server
afterEach(() => {
	;(server && server.close && server.close()) ||
		(server &&
			server.tryShutdown &&
			server.tryShutdown((err) => {
				if (err) {
					throw err
				}
			}))
})

const serverCertFile = path.join(__dirname, 'localhost.crt')
const serverKeyFile = path.join(__dirname, 'localhost.key')

function createServer(): Promise<{ server: Server; port: number }> {
	return new Promise((resolve, reject) => {
		// Read the key and certificate
		const key = fs.readFileSync(serverKeyFile)
		const cert = fs.readFileSync(serverCertFile)

		const credentials = ServerCredentials.createSsl(null, [
			{
				private_key: key,
				cert_chain: cert,
			},
		])
		// Load the protobuf definition
		const packageDefinition = loadSync(
			path.join(__dirname, '..', '..', 'proto', 'zeebe.proto'),
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
				callback(null, t)
			},
			// Implement your service methods here
		})

		// Start the server
		server.bindAsync('localhost:0', credentials, (err, port) => {
			if (err) {
				reject(err)
			}
			resolve({ server, port })
		})
	})
}

test('can communicate with a gRPC server with self-signed certificate', async () => {
	const { server, port } = await createServer()
	// Create a client with the public self-signed certificate
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			ZEEBE_GRPC_ADDRESS: `localhost:${port}`,
			CAMUNDA_CUSTOM_ROOT_CERT_PATH: serverCertFile,
			CAMUNDA_SECURE_CONNECTION: true,
			zeebeGrpcSettings: {
				ZEEBE_CLIENT_LOG_LEVEL: 'NONE',
				ZEEBE_INSECURE_CONNECTION: false,
			},
		},
	})
	const topology = await zbc.topology()
	await zbc.close()
	server.tryShutdown((err) => {
		if (err) throw err
		// Stop the server after the test
	})
	expect(topology).toBeDefined()
})

test('can connect to a gRPC server with self-signed certificate provided via string', async () => {
	const { server, port } = await createServer()
	const serverCertString = fs.readFileSync(serverCertFile).toString()

	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			ZEEBE_GRPC_ADDRESS: `grpcs://localhost:${port}`,
			CAMUNDA_CUSTOM_ROOT_CERT_STRING: serverCertString,
			zeebeGrpcSettings: {
				ZEEBE_CLIENT_LOG_LEVEL: 'NONE',
				ZEEBE_INSECURE_CONNECTION: false,
			},
		},
	})
	const toplogy = await zbc.topology()
	await zbc.close()
	server.tryShutdown((err) => {
		if (err) throw err
		// Stop the server after the test
	})
	expect(toplogy).toBeDefined()
})
