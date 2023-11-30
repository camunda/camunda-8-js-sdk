import http from 'http'
import { OAuthProviderImpl } from '../lib/OAuthProviderImpl'

// Added test for https://github.com/camunda-community-hub/camunda-saas-oauth-nodejs/issues/8
// "Can not renew expired token"
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
						'{"access_token": "something", "expires_in": ' +
							expires_in +
							'}'
					)
					server.close()
					expect(body).toEqual(
						'audience=token&client_id=clientId&client_secret=clientSecret&grant_type=client_credentials'
					)
				})
			}
		})
		.listen(3002)

        const key = 'clientId-CONSOLE'

	o.getToken('CONSOLE').then(async _ => {
		expect(o.tokenCache[key]).toBeDefined()
		await delay(500)
		expect(o.tokenCache[key]).toBeDefined()
		await delay(1600)
		expect(o.tokenCache[key]).not.toBeDefined()
		o.close()
		done()
	})
})
