import {
	BasicAuthProvider,
	NullAuthProvider,
	OAuthProvider,
} from '@camunda8/oauth'
import debug from 'debug'
import ky from 'ky'

import { IsoSdkClientConfiguration } from './Configuration'

const trace = debug('camunda:oauth')

export function constructOAuthProvider(options: {
	config: IsoSdkClientConfiguration
	fetch: typeof ky
}) {
	trace(`Auth strategy is ${options.config.CAMUNDA_AUTH_STRATEGY}`)
	trace(`OAuth disabled is ${options.config.CAMUNDA_OAUTH_DISABLED}`)
	if (
		options.config.CAMUNDA_OAUTH_DISABLED ||
		options.config.CAMUNDA_AUTH_STRATEGY === 'NONE'
	) {
		trace(`Disabling Auth`)
		return new NullAuthProvider()
	} else {
		if (options.config.CAMUNDA_AUTH_STRATEGY === 'BASIC') {
			trace(`Using Basic Auth`)
			return new BasicAuthProvider(options)
		} else {
			trace(`Using OAuth`)
			return new OAuthProvider(options)
		}
	}
}
