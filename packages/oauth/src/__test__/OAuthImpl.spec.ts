import http from 'http'
import { OAuthProviderImpl } from '../lib/OAuthProviderImpl'

jest.setTimeout(10000)
// Added test for https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
// Updated test for https://github.com/camunda-community-hub/camunda-8-js-sdk/issues/3
// "Remove expiry timer from oAuth token implementation"
test('In-memory cache is populated and evicted after timeout', done => {
	const delay = (timeout: number) =>
		new Promise(res => setTimeout(() => res(null), timeout))

	const o = new OAuthProviderImpl({
		audience: 'token',
		clientId: 'clientId',
		clientSecret: 'clientSecret',
		authServerUrl: 'http://127.0.0.1:3002',
        userAgentString: 'test'
	})
	let requestCount = 0 
	const server = http
		.createServer((req, res) => {
			if (req.method === 'POST') {
				let body = ''
				req.on('data', chunk => {
					body += chunk
				})

				req.on('end', () => {
					res.writeHead(200, { 'Content-Type': 'application/json' })
					let expires_in = 2 // seconds
					res.end(
						`{"access_token": "${requestCount++}", "expires_in": ${expires_in}}`
					)
					expect(body).toEqual(
						'audience=token&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials'
					)
				})
			}
		})
		.listen(3002)

	o.getToken('CONSOLE').then(async token => {
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
