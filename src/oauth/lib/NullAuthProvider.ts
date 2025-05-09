import debug from 'debug'

import { IOAuthProvider } from '..'

import { TokenGrantAudienceType } from './IOAuthProvider'

const d = debug('camunda:oauth')

/**
 * The `NullAuthProvider` class is a no-op implementation of {@link IOAuthProvider}.
 * It returns an empty string for the authorization header.
 *
 * This is used when no authentication is required.
 */
export class NullAuthProvider implements IOAuthProvider {
	public async getToken(audience: TokenGrantAudienceType) {
		d('NullAuthProvider.getToken: returning empty string for ' + audience)
		return { authorization: '' }
	}
}
