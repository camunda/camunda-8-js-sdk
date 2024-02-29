import { getConsoleCredentials } from './creds'
import { OAuthProviderImpl } from './OAuthProviderImpl'

let consoleOAuthProvider: OAuthProviderImpl

export function getConsoleToken(userAgentString: string) {
	if (consoleOAuthProvider === undefined) {
		const creds = getConsoleCredentials()
		consoleOAuthProvider = new OAuthProviderImpl({
			userAgentString,
			audience: creds.CAMUNDA_CONSOLE_OAUTH_AUDIENCE,
			clientId: creds.CAMUNDA_CONSOLE_CLIENT_ID,
			clientSecret: creds.CAMUNDA_CONSOLE_CLIENT_SECRET,
			authServerUrl: creds.CAMUNDA_OAUTH_URL,
		})
	}
	return consoleOAuthProvider.getToken('CONSOLE')
}
