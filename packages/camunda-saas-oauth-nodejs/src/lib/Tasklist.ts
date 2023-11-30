import { getTasklistCredentials } from "camunda-8-credentials-from-env"
import { OAuthProviderImpl } from "./OAuthProviderImpl"
import { instances } from "./Instances"

let tasklistOAuthProvider: OAuthProviderImpl

export function getTasklistToken(userAgentString: string) {
    if (tasklistOAuthProvider === undefined) {
        const creds = getTasklistCredentials()
        tasklistOAuthProvider = new OAuthProviderImpl({
            userAgentString,
            audience: creds.ZEEBE_TOKEN_AUDIENCE,
            clientId: creds.ZEEBE_CLIENT_ID,
            clientSecret: creds.ZEEBE_CLIENT_SECRET,
            authServerUrl: creds.CAMUNDA_OAUTH_URL
        })
        instances.push(tasklistOAuthProvider)
    }
    return tasklistOAuthProvider.getToken('TASKLIST')
}