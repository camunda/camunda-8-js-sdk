import debug from 'debug'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	RequireConfiguration,
} from '../../lib'

import { IOAuthProvider, TokenGrantAudienceType } from './IOAuthProvider'

const trace = debug('camunda:oauth')

export class BasicAuthProvider implements IOAuthProvider {
	private username: string | undefined
	private password: string | undefined
	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
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
