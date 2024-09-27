import debug from 'debug'

import { IOAuthProvider, TokenGrantAudienceType } from './OAuth'

const d = debug('camunda:oauth')

export class NullAuthProvider implements IOAuthProvider {
	public async getToken(audience: TokenGrantAudienceType): Promise<string> {
		d('NullAuthProvider.getToken: returning empty string for ' + audience)
		return ''
	}
}
