import debug from 'debug'
import {
	EnvironmentConfigurator,
	type OAuthConfiguration,
	requireConfiguration,
} from './get-environment.js'
import {type TokenGrantAudienceType} from './oauth-types.js'
import {type IOAuthProvider} from './interfaces.js'

const trace = debug('camunda:oauth')

export class BasicAuthProvider implements IOAuthProvider {
	private readonly username: string | undefined
	private readonly password: string | undefined
	constructor(options?: {config?: Partial<OAuthConfiguration>}) {
		const config = EnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {},
		)
		this.username = requireConfiguration(
			config.CAMUNDA_BASIC_AUTH_USERNAME,
			'CAMUNDA_BASIC_AUTH_USERNAME',
		)
		this.password = requireConfiguration(
			config.CAMUNDA_BASIC_AUTH_PASSWORD,
			'CAMUNDA_BASIC_AUTH_PASSWORD',
		)
	}

	async getToken(audience: TokenGrantAudienceType): Promise<string> {
		trace(`Requesting token for audience ${audience}`)
		const token = Buffer.from(`${this.username}:${this.password}`).toString(
			'base64',
		)

		return token;
	}
}
