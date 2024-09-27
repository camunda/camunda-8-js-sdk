import debug from 'debug'

import {
	EnvironmentConfigurator,
	OAuthConfiguration,
	RequireConfiguration,
} from './Environment'
import { IOAuthProvider, TokenGrantAudienceType } from './OAuth'

const trace = debug('camunda:oauth')

export class BasicAuthProvider implements IOAuthProvider {
	private username: string | undefined
	private password: string | undefined
	constructor(options?: { config?: Partial<OAuthConfiguration> }) {
		const config = EnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.username = RequireConfiguration(
			config.CAMUNDA_BASIC_AUTH_USERNAME,
			'CAMUNDA_BASIC_AUTH_USERNAME'
		)
		this.password = RequireConfiguration(
			config.CAMUNDA_BASIC_AUTH_PASSWORD,
			'CAMUNDA_BASIC_AUTH_PASSWORD'
		)
	}
	getToken(audience: TokenGrantAudienceType): Promise<string> {
		trace(`Requesting token for audience ${audience}`)
		const token = Buffer.from(`${this.username}:${this.password}`).toString(
			'base64'
		)
		return Promise.resolve(token)
	}
}
