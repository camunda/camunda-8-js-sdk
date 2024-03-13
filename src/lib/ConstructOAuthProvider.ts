import { NullAuthProvider, OAuthProvider } from 'oauth'

import { CamundaPlatform8Configuration } from './Configurator'

export function constructOAuthProvider(config: CamundaPlatform8Configuration) {
	if (config.CAMUNDA_OAUTH_DISABLED) {
		return new NullAuthProvider()
	} else {
		return new OAuthProvider({ config })
	}
}
