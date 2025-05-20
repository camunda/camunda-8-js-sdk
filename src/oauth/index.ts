/**
 * The token interface represents the structure of the token returned by
 * the Camunda 8 Identity endpoint. It contains the access token, scope, expiration time,
 * token type, and audience.
 */
export interface Token {
	access_token: string
	scope: string
	expires_in: number
	token_type: string
	expiry: number
	audience: string
}

export interface TokenError {
	error: string
	error_description: string
}

export { BasicAuthProvider } from './lib/BasicAuthProvider'
export { BearerAuthProvider } from './lib/BearerAuthProvider'
export { CookieAuthProvider } from './lib/CookieAuthProvider'
export { IHeadersProvider } from './lib/IHeadersProvider'
export { NullAuthProvider } from './lib/NullAuthProvider'
export { OAuthProvider } from './lib/OAuthProvider'
