import {
	BasicAuthProvider,
	NullAuthProvider,
	OAuthProvider,
} from '@camunda8/oauth'
import debug from 'debug'
import type ky from 'ky'
import {type IsoSdkClientConfiguration} from './get-configuration.js'

const trace = debug('camunda:oauth')

export function constructOauthProvider(options: {
	config: IsoSdkClientConfiguration;
	rest: typeof ky;
}) {
	trace(`Auth strategy is ${options.config.CAMUNDA_AUTH_STRATEGY}`)
	trace(`OAuth disabled is ${options.config.CAMUNDA_OAUTH_DISABLED}`)
	if (
		options.config.CAMUNDA_OAUTH_DISABLED
		|| (options.config.CAMUNDA_AUTH_STRATEGY === 'NONE') // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
	) {
		trace('Disabling Auth')
		return new NullAuthProvider()
	}

	if (options.config.CAMUNDA_AUTH_STRATEGY === 'BASIC') {
		trace('Using Basic Auth')
		return new BasicAuthProvider(options)
	}

	trace('Using OAuth')
	return new OAuthProvider(options)
}
