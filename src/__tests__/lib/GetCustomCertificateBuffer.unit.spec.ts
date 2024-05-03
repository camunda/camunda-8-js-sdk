import fs from 'fs'
import https from 'https'
import path from 'path'

import { loadPackageDefinition, Server, ServerCredentials } from '@grpc/grpc-js'
import { loadSync } from '@grpc/proto-loader'
import express from 'express'

import {
	BrokerInfo,
	Partition,
	TopologyResponse,
} from '../../generated/zeebe_pb'
import { OperateApiClient } from '../../operate'
import { ZeebeGrpcClient } from '../../zeebe'

test('Can use a custom root certificate to connect to a REST API', async () => {
	const app = express()

	app.get('/v1/process-instances/:processInstanceKey', (_, res) => {
		res.json({ bpmnProcessId: 'test' })
	})

	const options = {
		key: fs.readFileSync(path.join(__dirname, 'localhost.key')),
		cert: fs.readFileSync(path.join(__dirname, 'localhost.crt')),
	}

	const server = https.createServer(options, app)

	server.listen(3012, () => {
		// console.log('Server listening on port 3012')
		// server.close()
		// done()
	})

	const c = new OperateApiClient({
		config: {
			CAMUNDA_CUSTOM_ROOT_CERT_PATH: path.join(__dirname, 'localhost.crt'),
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'https://localhost:3012',
		},
	})

	const res = await c.getProcessInstance('1')
	expect(res.bpmnProcessId).toBe('test')
	const c1 = new OperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'https://localhost:3012',
		},
	})

	let threw = false
	try {
		await c1.getProcessInstance('1')
	} catch (e) {
		threw = true
		expect((e as { code: string }).code).toBe('DEPTH_ZERO_SELF_SIGNED_CERT')
	}
	expect(threw).toBe(true)
	server.close()
})

test('gRPC server with self-signed certificate', (done) => {
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

	// Read the key and certificate
	const key = fs.readFileSync(path.join(__dirname, 'localhost.key'))
	const cert = fs.readFileSync(path.join(__dirname, 'localhost.crt'))

	// Start the server
	server.bindAsync(
		'localhost:50051',
		ServerCredentials.createSsl(null, [
			{
				private_key: key,
				cert_chain: cert,
			},
		]),
		(err) => {
			if (err) {
				console.error(err)
				done()
				return
			}

			const zbc = new ZeebeGrpcClient({
				config: {
					CAMUNDA_OAUTH_DISABLED: true,
					ZEEBE_ADDRESS: 'localhost:50051',
					CAMUNDA_CUSTOM_ROOT_CERT_PATH: path.join(__dirname, 'localhost.crt'),
					CAMUNDA_SECURE_CONNECTION: true,
					zeebeGrpcSettings: {
						ZEEBE_CLIENT_LOG_LEVEL: 'NONE',
					},
				},
			})
			zbc.topology().then(() => {
				expect(true).toBe(true)
				zbc.close()
				// Stop the server after the test
				server.tryShutdown((err) => {
					if (err) console.error(err)
					done()
				})
			})
			// const zbc2 = new ZeebeGrpcClient({
			// 	config: {
			// 		CAMUNDA_OAUTH_DISABLED: true,
			// 		ZEEBE_ADDRESS: 'localhost:50051',
			// 	},
			// })
			// zbc2.topology().catch((e) => {
			// 	console.log(e)
			// 	zbc2.close()
			// })
		}
	)
})
