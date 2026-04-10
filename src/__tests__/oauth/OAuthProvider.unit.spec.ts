/* eslint-disable @typescript-eslint/no-var-requires */
import { execSync } from 'child_process'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import auth from 'basic-auth'
import debug from 'debug'
import got from 'got'
import jwt from 'jsonwebtoken'

const trace = debug('test:oauth')

import {
	EnvironmentSetup,
	EnvironmentStorage,
} from '../../lib/EnvironmentSetup'

jest.setTimeout(10000)
let server: http.Server
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
	jest.resetModules()
	EnvironmentSetup.wipeEnv()
})

afterEach(() => server && server.close())

afterAll(() => {
	EnvironmentSetup.restoreEnv(storedEnvironment)
})

function removeCacheDir(dirpath: string) {
	if (fs.existsSync(dirpath)) {
		fs.rmSync(dirpath, {
			recursive: true,
			force: true,
		})
	}
}

async function listenOnRandomPort(server: http.Server): Promise<number> {
	await new Promise<void>((resolve, reject) => {
		server.once('error', reject)
		server.listen(0, '127.0.0.1', () => resolve())
	})
	const address = server.address()
	if (!address || typeof address === 'string') {
		throw new Error('Failed to resolve test server port')
	}
	return address.port
}

describe('OAuthProvider', () => {
	it('Throws in the constructor if there in no clientId credentials', () => {
		const { OAuthProvider } = require('../../oauth')

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

	it('Throws in the constructor if there in no clientSecret credentials', () => {
		const { OAuthProvider } = require('../../oauth')
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

	it('Throws in the constructor if there are insufficient credentials', () => {
		const { OAuthProvider } = require('../../oauth')
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

	it('Gets the token cache dir from the environment', () => {
		const tokenCacheDir = path.join(__dirname, '.token-cache')
		removeCacheDir(tokenCacheDir)
		expect(fs.existsSync(tokenCacheDir)).toBe(false)
		process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
		const { OAuthProvider } = require('../../oauth')

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
		removeCacheDir(tokenCacheDir)

		expect(fs.existsSync(tokenCacheDir)).toBe(false)
	})

	it('Creates the token cache dir if it does not exist', () => {
		const tokenCacheDir = path.join(__dirname, '.token-cache')
		process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
		const { OAuthProvider } = require('../../oauth')
		removeCacheDir(tokenCacheDir)

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
		removeCacheDir(tokenCacheDir)

		expect(fs.existsSync(tokenCacheDir)).toBe(false)
	})

	it('Throws in the constructor if the token cache is not writable', () => {
		const tokenCacheDir = path.join(__dirname, '.token-cache')
		process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
		const { OAuthProvider } = require('../../oauth')
		removeCacheDir(tokenCacheDir)

		expect(fs.existsSync(tokenCacheDir)).toBe(false)
		if (os.platform() === 'win32') {
			fs.mkdirSync(tokenCacheDir)
			expect(fs.existsSync(tokenCacheDir)).toBe(true)
			// Make the directory read-only on Windows
			// Note that this requires administrative privileges
			execSync(
				`icacls ${tokenCacheDir} /deny Everyone:(OI)(CI)W /inheritance:r`
			)
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
		removeCacheDir(tokenCacheDir)
		expect(thrown).toBe(true)
		expect(fs.existsSync(tokenCacheDir)).toBe(false)
	})

	// Added test for https://github.com/camunda/camunda-saas-oauth-nodejs/issues/8
	// "Can not renew expired token"
	// Updated test for https://github.com/camunda/camunda-8-js-sdk/issues/3
	// "Remove expiry timer from oAuth token implementation"
	it('In-memory cache is populated and evicted after expiry', async () => {
		const { OAuthProvider } = require('../../oauth')
		const delay = (timeout: number) =>
			new Promise((res) => setTimeout(() => res(null), timeout))

		const secret = 'YOUR_SECRET'
		const ttl = 2 // 2 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })

		// On subsequent requests, we will return a different token
		let requested = false

		server = http.createServer((req, res) => {
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
		const serverPort = await listenOnRandomPort(server)

		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId6',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS: 0,
			},
		})

		const token1 = await o.getHeaders('ZEEBE')
		await delay(500)
		const token2 = await o.getHeaders('ZEEBE')
		expect(token2).toStrictEqual(token1)
		await delay(1600)
		const token3 = await o.getHeaders('ZEEBE')
		expect(token3).not.toStrictEqual(token1)
	})

	it('Does not share in-flight token requests across audiences', async () => {
		const { OAuthProvider } = require('../../oauth')
		const requestBodies: string[] = []
		const secret = 'YOUR_SECRET'
		const ttl = 60
		const zeebeToken = jwt.sign({ id: 'zeebe' }, secret, { expiresIn: ttl })
		const operateToken = jwt.sign({ id: 'operate' }, secret, { expiresIn: ttl })

		server = http.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})
				req.on('end', () => {
					requestBodies.push(body)
					const isZeebeRequest = body.includes('audience=zeebe.audience')
					const accessToken = isZeebeRequest ? zeebeToken : operateToken
					// Delay one response to force overlap between two in-flight requests.
					setTimeout(
						() => {
							res.writeHead(200, { 'Content-Type': 'application/json' })
							res.end(`{"access_token": "${accessToken}", "expires_in": "60"}`)
						},
						isZeebeRequest ? 50 : 0
					)
				})
			}
		})
		const serverPort = await listenOnRandomPort(server)

		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'zeebe.audience',
				CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'operate.audience',
				ZEEBE_CLIENT_ID: 'clientId7',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			},
		})

		const [zeebeHeaders, operateHeaders] = await Promise.all([
			o.getHeaders('ZEEBE'),
			o.getHeaders('OPERATE'),
		])

		expect(zeebeHeaders.authorization).toBe(`Bearer ${zeebeToken}`)
		expect(operateHeaders.authorization).toBe(`Bearer ${operateToken}`)
		expect(requestBodies.length).toBe(2)
		expect(
			requestBodies.some((body) => body.includes('audience=zeebe.audience'))
		).toBe(true)
		expect(
			requestBodies.some((body) => body.includes('audience=operate.audience'))
		).toBe(true)
	})

	it('Uses form encoding for request', async () => {
		const { OAuthProvider } = require('../../oauth')
		const secret = 'YOUR_SECRET'
		const ttl = 2 // 2 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		let body = ''
		server = http.createServer((req, res) => {
			if (req.method === 'POST') {
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)
				})
			}
		})
		const serverPort = await listenOnRandomPort(server)
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId8',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
			},
		})
		await o.getHeaders('OPERATE')
		expect(body).toEqual(
			'audience=operate.camunda.io&client_id=clientId8&client_secret=clientSecret&grant_type=client_credentials'
		)
	})

	it('Uses a custom audience for an Operate token, if one is configured', async () => {
		const { OAuthProvider } = require('../../oauth')
		const secret = 'YOUR_SECRET'
		const ttl = 2 // 2 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		let body = ''
		server = http.createServer((req, res) => {
			if (req.method === 'POST') {
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)
				})
			}
		})
		const serverPort = await listenOnRandomPort(server)
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId9',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
				CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'custom.operate.audience',
			},
		})
		await o.getHeaders('OPERATE')
		expect(body).toEqual(
			'audience=custom.operate.audience&client_id=clientId9&client_secret=clientSecret&grant_type=client_credentials'
		)
	})

	it('Passes scope, if provided', async () => {
		const { OAuthProvider } = require('../../oauth')
		const secret = 'YOUR_SECRET'
		const ttl = 5 // 5 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		let body = ''
		server = http.createServer((req, res) => {
			if (req.method === 'POST') {
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)
				})
			}
		})
		const serverPort = await listenOnRandomPort(server)
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				CAMUNDA_TOKEN_SCOPE: 'scope',
				ZEEBE_CLIENT_ID: 'clientId10',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
			},
		})
		await o.getHeaders('ZEEBE')
		expect(body).toEqual(
			'audience=token&client_id=clientId10&client_secret=clientSecret&grant_type=client_credentials&scope=scope'
		)
	})

	it('Can get scope from environment', async () => {
		process.env.CAMUNDA_TOKEN_SCOPE = 'scope2'
		const secret = 'YOUR_SECRET'
		const ttl = 5 // 5 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		let body = ''
		server = http.createServer((req, res) => {
			if (req.method === 'POST') {
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}", "expires_in": "5"}`)
				})
			}
		})
		const serverPort = await listenOnRandomPort(server)
		const { OAuthProvider } = require('../../oauth')
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId11',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
			},
		})
		process.env.CAMUNDA_TOKEN_SCOPE = ''
		await o.getHeaders('ZEEBE')
		expect(body).toEqual(
			'audience=token&client_id=clientId11&client_secret=clientSecret&grant_type=client_credentials&scope=scope2'
		)
	})

	it('Creates the token cache dir if it does not exist', () => {
		const { OAuthProvider } = require('../../oauth')
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

	it('Gets the token cache dir from the environment', () => {
		const tokenCache = path.join(__dirname, '.token-cache')
		if (fs.existsSync(tokenCache)) {
			fs.rmSync(tokenCache, { recursive: true, force: true })
		}
		expect(fs.existsSync(tokenCache)).toBe(false)
		process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache
		const { OAuthProvider } = require('../../oauth')
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

	it('Uses an explicit token cache over the environment', () => {
		const tokenCache1 = path.join(__dirname, '.token-cache1')
		const tokenCache2 = path.join(__dirname, '.token-cache2')
		;[tokenCache1, tokenCache2].forEach((tokenCache) => {
			if (fs.existsSync(tokenCache)) {
				fs.rmdirSync(tokenCache)
			}
			expect(fs.existsSync(tokenCache)).toBe(false)
		})
		process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache1
		const { OAuthProvider } = require('../../oauth')
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

	it('Flushes all files from token cache dir', () => {
		const { OAuthProvider } = require('../../oauth')
		const tokenCache = path.join(__dirname, '.token-cache-flush')
		removeCacheDir(tokenCache)

		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				CAMUNDA_TOKEN_CACHE_DIR: tokenCache,
				ZEEBE_CLIENT_ID: 'clientId15',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'url',
			},
		})

		fs.writeFileSync(path.join(tokenCache, 'oauth-token-a.json'), '{}')
		fs.writeFileSync(path.join(tokenCache, 'oauth-token-b.json'), '{}')
		expect(fs.readdirSync(tokenCache).length).toBe(2)

		o.flushFileCache()
		expect(fs.readdirSync(tokenCache).length).toBe(0)

		removeCacheDir(tokenCache)
		expect(fs.existsSync(tokenCache)).toBe(false)
	})

	it('Can set a custom user agent', () => {
		const { OAuthProvider } = require('../../oauth')
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
	it('Passes no audience for Modeler API when self-hosted', async () => {
		const { OAuthProvider } = require('../../oauth')
		const secret = 'YOUR_SECRET'
		const ttl = 5 // 5 seconds
		const payload = { id: 1 }
		const access_token = jwt.sign(payload, secret, { expiresIn: ttl })
		let body = ''
		server = http.createServer((req, res) => {
			if (req.method === 'POST') {
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					res.end(`{"access_token": "${access_token}"}`)
				})
			}
		})
		const serverPort = await listenOnRandomPort(server)
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId17',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort}`,
			},
		})
		await o.getHeaders('MODELER')
		expect(body).toEqual(
			'client_id=clientId17&client_secret=clientSecret&grant_type=client_credentials'
		)
	})

	// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
	it('Throws if you try to get a Modeler token from SaaS without console creds', async () => {
		const { OAuthProvider } = require('../../oauth')
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
	it('Throws if you try to get a Modeler token from Self-hosted without application creds', async () => {
		const { OAuthProvider } = require('../../oauth')
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

	it('Can use Basic Auth as a strategy', async () => {
		const { constructOAuthProvider } = require('../../lib')
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

		const serverPort = await listenOnRandomPort(server)

		const oAuthProvider = constructOAuthProvider({
			CAMUNDA_AUTH_STRATEGY: 'BASIC',
			CAMUNDA_BASIC_AUTH_PASSWORD: 'supersecret',
			CAMUNDA_BASIC_AUTH_USERNAME: 'admin',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)
		const Authorization = await oAuthProvider.getHeaders('ZEEBE')
		await got
			.get(`http://127.0.0.1:${serverPort}`, {
				headers: {
					...Authorization,
				},
			})
			.then((res) => {
				server.close()
				expect(res).toBeTruthy()
			})
	})

	it('Can use Bearer Token Auth as a strategy', async () => {
		const { constructOAuthProvider } = require('../../lib')
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

		const serverPort = await listenOnRandomPort(server)

		const oAuthProvider = constructOAuthProvider({
			CAMUNDA_AUTH_STRATEGY: 'BEARER',
			CAMUNDA_OAUTH_TOKEN: 'mysecrettoken',
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} as any)
		const Authorization = await oAuthProvider.getHeaders('ZEEBE')
		await got
			.get(`http://127.0.0.1:${serverPort}`, {
				headers: {
					...Authorization,
				},
			})
			.then((res) => {
				server.close()
				expect(res).toBeTruthy()
			})
	})
})
