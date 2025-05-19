import debug from 'debug'

import { IHeadersProvider } from '..'

import { TokenGrantAudienceType } from './IHeadersProvider'

const d = debug('camunda:oauth')

/**
 * The `NullAuthProvider` class is a no-op implementation of {@link IHeadersProvider}.
 * It returns an empty string for the authorization header.
 *
 * This is used when no authentication is required.
 */
export class NullAuthProvider implements IHeadersProvider {
	public async getHeaders(audience: TokenGrantAudienceType) {
		d('NullAuthProvider.getToken: returning empty string for ' + audience)
		return { authorization: '' }
	}
}
