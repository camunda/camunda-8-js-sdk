import test from 'ava'
import delay from 'delay'

import { OAuthProvider } from '../source/index.js'
import { EnvironmentSetup } from './helpers/EnvironmentSetup.js'
import {
	createHttpTestServer,
	HttpTestServer,
} from './helpers/create-http-test-server.js'

let server: HttpTestServer

test.before(async () => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})

test.beforeEach(async () => {
	EnvironmentSetup.wipeEnv()
	server = await createHttpTestServer()
})

test.afterEach(async () => {
	await server.stop()
})

test.after(() => {
	EnvironmentSetup.restoreEnv()
})

test.serial(
	'Throws in the constructor if there in no clientId credentials',
	(t) => {
		let thrown = false
		let message = ''
		try {
			new OAuthProvider({
				configuration: { CAMUNDA_OAUTH_URL: 'url' },
			})
		} catch (e) {
			thrown = true
			message = (e as Error).message
		}
		t.is(thrown, true)
		t.is(
			message.includes('ZEEBE_CLIENT_ID') &&
				message.includes('CAMUNDA_CONSOLE_CLIENT_ID'),
			true
		)
	}
)

test.serial(
	'Throws in the constructor if there in no clientSecret credentials',
	(t) => {
		let thrown = false
		let message = ''
		try {
			new OAuthProvider({
				configuration: {
					CAMUNDA_CONSOLE_CLIENT_ID: 'clientId1',
					CAMUNDA_OAUTH_URL: 'url',
				},
			})
		} catch (e) {
			thrown = true
			message = (e as Error).message
		}
		t.is(thrown, true)
		t.is(
			message.includes('ZEEBE_CLIENT_SECRET') &&
				message.includes('CAMUNDA_CONSOLE_CLIENT_SECRET'),
			true
		)
	}
)

test.serial(
	'Throws in the constructor if there are insufficient credentials',
	(t) => {
		let thrown = false
		let message = ''
		try {
			new OAuthProvider({
				configuration: {
					CAMUNDA_CONSOLE_CLIENT_ID: 'clientId2',
					ZEEBE_CLIENT_SECRET: 'zeebe-secret',
					CAMUNDA_OAUTH_URL: 'url',
				},
			})
		} catch (e) {
			thrown = true
			message = (e as Error).message
		}
		t.is(thrown, true)
		t.is(
			message.includes('client ID') && message.includes('client secret'),
			true
		)
	}
)

// Added test for https://github.com/camunda/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
// Updated test for https://github.com/camunda/camunda-8-js-sdk/issues/3
// "Remove expiry timer from oAuth token implementation"
test.serial(
	'In-memory cache is populated and evicted after expiry',
	async (t) => {
		const o = new OAuthProvider({
			configuration: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId6',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS: 0,
			},
		})

		const token = await o.getToken('ZEEBE')
		const token1 = token
		t.is(token, token1)
		await delay(500)
		const token2 = await o.getToken('ZEEBE')
		t.is(token2, token1)
		await delay(1600)
		const token3 = await o.getToken('ZEEBE')
		t.not(token3, token1)
	}
)

test.serial('Uses form encoding for request', async (t) => {
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId8',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
		},
	})

	const res = await o.getToken('OPERATE')
	t.is(
		server.request_body,
		'audience=operate.camunda.io&client_id=clientId8&client_secret=clientSecret&grant_type=client_credentials'
	)
})

test.serial(
	'Uses a custom audience for an Operate token, if one is configured',
	async (t) => {
		const o = new OAuthProvider({
			configuration: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId9',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
				CAMUNDA_OPERATE_OAUTH_AUDIENCE: 'custom.operate.audience',
			},
		})

		const res = await o.getToken('OPERATE')
		t.is(
			server.request_body,
			'audience=custom.operate.audience&client_id=clientId9&client_secret=clientSecret&grant_type=client_credentials'
		)
	}
)

test.serial('Passes scope, if provided', async (t) => {
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_SCOPE: 'scope',
			ZEEBE_CLIENT_ID: 'clientId10',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
		},
	})

	const res = await o.getToken('ZEEBE')
	t.is(
		server.request_body,
		'audience=token&client_id=clientId10&client_secret=clientSecret&grant_type=client_credentials&scope=scope'
	)
})

test.serial('Can get scope from environment', async (t) => {
	process.env.CAMUNDA_TOKEN_SCOPE = 'scope2'
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId11',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
		},
	})

	const res = await o.getToken('ZEEBE')
	t.is(
		server.request_body,
		'audience=token&client_id=clientId11&client_secret=clientSecret&grant_type=client_credentials&scope=scope2'
	)
})

test.serial('Can set a custom user agent', (t) => {
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId16',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
			CAMUNDA_CUSTOM_USER_AGENT_STRING: 'modeler',
		},
	})

	t.is(o.userAgentString.includes(' modeler'), true)
})

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test.serial(
	'Passes no audience for Modeler API when self-hosted',
	async (t) => {
		const o = new OAuthProvider({
			configuration: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId17',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: `http://127.0.0.1:${server.port}`,
			},
		})

		const res = await o.getToken('MODELER')
		t.is(
			server.request_body,
			'client_id=clientId17&client_secret=clientSecret&grant_type=client_credentials'
		)
	}
)

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test.serial(
	'Throws if you try to get a Modeler token from SaaS without console creds',
	async (t) => {
		let thrown = false
		const o = new OAuthProvider({
			configuration: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId18',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'https://login.cloud.camunda.io/oauth/token',
			},
		})

		await o.getToken('MODELER').catch(() => {
			thrown = true
		})
		t.is(thrown, true)
	}
)

// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
test.serial(
	'Throws if you try to get a Modeler token from Self-hosted without application creds',
	async (t) => {
		let thrown = false
		const o = new OAuthProvider({
			configuration: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				CAMUNDA_CONSOLE_CLIENT_ID: 'clientId19',
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
				CAMUNDA_CONSOLE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'https://localhost',
			},
		})
		await o.getToken('MODELER').catch(() => {
			thrown = true
		})

		t.is(thrown, true)
	}
)

// @Move to isomorphic-sdk
// 	xit('Can use Basic Auth as a strategy', async () => {
// 		const server = http.createServer((req, res) => {
// 			const credentials = auth(req)

// 			if (
// 				!credentials ||
// 				credentials.name !== 'admin' ||
// 				credentials.pass !== 'supersecret'
// 			) {
// 				res.statusCode = 401
// 				res.setHeader('WWW-Authenticate', 'Basic realm="example"')
// 				res.end('Access denied')
// 			} else {
// 				res.end('Access granted')
// 			}
// 		})

// 		server.listen(3033)

// 		const oAuthProvider = constructOAuthProvider({
// 			CAMUNDA_AUTH_STRATEGY: 'BASIC',
// 			CAMUNDA_BASIC_AUTH_PASSWORD: 'supersecret',
// 			CAMUNDA_BASIC_AUTH_USERNAME: 'admin',
// 			// eslint-disable-next-line @typescript-eslint/no-explicit-any
// 		} as any)
// 		const token = await oAuthProvider.getToken('ZEEBE')
// 		await got
// 			.get('http://localhost:3033', {
// 				headers: {
// 					Authorization: 'Basic ' + token,
// 				},
// 			})
// 			.then((res) => {
// 				server.close()
// 				expect(res).toBeTruthy()
// 			})
// 	})
