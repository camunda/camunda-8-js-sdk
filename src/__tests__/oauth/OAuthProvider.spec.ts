import fs from 'fs'
import http from 'http'
import path from 'path'

import { EnvironmentSetup } from '../../lib'
import { OAuthProvider } from '../../oauth'

jest.setTimeout(10000)

beforeAll(() => EnvironmentSetup.storeEnv())

beforeEach(() => EnvironmentSetup.wipeEnv())

afterAll(() => EnvironmentSetup.restoreEnv())

function removeCacheDir(dirpath: string) {
	if (fs.existsSync(dirpath)) {
		fs.rmSync(dirpath, {
			recursive: true,
			force: true,
		})
	}
}

test('Gets the token cache dir from the environment', () => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	removeCacheDir(tokenCacheDir)
	expect(fs.existsSync(tokenCacheDir)).toBe(false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir

	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
		userAgentString: 'test',
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
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
		userAgentString: 'test',
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
	expect(fs.existsSync(tokenCacheDir)).toBe(true)
	let thrown = false
	try {
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'url',
			},
			userAgentString: 'test',
		})
		expect(o).toBeTruthy()
	} catch {
		thrown = true
	}
	expect(thrown).toBe(true)
	removeCacheDir(tokenCacheDir)

	expect(fs.existsSync(tokenCacheDir)).toBe(false)
})

// Added test for https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
// Updated test for https://github.com/camunda-community-hub/camunda-8-js-sdk/issues/3
// "Remove expiry timer from oAuth token ementation"
test('In-memory cache is populated and evicted after timeout', (done) => {
	const delay = (timeout: number) =>
		new Promise((res) => setTimeout(() => res(null), timeout))

	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3002',
		},
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

	o.getToken('ZEEBE').then(async (token) => {
		expect(token).toBe('0')
		await delay(500)
		const token2 = await o.getToken('ZEEBE')
		expect(token2).toBe('0')
		await delay(1600)
		const token3 = await o.getToken('ZEEBE')
		expect(token3).toBe('1')
		server.close(() => done())
	})
})

test('Uses form encoding for request', (done) => {
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3001',
		},
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
						'audience=operate.camunda.io&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials'
					)
					done()
				})
			}
		})
		.listen(3001)
	o.getToken('OPERATE').finally(() => server.close())
})

test('Uses a custom audience for an Operate token, if one is configured', (done) => {
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3001',
			CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'custom.operate.audience',
		},
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
						'audience=custom.operate.audience&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials'
					)
					done()
				})
			}
		})
		.listen(3001)
	o.getToken('OPERATE').finally(() => server.close())
})

test('Passes scope, if provided', () => {
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_SCOPE: 'scope',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3002',
		},
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

	return o.getToken('ZEEBE').finally(() => {
		return server.close()
	})
})

test('Can get scope from environment', () => {
	process.env.CAMUNDA_TOKEN_SCOPE = 'scope2'
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3003',
		},
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

	return o.getToken('ZEEBE').finally(() => {
		return server.close()
	})
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
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
		userAgentString: 'test',
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
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
		userAgentString: 'test',
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
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
		userAgentString: 'test',
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

test('Throws in the constructor if the token cache is not writable', () => {
	const tokenCache = path.join(__dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	expect(fs.existsSync(tokenCache)).toBe(false)
	fs.mkdirSync(tokenCache, 0o400)
	expect(fs.existsSync(tokenCache)).toBe(true)
	let thrown = false
	try {
		const o = new OAuthProvider({
			config: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId',
				CAMUNDA_TOKEN_CACHE_DIR: tokenCache,
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'url',
			},
			userAgentString: 'test',
		})
		expect(o).toBeTruthy()
	} catch {
		thrown = true
	}
	expect(thrown).toBe(true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	expect(fs.existsSync(tokenCache)).toBe(false)
})

test('Can set a custom user agent', () => {
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3004',
		},
		userAgentString: 'modeler',
	})

	expect(o.userAgentString.includes(' modeler')).toBe(true)
})

test('Uses form encoding for request', (done) => {
	process.env.DEBUG = 'camunda:token'
	const o = new OAuthProvider({
		config: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId',
			CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'http://127.0.0.1:3001',
		},
		userAgentString: 'modeler',
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
	o.getToken('ZEEBE')
})
