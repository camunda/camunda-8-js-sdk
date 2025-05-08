import { debug } from 'debug'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	RequireConfiguration,
} from '../../lib'
import { IOAuthProvider } from '../index'

import { TokenGrantAudienceType } from './IOAuthProvider'

export class BearerAuthProvider implements IOAuthProvider {
	protected bearerToken: string

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)

		this.bearerToken = RequireConfiguration(
			config.CAMUNDA_OAUTH_TOKEN,
			'CAMUNDA_OAUTH_TOKEN'
		)
	}

	public async getToken(audienceType: TokenGrantAudienceType) {
		debug(`Token request for ${audienceType}`)

		return Promise.resolve({ authorization: `Bearer ${this.bearerToken}` })
	}

	/**
	 * Updates the bearer token used for authentication.
	 *
	 * @param bearerToken - The new bearer token to be used. This should be a valid
	 *                      token string obtained from a trusted source.
	 */
	public setToken(bearerToken: string) {
		this.bearerToken = bearerToken
	}
}
