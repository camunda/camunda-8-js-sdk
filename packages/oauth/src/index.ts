export interface Token {
	access_token: string
	scope: string
	expires_in: number
	token_type: string
	expiry: number,
	audience: string
}

export interface OAuthProviderConfig {
	/** OAuth Endpoint URL */
	authServerUrl: string
	/** OAuth Audience */
	audience: string
	clientId: string
	clientSecret: string
    userAgentString: string
}

export { OAuthProviderImpl } from "./lib/OAuthProviderImpl"
export { OAuthProvider } from "./lib/OAuthProvider"

export { getOperateToken } from "./lib/Operate"
export { getOptimizeToken } from "./lib/Optimize"
export { getTasklistToken } from "./lib/Tasklist"
export { getZeebeToken } from "./lib/Zeebe"
export { getConsoleToken } from "./lib/Console"

export { 
	getCamundaCredentialsFromEnv,
	getConsoleCredentials,
	getOperateCredentials,
	getOptimizeCredentials,
	getTasklistCredentials,
	getZeebeCredentials
} from "./lib/creds/index"