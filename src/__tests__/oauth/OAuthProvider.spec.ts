import { exec } from 'child_process'
import fs from 'fs'
import http from 'http'
import os from 'os'
import path from 'path'

import { HS256Strategy, JSONWebToken } from '@mokuteki/jwt'

import { EnvironmentSetup } from '../../lib'
import { OAuthProvider } from '../../oauth'

const strategy = new HS256Strategy({
	ttl: 30000,
	secret: 'YOUR_SECRET',
})

const jwt = new JSONWebToken(strategy)
const payload = { id: 1 }

const access_token = jwt.generate(payload)

jest.setTimeout(10000)
let server: http.Server

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})

beforeEach(() => EnvironmentSetup.wipeEnv())

afterEach(() => server && server.close())

afterAll(() => EnvironmentSetup.restoreEnv())

function removeCacheDir(dirpath: string) {
	if (fs.existsSync(dirpath)) {
		fs.rmSync(dirpath, {
			recursive: true,
			force: true,
		})
	}
}

test('Throws in the constructor if there in no clientId credentials', () => {
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

test('Throws in the constructor if there in no clientSecret credentials', () => {
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

test('Throws in the constructor if there are insufficient credentials', () => {
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

test('Gets the token cache dir from the environment', () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	removeCacheDir(tokenCacheDir)
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir

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

test('Creates the token cache dir if it does not exist', () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
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

test('Throws in the constructor if the token cache is not writable', () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	removeCacheDir(tokenCacheDir)

	expect(fs.existsSync(tokenCacheDir)).toBe(false)
	fs.mkdirSync(tokenCacheDir, 0o400)
	// Make the directory read-only on Windows
	if (os.platform() === 'win32') {
		exec(
			`icacls ${tokenCacheDir} /grant:r Everyone:(OI)(CI)R /inheritance:r`,
			(error, stdout, stderr) => {
				if (error) {
					console.error(`exec error: ${error}`)
				}
				console.log(`stdout: ${stdout}`)
				if (console.error) {
					console.error(`stderr: ${stderr}`)
				}
			}
		)
	}
	expect(fs.existsSync(tokenCacheDir)).toBe(true)
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
	if (os.platform() === 'win32') {
		exec(
			`icacls ${tokenCacheDir} /grant Everyone:(OI)(CI)(F)`,
			(error, stdout, stderr) => {
				if (error) {
					console.error(`exec error: ${error}`)
				}
				console.log(`stdout: ${stdout}`)
				if (console.error) {
					console.error(`stderr: ${stderr}`)
				}
			}
		)
	}
	removeCacheDir(tokenCacheDir)
	expect(thrown).toBe(true)

	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

// Added test for https://github.com/camunda/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
// Updated test for https://github.com/camunda/camunda-8-js-sdk/issues/3
// "Remove expiry timer from oAuth token implementation"
test('In-memory cache is populated and evicted after timeout', (done) => {
	const delay = (timeout: number) =>
		new Promise((res) => setTimeout(() => res(null), timeout))
	const serverPort3002 = 3002

	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId6',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort3002}`,
			CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS: 0,
		},
	})

	const strategy = new HS256Strategy({
		ttl: 2000,
		secret: 'YOUR_SECRET',
	})

	const jwt = new JSONWebToken(strategy)
	const payload = { id: 1 }

	const access_token = jwt.generate(payload)

	let requestCount = 0
	server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', (chunk) => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					const expiresIn = 2 // seconds
					const token = `${access_token}${requestCount}`
					res.end(`{"access_token": "${token}", "expires_in": ${expiresIn}}`)
					requestCount++
					expect(body).toEqual(
						'audience=token&client_id=clientId6&client_secret=clientSecret&grant_type=client_credentials'
					)
				})
			}
		})
		.listen(serverPort3002)

	o.getToken('ZEEBE').then(async (token) => {
		expect(token).toBe(`${access_token}0`)
		await delay(500)
		const token2 = await o.getToken('ZEEBE')
		expect(token2).toBe(`${access_token}0`)
		await delay(1600)
		const token3 = await o.getToken('ZEEBE')
		expect(token3).toBe(`${access_token}1`)
		done()
	})
})

test('Uses form encoding for request', (done) => {
	const serverPort3001 = 3001
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId8',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort3001}`,
		},
	})
	server = http
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
		.listen(serverPort3001)
	o.getToken('OPERATE')
})

test('Uses a custom audience for an Operate token, if one is configured', (done) => {
	const serverPort3003 = 3003
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId9',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort3003}`,
			CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'custom.operate.audience',
		},
	})
	server = http
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
		.listen(serverPort3003)
	o.getToken('OPERATE')
})

test('Passes scope, if provided', () => {
	const serverPort3004 = 3004
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_SCOPE: 'scope',
			ZEEBE_CLIENT_ID: 'clientId10',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort3004}`,
		},
	})
	server = http
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
		.listen(serverPort3004)

	return o.getToken('ZEEBE')
})

test('Can get scope from environment', () => {
	const serverPort3005 = 3005
	process.env.CAMUNDA_TOKEN_SCOPE = 'scope2'
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId11',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort3005}`,
		},
	})
	server = http
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
		.listen(serverPort3005)

	return o.getToken('ZEEBE')
})

test('Creates the token cache dir if it does not exist', () => {
	const tokenCache = path.join(__dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
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

test('Gets the token cache dir from the environment', () => {
	const tokenCache = path.join(__dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	expect(fs.existsSync(tokenCache)).toBe(false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache
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

test('Uses an explicit token cache over the environment', () => {
	const tokenCache1 = path.join(__dirname, '.token-cache1')
	const tokenCache2 = path.join(__dirname, '.token-cache2')
	;[tokenCache1, tokenCache2].forEach((tokenCache) => {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}
		expect(fs.existsSync(tokenCache)).toBe(false)
	})
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache1
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

test('Can set a custom user agent', () => {
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
test('Passes no audience for Modeler API when self-hosted', (done) => {
	const serverPort3006 = 3006
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId17',
			CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${serverPort3006}`,
		},
	})
	server = http
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
		.listen(serverPort3006)
	o.getToken('MODELER')
})

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test('Throws if you try to get a Modeler token from SaaS without console creds', async () => {
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
		.getToken('MODELER')
		.catch(() => {
			thrown = true
		})
		.then(() => {
			expect(thrown).toBe(true)
		})
})

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test('Throws if you try to get a Modeler token from Self-hosted without application creds', async () => {
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
		.getToken('MODELER')
		.catch(() => {
			thrown = true
		})
		.then(() => {
			expect(thrown).toBe(true)
		})
})
