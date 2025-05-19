import debug from 'debug'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	RequireConfiguration,
} from '../../lib'

import { IHeadersProvider, TokenGrantAudienceType } from './IHeadersProvider'

const trace = debug('camunda:oauth')

/**
 * The `BasicAuthProvider` class is an implementation of {@link IHeadersProvider}
 * that uses basic authentication. This class is responsible for providing
 * the Basic authorization header to the SDK for all requests.
 */
export class BasicAuthProvider implements IHeadersProvider {
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
	getHeaders(audience: TokenGrantAudienceType) {
		trace(`Requesting token for audience ${audience}`)
		const token = Buffer.from(`${this.username}:${this.password}`).toString(
			'base64'
		)
		return Promise.resolve({ authorization: `Basic ${token}` })
	}
}
