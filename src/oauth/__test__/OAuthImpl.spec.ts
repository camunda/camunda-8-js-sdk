import fs from 'fs'
import http from 'http'
import path from 'path'

import { OAuthProviderImpl } from '../lib/OAuthProviderImpl'

jest.setTimeout(10000)

const STORED_ENV = {}
const ENV_VARS_TO_STORE = [
	'CAMUNDA_TOKEN_CACHE_DIR',
	'CAMUNDA_TOKEN_CACHE',
	'CAMUNDA_TOKEN_SCOPE',
]

beforeAll(() => {
	ENV_VARS_TO_STORE.forEach((e) => {
		STORED_ENV[e] = process.env[e]
		delete process.env[e]
	})
})

afterAll(() => {
	ENV_VARS_TO_STORE.forEach((e) => {
		delete process.env[e]
		if (STORED_ENV[e]) {
			process.env[e] = STORED_ENV[e]
		}
	})
})

test('Gets the token cache dir from the environment', () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	if (fs.existsSync(tokenCacheDir)) {
		fs.rmSync(tokenCacheDir, {
			recursive: true,
			force: true,
		})
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	const o = new OAuthProviderImpl({
		audience: 'token',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'url',
		userAgentString: 'test',
	})
	expect(o).toBeTruthy()
	expect(fs.existsSync(tokenCacheDir)).toBe(true)
	if (fs.existsSync(tokenCacheDir)) {
		fs.rmdirSync(tokenCacheDir)
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

test('Creates the token cache dir if it does not exist', () => {
	process.env.CAMUNDA_TOKEN_CACHE_DIR = path.join(process.cwd(), '.token-cache')
	const tokenCacheDir = OAuthProviderImpl.getTokenCacheDirFromEnv()
	if (fs.existsSync(tokenCacheDir)) {
		fs.rmSync(tokenCacheDir, {
			recursive: true,
			force: true,
		})
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(false)

	const o = new OAuthProviderImpl({
		audience: 'token',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'url',
		userAgentString: 'test',
	})
	expect(o).toBeTruthy()
	expect(fs.existsSync(tokenCacheDir)).toBe(true)
	if (fs.existsSync(tokenCacheDir)) {
		fs.rmdirSync(tokenCacheDir)
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

test('Throws in the constructor if the token cache is not writable', () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	if (fs.existsSync(tokenCacheDir)) {
		fs.rmSync(tokenCacheDir, {
			recursive: true,
			force: true,
		})
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
	fs.mkdirSync(tokenCacheDir, 0o400)
	expect(fs.existsSync(tokenCacheDir)).toBe(true)
	let thrown = false
	try {
		const o = new OAuthProviderImpl({
			audience: 'token',
			clientId: 'clientId',
			// file deepcode ignore HardcodedNonCryptoSecret/test: <please specify a reason of ignoring this>
			clientSecret: 'clientSecret',
			authServerUrl: 'url',
			userAgentString: 'test',
		})
		expect(o).toBeTruthy()
	} catch {
		thrown = true
	}
	expect(thrown).toBe(true)
	if (fs.existsSync(tokenCacheDir)) {
		fs.rmdirSync(tokenCacheDir)
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

// Added test for https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
// Updated test for https://github.com/camunda-community-hub/camunda-8-js-sdk/issues/3
// "Remove expiry timer from oAuth token implementation"
test('In-memory cache is populated and evicted after timeout', (done) => {
	const delay = (timeout: number) =>
		new Promise((res) => setTimeout(() => res(null), timeout))

	const o = new OAuthProviderImpl({
		audience: 'token',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'http://127.0.0.1:3002',
		userAgentString: 'test',
	})
	let requestCount = 0
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					const expiresIn = 2 // seconds
					res.end(
						`{"access_token": "${requestCount++}", "expires_in": ${expiresIn}}`
					)
					expect(body).toEqual(
						'audience=token&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials'
					)
				})
			}
		})
		.listen(3002)

	o.getToken('CONSOLE').then(async (token) => {
		expect(token).toBe('0')
		await delay(500)
		const token2 = await o.getToken('CONSOLE')
		expect(token2).toBe('0')
		await delay(1600)
		const token3 = await o.getToken('CONSOLE')
		expect(token3).toBe('1')
		server.close(() => done())
	})
})

test('Uses form encoding for request', (done) => {
	const o = new OAuthProviderImpl({
		audience: 'token',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'http://127.0.0.1:3001',
		userAgentString: 'test',
	})
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end('{"token": "something"}')
					server.close()
					expect(body).toEqual(
						'audience=token&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials'
					)
					done()
				})
			}
		})
		.listen(3001)
	o.getToken('CONSOLE').finally(() => server.close())
})

test('Passes scope, if provided', () => {
	const o = new OAuthProviderImpl({
		audience: 'token',
		scope: 'scope',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'http://127.0.0.1:3002',
		userAgentString: 'test',
	})
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end('{"token": "something"}')

					expect(body).toEqual(
						'audience=token&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials&scope=scope'
					)
				})
			}
		})
		.listen(3002)

	return o.getToken('CONSOLE').finally(() => {
		return server.close()
	})
})

test('Can get scope from environment', () => {
	process.env.CAMUNDA_TOKEN_SCOPE = 'scope2'
	const o = new OAuthProviderImpl({
		audience: 'token',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'http://127.0.0.1:3003',
		userAgentString: 'test',
	})
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end('{"token": "something"}')

					expect(body).toEqual(
						'audience=token&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials&scope=scope2'
					)
				})
			}
		})
		.listen(3003)

	return o.getToken('CONSOLE').finally(() => {
		return server.close()
	})
})
