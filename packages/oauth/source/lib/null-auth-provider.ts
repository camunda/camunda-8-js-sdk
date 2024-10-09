import debug from 'debug'
import {type TokenGrantAudienceType} from './oauth-types.js'
import {type IOAuthProvider} from './interfaces.js'

const d = debug('camunda:oauth')

export class NullAuthProvider implements IOAuthProvider {
	public async getToken(audience: TokenGrantAudienceType): Promise<string> {
		d('NullAuthProvider.getToken: returning empty string for ' + audience)
		return ''
	}
}
