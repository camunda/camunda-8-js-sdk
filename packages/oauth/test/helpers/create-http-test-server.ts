import http from 'node:http'
import type net from 'node:net'
import {promisify} from 'node:util'
import jwt from 'jsonwebtoken'

function signAccessToken(
	payload: Record<string, unknown>,
	secret: string,
	ttl: number,
) {
	return jwt.sign(payload, secret, {expiresIn: ttl})
}

let expiryTimerHandle: NodeJS.Timeout

export type HttpTestServer = http.Server & {
	stop: () => Promise<void>;
	port: number;
	request_body: string;
}

export const createHttpTestServer = async () => {
	clearInterval(expiryTimerHandle)

	const secret = 'YOUR_SECRET'
	const ttl = 2 // 2 seconds
	const payload = {id: 1}
	let accessToken = signAccessToken(payload, secret, ttl)

	expiryTimerHandle = setInterval(() => {
		payload.id++
		accessToken = signAccessToken(payload, secret, ttl)
	}, 2000)

	const server: HttpTestServer = http.createServer((request, response) => {
		if (request.method === 'POST') {
			let body = ''
			request.on('data', (chunk: string) => {
				body += chunk
			})

			request.on('end', () => {
				response.writeHead(200, {'Content-Type': 'application/json'})
				server.request_body = body
				response.end(`{"access_token": "${accessToken}", "expires_in": ${ttl}}`)
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
