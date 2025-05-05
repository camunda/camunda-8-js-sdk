import debug from 'debug'

import { IOAuthProvider } from '..'

import { TokenGrantAudienceType } from './IOAuthProvider'

const d = debug('camunda:oauth')

export class NullAuthProvider implements IOAuthProvider {
	public async getToken(audience: TokenGrantAudienceType) {
		d('NullAuthProvider.getToken: returning empty string for ' + audience)
		return { authorization: '' }
	}
}
