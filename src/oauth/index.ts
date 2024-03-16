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

export { IOAuthProvider } from './lib/IOAuthProvider'
export { NullAuthProvider } from './lib/NullAuthProvider'
export { OAuthProvider } from './lib/OAuthProvider'
