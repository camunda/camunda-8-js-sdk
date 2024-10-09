export type TokenGrantAudienceType =
	| 'OPERATE'
	| 'ZEEBE'
	| 'OPTIMIZE'
	| 'TASKLIST'
	| 'CONSOLE'
	| 'MODELER'

export interface IOAuthProvider {
	getToken(audience: TokenGrantAudienceType): Promise<string>
}

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

export interface IPersistentCacheProvider {
	get(key: string): Token | null
	set(key: string, token: Token, decoded: { exp?: number }): void
	delete(key: string): void
	flush(): void
}
