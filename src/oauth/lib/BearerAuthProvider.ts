import { debug } from 'debug'

import {
	CamundaEnvironmentConfigurator,
	CamundaConfigurationInput,
	RequireConfiguration,
} from '../../lib'
import { Secret, toSecret } from '../../lib/Secret'
import { IHeadersProvider } from '../index'

import { TokenGrantAudienceType } from './IHeadersProvider'

/**
 * The `BearerAuthProvider` class is an implementation of {@link IHeadersProvider}
 * that uses a bearer token for authentication. This class is
 * responsible for providing the authentication headers to the SDK. Note that it does
 * not handle token expiration or renewal. The token must be set manually using the
 * `setToken` method. Nor does it handle token retrieval. The token must be provided
 * in the configuration object or set manually using the `setToken` method.
 *
 * This class is useful for scenarios where you have a static bearer token that
 * does not expire or where you want to manage the token lifecycle yourself.
 *
 * @example
 * ```typescript
 * const authProvider = new BearerAuthProvider({
 *   config: {
 *     CAMUNDA_OAUTH_TOKEN: 'your-bearer-token',
 *   },
 * })
 *
 * authProvider.setToken('newTokenValue')
 * ```
 */
export class BearerAuthProvider implements IHeadersProvider {
	protected bearerToken: Secret

	constructor(options?: { config?: CamundaConfigurationInput }) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)

		this.bearerToken = RequireConfiguration(
			config.CAMUNDA_OAUTH_TOKEN,
			'CAMUNDA_OAUTH_TOKEN'
		)
	}

	public async getHeaders(audienceType: TokenGrantAudienceType) {
		debug(`Token request for ${audienceType}`)

		return Promise.resolve({
			authorization: `Bearer ${this.bearerToken.reveal()}`,
		})
	}

	/**
	 * Updates the bearer token used for authentication.
	 *
	 * @param bearerToken - The new bearer token to be used. This should be a valid
	 *                      token string obtained from a trusted source.
	 */
	public async setToken(bearerToken: string | Secret) {
		this.bearerToken = RequireConfiguration(
			toSecret(bearerToken),
			'CAMUNDA_OAUTH_TOKEN'
		)
	}
}
