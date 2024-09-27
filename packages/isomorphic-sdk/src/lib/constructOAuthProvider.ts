import {
	BasicAuthProvider,
	NullAuthProvider,
	OAuthProvider,
} from '@camunda8/oauth'
import debug from 'debug'

import { IsoSdkClientConfiguration } from './Configuration'

const trace = debug('camunda:oauth')

export function constructOAuthProvider(config: IsoSdkClientConfiguration) {
	trace(`Auth strategy is ${config.CAMUNDA_AUTH_STRATEGY}`)
	trace(`OAuth disabled is ${config.CAMUNDA_OAUTH_DISABLED}`)
	if (
		config.CAMUNDA_OAUTH_DISABLED ||
		config.CAMUNDA_AUTH_STRATEGY === 'NONE'
	) {
		trace(`Disabling Auth`)
		return new NullAuthProvider()
	} else {
		if (config.CAMUNDA_AUTH_STRATEGY === 'BASIC') {
			trace(`Using Basic Auth`)
			return new BasicAuthProvider({ config })
		} else {
			trace(`Using OAuth`)
			return new OAuthProvider({ config })
		}
	}
}
