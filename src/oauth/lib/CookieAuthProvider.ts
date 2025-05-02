import { debug } from 'debug'
import got from 'got'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCustomCertificateBuffer,
	gotBeforeErrorHook,
	gotErrorHandler,
	GotRetryConfig,
} from '../../lib'
import { IOAuthProvider } from '../index'

import { TokenGrantAudienceType } from './IOAuthProvider'

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
					handlers: [gotErrorHandler],
					hooks: {
						beforeError: [gotBeforeErrorHook],
					},
				})
		)
	}

	public async getToken(audienceType: TokenGrantAudienceType) {
		debug(`Token request for ${audienceType}`)
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
}
