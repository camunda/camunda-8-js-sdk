import fs from 'fs'
import https from 'https'
import path from 'path'

import express from 'express'

import { OperateApiClient } from '../../operate'

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

test('Can use a custom TLS certificate to connect to a REST API secured with a self-signed certificate', async () => {
	const app = express()

	app.get('/v1/process-instances/:processInstanceKey', (_, res) => {
		res.json({ bpmnProcessId: 'test' })
	})

	const options = {
		key: fs.readFileSync(serverKeyFile),
		cert: fs.readFileSync(serverCertFile),
	}

	// This server is instantiated with TLS enabled using the self-signed certificate
	server = https.createServer(options, app)

	server.listen(3012)

	// This Operate Client is instantiated with the self-signed certificate
	const c = new OperateApiClient({
		config: {
			CAMUNDA_CUSTOM_ROOT_CERT_PATH: serverCertFile,
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'https://localhost:3012',
		},
	})
	const res = await c.getProcessInstance('1')
	// The call to the secured to the server with the client using the self-signed certificate should succeed
	expect(res.bpmnProcessId).toBe('test')
	server.close()
})
// Now we instantiate a client that does not have the public key for the self-signed certificate
const c1 = new OperateApiClient({
	config: {
		CAMUNDA_OAUTH_DISABLED: true,
		CAMUNDA_OPERATE_BASE_URL: 'https://localhost:3012',
	},
})

test('Cannot connect to a REST API secured with a self-signed certificate if not provided the correct key', async () => {
	const app = express()

	app.get('/v1/process-instances/:processInstanceKey', (_, res) => {
		res.json({ bpmnProcessId: 'test' })
	})

	const serverOptions = {
		key: fs.readFileSync(path.join(__dirname, 'localhost.key')),
		cert: fs.readFileSync(path.join(__dirname, 'localhost.crt')),
	}

	// This server is instantiated with TLS enabled using the self-signed certificate
	server = https.createServer(serverOptions, app)

	server.listen(3012)
	let threw = false
	try {
		// This call should fail with an error that the server has a self-signed certificate
		await c1.getProcessInstance('1')
	} catch (e) {
		threw = true
		const correctErrorOnLinux =
			(e as { code: string }).code === 'DEPTH_ZERO_SELF_SIGNED_CERT'
		const correctErrorOnWindows =
			(e as { code: string }).code === 'self-signed certificate'
		expect(correctErrorOnLinux || correctErrorOnWindows).toBe(true)
	}
	expect(threw).toBe(true)
	server.close()
})
