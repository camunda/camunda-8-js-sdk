import http from 'http'
import jwt from 'jsonwebtoken'
import type net from 'node:net'
import { promisify } from 'node:util'

function signAccessToken(payload: any, secret: string, ttl: number) {
	return jwt.sign(payload, secret, { expiresIn: ttl })
}

let expiryTimerHandle: NodeJS.Timeout

export type HttpTestServer = http.Server & {
	stop: () => Promise<void>
	port: number
	request_body: string
}

export const createHttpTestServer = async () => {
	clearInterval(expiryTimerHandle)

	const secret = 'YOUR_SECRET'
	const ttl = 2 // 2 seconds
	const payload = { id: 1 }
	let access_token = signAccessToken(payload, secret, ttl)

	expiryTimerHandle = setInterval(() => {
		payload.id++
		access_token = signAccessToken(payload, secret, ttl)
	}, 2000)

	const server: HttpTestServer = http.createServer((req, res) => {
		if (req.method === 'POST') {
			let body = ''
			req.on('data', (chunk) => {
				body += chunk
			})

			req.on('end', () => {
				res.writeHead(200, { 'Content-Type': 'application/json' })
				server.request_body = body
				res.end(`{"access_token": "${access_token}", "expires_in": ${ttl}}`)
			})
		}
	}) as HttpTestServer

	await promisify(server.listen.bind(server))()
	server.port = (server.address() as net.AddressInfo).port
	server.stop = async () => {
		clearInterval(expiryTimerHandle)
		return promisify(server.close.bind(server))()
	}
	return server
}
