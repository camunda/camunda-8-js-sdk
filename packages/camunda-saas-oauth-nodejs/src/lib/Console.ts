import { getConsoleCredentials } from "camunda-8-credentials-from-env"
import { OAuthProviderImpl } from "./OAuthProviderImpl"
import { instances } from "./Instances"

let consoleOAuthProvider: OAuthProviderImpl

export function getConsoleToken(userAgentString: string) {
    if (consoleOAuthProvider === undefined) {
        const creds = getConsoleCredentials()
        consoleOAuthProvider = new OAuthProviderImpl({
            userAgentString,
            audience: creds.CAMUNDA_CONSOLE_OAUTH_AUDIENCE,
            clientId: creds.CAMUNDA_CONSOLE_CLIENT_ID,
            clientSecret: creds.CAMUNDA_CONSOLE_CLIENT_SECRET,
            authServerUrl: creds.CAMUNDA_OAUTH_URL
        })
        instances.push(consoleOAuthProvider)
    }
    return consoleOAuthProvider.getToken('CONSOLE')
}