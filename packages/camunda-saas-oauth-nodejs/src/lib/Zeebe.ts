import { getZeebeCredentials } from "camunda-8-credentials-from-env"
import { OAuthProviderImpl } from "./OAuthProviderImpl"

let zeebeOAuthProvider: OAuthProviderImpl

export function getZeebeToken(userAgentString: string) {
    if (zeebeOAuthProvider === undefined) {
        const creds = getZeebeCredentials()
        zeebeOAuthProvider = new OAuthProviderImpl({
            userAgentString,
            audience: creds.ZEEBE_TOKEN_AUDIENCE,
            clientId: creds.ZEEBE_CLIENT_ID,
            clientSecret: creds.ZEEBE_CLIENT_SECRET,
            authServerUrl: creds.CAMUNDA_OAUTH_URL
        })
    }
    return zeebeOAuthProvider.getToken('ZEEBE')
}