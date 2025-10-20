import { execSync } from 'child_process'
import fs from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import os from 'os'
import path from 'path'

import auth from 'basic-auth'
import debug from 'debug'
import got, { HTTPError } from 'got'
import jwt from 'jsonwebtoken'

const trace = debug('test:oauth')

import {
	EnvironmentSetup,
	EnvironmentStorage,
} from '../../lib/EnvironmentSetup'

vi.setConfig({ testTimeout: 10_000 })
let storedEnvironment: EnvironmentStorage

beforeAll(() => {
	storedEnvironment = EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})

beforeEach(() => {
	// We reset the modules to ensure a clean state for each test
	// This is important because the tests modify the environment variables
	// and the SDK reads the environment variables at runtime when the module is loaded
	// See: https://github.com/camunda/camunda-8-js-sdk/issues/451
	vi.resetModules()
	EnvironmentSetup.wipeEnv()
})

afterAll(() => {
	EnvironmentSetup.restoreEnv(storedEnvironment)
})

test('Throws in the constructor if there in no clientId credentials', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}

	let thrown = false
	let message = ''
	try {
		new OAuthProvider({
			config: { CAMUNDA_OAUTH_URL: 'url' },
		})
	} catch (e) {
		thrown = true
		message = (e as Error).message
	}
	expect(thrown).toBe(true)
	expect(
		message.includes('ZEEBE_CLIENT_ID') &&
			message.includes('CAMUNDA_CONSOLE_CLIENT_ID')
	).toBe(true)
})

test('Throws in the constructor if there in no clientSecret credentials', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	let thrown = false
	let message = ''
	try {
		new OAuthProvider({
			config: {
				CAMUNDA_CONSOLE_CLIENT_ID: 'clientId1',
				CAMUNDA_OAUTH_URL: 'url',
			},
		})
	} catch (e) {
		thrown = true
		message = (e as Error).message
	}
	expect(thrown).toBe(true)
	expect(
		message.includes('ZEEBE_CLIENT_SECRET') &&
			message.includes('CAMUNDA_CONSOLE_CLIENT_SECRET')
	).toBe(true)
})

test('Throws in the constructor if there are insufficient credentials', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	let thrown = false
	let message = ''
	try {
		new OAuthProvider({
			config: {
				CAMUNDA_CONSOLE_CLIENT_ID: 'clientId2',
				ZEEBE_CLIENT_SECRET: 'zeebe-secret',
				CAMUNDA_OAUTH_URL: 'url',
			},
		})
	} catch (e) {
		thrown = true
		message = (e as Error).message
	}
	expect(thrown).toBe(true)
	expect(
		message.includes('client ID') && message.includes('client secret')
	).toBe(true)
})

test('Gets the token cache dir from the environment', async () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	OAuthProvider.clearCacheDir(tokenCacheDir)
	expect(fs.existsSync(tokenCacheDir)).toBe(false)

	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId3',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})
	expect(o).toBeTruthy()
	const exists = fs.existsSync(tokenCacheDir)
	expect(exists).toBe(true)
	OAuthProvider.clearCacheDir(tokenCacheDir)

	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

test('Creates the token cache dir if it does not exist', async () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	OAuthProvider.clearCacheDir(tokenCacheDir)
	expect(fs.existsSync(tokenCacheDir)).toBe(false)

	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId4',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	expect(o).toBeTruthy()
	expect(fs.existsSync(tokenCacheDir)).toBe(true)
	OAuthProvider.clearCacheDir(tokenCacheDir)

	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

test('Throws in the constructor if the token cache is not writable', async () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	OAuthProvider.clearCacheDir(tokenCacheDir)

	expect(fs.existsSync(tokenCacheDir)).toBe(false)
	if (os.platform() === 'win32') {
		fs.mkdirSync(tokenCacheDir)
		expect(fs.existsSync(tokenCacheDir)).toBe(true)
		// Make the directory read-only on Windows
		// Note that this requires administrative privileges
		execSync(`icacls ${tokenCacheDir} /deny Everyone:(OI)(CI)W /inheritance:r`)
	} else {
		// Make the directory read-only on Unix
		fs.mkdirSync(tokenCacheDir, 0o400)
		expect(fs.existsSync(tokenCacheDir)).toBe(true)
	}

	let thrown = false
	try {
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId5',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'url',
			},
		})
		expect(o).toBeTruthy()
	} catch {
		thrown = true
	}

	// Make the directory writeable on Windows, so it can be deleted
	// Note that this requires administrative privileges
	if (os.platform() === 'win32') {
		execSync(`icacls ${tokenCacheDir} /grant Everyone:(OI)(CI)(F)`)
	}
	OAuthProvider.clearCacheDir(tokenCacheDir)
	expect(thrown).toBe(true)
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

// Added test for https://github.com/camunda/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
// Updated test for https://github.com/camunda/camunda-8-js-sdk/issues/3
// "Remove expiry timer from oAuth token implementation"
test('In-memory cache is populated and evicted after expiry', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	// eslint-disable-next-line no-async-promise-executor
	new Promise<void>((done) => {
		const delay = (timeout: number) =>
			new Promise((res) => setTimeout(() => res(null), timeout))
		const secret = 'YOUR_SECRET'
		const ttl = 2 // 2 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })

		// On subsequent requests, we will return a different token
		let requested = false

		const server = http
			.createServer((req, res) => {
				if (req.method === 'POST') {
					req.on('data', (/*chunk*/) => {
						// body += chunk
						trace('data')
						// This function does nothing, but if no listener is registered then the server will hang
						// and not call the end event
					})
					req.on('end', () => {
						res.writeHead(200, { 'Content-Type': 'application/json' })
						const expiresIn = 2 // seconds
						const token = requested
							? jwt.sign(payload, secret, { expiresIn: ttl })
							: access_token
						requested = true
						res.end(`{"access_token": "${token}", "expires_in": ${expiresIn}}`)
					})
				}
			})
			.listen()

		const port = (server.address() as AddressInfo).port

		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId6',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS: 0,
			},
		})
		o.getHeaders('ZEEBE').then(async (token) => {
			const token1 = token
			expect(token).toStrictEqual(token1)
			await delay(500)
			const token2 = await o.getHeaders('ZEEBE')
			expect(token2).toStrictEqual(token1)
			await delay(1600)
			const token3 = await o.getHeaders('ZEEBE')
			expect(token3).not.toStrictEqual(token1)
			done()
		})
	})
})

test('Uses form encoding for request', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	new Promise<void>((done) => {
		const secret = 'YOUR_SECRET'
		const ttl = 2 // 2 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		const server = http
			.createServer((req, res) => {
				if (req.method === 'POST') {
					let body = ''
					req.on('data', (chunk) => {
						body += chunk
					})

					req.on('end', () => {
						res.writeHead(200, { 'Content-Type': 'application/json' })
						res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)
						server.close()
						expect(body).toEqual(
							'audience=operate.camunda.io&client_id=clientId8&client_secret=clientSecret&grant_type=client_credentials'
						)
						done()
					})
				}
			})
			.listen()
		const port = (server.address() as AddressInfo).port
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId8',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
			},
		})
		o.getHeaders('OPERATE')
	})
})

test('Uses a custom audience for an Operate token, if one is configured', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	new Promise<void>((done) => {
		const secret = 'YOUR_SECRET'
		const ttl = 2 // 2 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		const server = http
			.createServer((req, res) => {
				if (req.method === 'POST') {
					let body = ''
					req.on('data', (chunk) => {
						body += chunk
					})

					req.on('end', () => {
						res.writeHead(200, { 'Content-Type': 'application/json' })
						res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)
						server.close()
						expect(body).toEqual(
							'audience=custom.operate.audience&client_id=clientId9&client_secret=clientSecret&grant_type=client_credentials'
						)
						done()
					})
				}
			})
			.listen()

		const port = (server.address() as AddressInfo).port
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId9',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
				CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'custom.operate.audience',
			},
		})
		o.getHeaders('OPERATE')
	})
})

test('Passes scope, if provided', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	const secret = 'YOUR_SECRET'
	const ttl = 5 // 5 seconds
	const payload = { id: 1 }
	const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)

					expect(body).toEqual(
						'audience=token&client_id=clientId10&client_secret=clientSecret&grant_type=client_credentials&scope=scope'
					)
				})
			}
		})
		.listen()
	const port = (server.address() as AddressInfo).port
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_SCOPE: 'scope',
			ZEEBE_CLIENT_ID: 'clientId10',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
		},
	})
	return o.getHeaders('ZEEBE')
})

test('Can get scope from environment', async () => {
	process.env.CAMUNDA_TOKEN_SCOPE = 'scope2'
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}

	process.env.CAMUNDA_TOKEN_SCOPE = ''
	const secret = 'YOUR_SECRET'
	const ttl = 5 // 5 seconds
	const payload = { id: 1 }
	const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)

					expect(body).toEqual(
						'audience=token&client_id=clientId11&client_secret=clientSecret&grant_type=client_credentials&scope=scope2'
					)
				})
			}
		})
		.listen()
	const port = (server.address() as AddressInfo).port
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId11',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
		},
	})

	return o.getHeaders('ZEEBE')
})

test('Creates the token cache dir if it does not exist', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	const tokenCache = path.join(__dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		/** force directory removal */
		fs.rmSync(tokenCache, { recursive: true, force: true })
	}
	expect(fs.existsSync(tokenCache)).toBe(false)

	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_CACHE_DIR: tokenCache,
			ZEEBE_CLIENT_ID: 'clientId12',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	expect(o).toBeTruthy()
	expect(fs.existsSync(tokenCache)).toBe(true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	expect(fs.existsSync(tokenCache)).toBe(false)
})

test('Gets the token cache dir from the environment', async () => {
	const tokenCache = path.join(__dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		fs.rmSync(tokenCache, { recursive: true, force: true })
	}
	expect(fs.existsSync(tokenCache)).toBe(false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId13',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	expect(o).toBeTruthy()
	expect(fs.existsSync(tokenCache)).toBe(true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	expect(fs.existsSync(tokenCache)).toBe(false)
})

test('Uses an explicit token cache over the environment', async () => {
	const tokenCache1 = path.join(__dirname, '.token-cache1')
	const tokenCache2 = path.join(__dirname, '.token-cache2')
	;[tokenCache1, tokenCache2].forEach((tokenCache) => {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}
		expect(fs.existsSync(tokenCache)).toBe(false)
	})
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache1
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_CACHE_DIR: tokenCache2,
			ZEEBE_CLIENT_ID: 'clientId14',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	expect(o).toBeTruthy()
	expect(fs.existsSync(tokenCache2)).toBe(true)
	expect(fs.existsSync(tokenCache1)).toBe(false)
	;[tokenCache1, tokenCache2].forEach((tokenCache) => {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}
		expect(fs.existsSync(tokenCache)).toBe(false)
	})
})

test('Can set a custom user agent', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId16',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3005',
			CAMUNDA_CUSTOM_USER_AGENT_STRING: 'modeler',
		},
	})

	expect(o.userAgentString.includes(' modeler')).toBe(true)
})

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test('Passes no audience for Modeler API when self-hosted', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	new Promise<void>((done) => {
		const secret = 'YOUR_SECRET'
		const ttl = 5 // 5 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		const server = http
			.createServer((req, res) => {
				if (req.method === 'POST') {
					let body = ''
					req.on('data', (chunk) => {
						body += chunk
					})

					req.on('end', () => {
						res.writeHead(200, { 'Content-Type': 'application/json' })
						res.end(`{"access_token": "${access_token}"}`)
						expect(body).toEqual(
							'client_id=clientId17&client_secret=clientSecret&grant_type=client_credentials'
						)
						done()
					})
				}
			})
			.listen()
		const port = (server.address() as AddressInfo).port
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId17',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
			},
		})
		o.getHeaders('MODELER')
	})
})

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test('Throws if you try to get a Modeler token from SaaS without console creds', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	let thrown = false
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId18',
			CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'https://login.cloud.camunda.io/oauth/token',
		},
	})

	await o
		.getHeaders('MODELER')
		.catch(() => {
			thrown = true
		})
		.then(() => {
			expect(thrown).toBe(true)
		})
})

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test('Throws if you try to get a Modeler token from Self-hosted without application creds', async () => {
	const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		OAuthProvider: any
	}
	let thrown = false
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_CONSOLE_CLIENT_ID: 'clientId19',
			CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			CAMUNDA_CONSOLE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'https://localhost',
		},
	})
	await o
		.getHeaders('MODELER')
		.catch(() => {
			thrown = true
		})
		.then(() => {
			expect(thrown).toBe(true)
		})
})

test('Can use Basic Auth as a strategy', async () => {
	const { constructOAuthProvider } = (await vi.importActual('../../lib')) as {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		constructOAuthProvider: any
	}
	const server = http.createServer((req, res) => {
		const credentials = auth(req)

		if (
			!credentials ||
			credentials.name !== 'admin' ||
			credentials.pass !== 'supersecret'
		) {
			res.statusCode = 401
			res.setHeader('WWW-Authenticate', 'Basic realm="example"')
			res.end('Access denied')
		} else {
			res.end('Access granted')
		}
	})
	server.listen()
	const port = (server.address() as AddressInfo).port

	const oAuthProvider = constructOAuthProvider({
		CAMUNDA_AUTH_STRATEGY: 'BASIC',
		CAMUNDA_BASIC_AUTH_PASSWORD: 'supersecret',
		CAMUNDA_BASIC_AUTH_USERNAME: 'admin',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any)
	const Authorization = await oAuthProvider.getHeaders('ZEEBE')
	await got
		.get(`http://127.0.0.1:${port}`, {
			headers: {
				...Authorization,
			},
		})
		.then((res) => {
			server.close()
			expect(res).toBeTruthy()
		})
})

test('Can use Bearer Token Auth as a strategy', async () => {
	const { constructOAuthProvider } = (await vi.importActual(
		'../../lib'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	)) as any
	const server = http.createServer((req, res) => {
		const authHeader = req.headers['authorization']

		if (!authHeader || authHeader !== 'Bearer mysecrettoken') {
			res.statusCode = 401
			res.setHeader('WWW-Authenticate', 'Bearer realm="example"')
			res.end('Access denied')
		} else {
			res.end('Access granted')
		}
	})
	server.listen()
	const port = (server.address() as AddressInfo).port

	const oAuthProvider = constructOAuthProvider({
		CAMUNDA_AUTH_STRATEGY: 'BEARER',
		CAMUNDA_OAUTH_TOKEN: 'mysecrettoken',
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	} as any)
	const Authorization = await oAuthProvider.getHeaders('ZEEBE')
	await got
		.get(`http://127.0.0.1:${port}`, {
			headers: {
				...Authorization,
			},
		})
		.then((res) => {
			server.close()
			expect(res).toBeTruthy()
		})
})

// https://github.com/camunda/camunda-8-js-sdk/issues/605
test('Fails immediately when status code is 401 and CAMUNDA_OAUTH_FAIL_ON_ERROR=true', async () => {
	const { constructOAuthProvider } = (await vi.importActual(
		'../../lib'
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	)) as any
	const server = http.createServer((_, res) => {
		res.statusCode = 401
		res.end('Access denied')
	})
	server.listen()
	const port = (server.address() as AddressInfo).port

	const oAuthProvider = constructOAuthProvider({
		ZEEBE_CLIENT_ID: 'ZEEBE',
		ZEEBE_CLIENT_SECRET: 'zecret',
		CAMUNDA_OAUTH_URL: `http://127.0.0.1:${port}`,
		CAMUNDA_OAUTH_FAIL_ON_ERROR: true,
		CAMUNDA_LOG_LEVEL: 'NONE',
	})

	const now = new Date()
	try {
		await oAuthProvider.getHeaders('ZEEBE')
	} catch (error) {
		expect((error as HTTPError).code).toEqual('ERR_NON_2XX_3XX_RESPONSE')
	}
	const finished = new Date()
	expect(finished.getTime() - now.getTime() < 2000).toBe(true)
	try {
		await oAuthProvider.getHeaders('ZEEBE')
	} catch (error) {
		expect((error as HTTPError).code).toEqual('ERR_NON_2XX_3XX_RESPONSE')
	}
	const finished2 = new Date()
	expect(finished2.getTime() - finished.getTime() < 2000).toBe(true)
})
