import { debug } from 'debug'
import got from 'got'

import {
	beforeCallHook,
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCustomCertificateBuffer,
	gotBeforeErrorHook,
	GotRetryConfig,
} from '../../lib'
import { IOAuthProvider } from '../index'

import { TokenGrantAudienceType } from './IOAuthProvider'

const trace = debug('camunda:cookie-auth')
/**
 * The `CookieAuthProvider` is an implementation of {@link IOAuthProvider} that
 * supports the [authentication used in C8run 8.7](https://docs.camunda.io/docs/apis-tools/camunda-api-rest/camunda-api-rest-authentication/#authentication-via-cookie-c8run-only).
 * It retrieves a cookie from the C8run login endpoint, and passes it in the
 * `cookie` header for subsequent requests.
 *
 * It does not handle token expiration or renewal. The cookie may be reset
 * manually by calling the `setToken` method.
 */
export class CookieAuthProvider implements IOAuthProvider {
	rest: Promise<typeof got>
	cookie?: string
	username: string
	password: string
	authUrl: string

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)

		this.authUrl = config.CAMUNDA_COOKIE_AUTH_URL
		this.username = config.CAMUNDA_COOKIE_AUTH_USERNAME
		this.password = config.CAMUNDA_COOKIE_AUTH_PASSWORD

		this.rest = GetCustomCertificateBuffer(config).then(
			(certificateAuthority) =>
				got.extend({
					retry: GotRetryConfig,
					https: {
						certificateAuthority,
					},
					handlers: [beforeCallHook],
					hooks: {
						beforeError: [gotBeforeErrorHook(config)],
					},
				})
		)
	}

	public async getToken(audienceType: TokenGrantAudienceType) {
		trace(`Token request for ${audienceType}`)
		if (!this.cookie) {
			const rest = await this.rest
			this.cookie = await rest
				.post(this.authUrl, {
					searchParams: { username: this.username, password: this.password },
				})
				.then(
					(response) =>
						(this.cookie = response.headers['set-cookie']?.[0].split(';')[0])
				)
		}
		return { cookie: this.cookie! }
	}

	/**
	 * Forces a new login by resetting the cookie.
	 * This method is useful for scenarios where the cookie has expired
	 * or when you want to refresh the authentication.
	 * It will reset the cookie to undefined, which will trigger a new login
	 * the next time the getToken method is called.
	 */
	public async setToken() {
		this.cookie = undefined // Reset the cookie to force a new login
		trace('Cookie reset')
	}
}
