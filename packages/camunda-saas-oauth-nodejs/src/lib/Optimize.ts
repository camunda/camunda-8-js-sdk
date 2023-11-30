import { getOptimizeCredentials } from "camunda-8-credentials-from-env"
import { OAuthProviderImpl } from "./OAuthProviderImpl"
import { instances } from "./Instances"

let optimiseOAuthProvider: OAuthProviderImpl

export function getOptimizeToken(userAgentString: string) {
    if (optimiseOAuthProvider === undefined) {
        const creds = getOptimizeCredentials()
        optimiseOAuthProvider = new OAuthProviderImpl({
            userAgentString,
            audience: creds.ZEEBE_TOKEN_AUDIENCE,
            clientId: creds.ZEEBE_CLIENT_ID,
            clientSecret: creds.ZEEBE_CLIENT_SECRET,
            authServerUrl: creds.CAMUNDA_OAUTH_URL
        })
        instances.push(optimiseOAuthProvider)
    }
    return optimiseOAuthProvider.getToken('OPTIMIZE')
}