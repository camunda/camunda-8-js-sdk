export type TokenGrantAudienceType =
	| 'OPERATE'
	| 'ZEEBE'
	| 'OPTIMIZE'
	| 'TASKLIST'
	| 'CONSOLE'
	| 'MODELER'

export type AuthHeader = {
	[K in 'authorization' | 'cookie']?: string
}

export type HeadersPromise = Promise<AuthHeader>

export interface IOAuthProvider {
	getToken(audience: TokenGrantAudienceType): HeadersPromise
}
