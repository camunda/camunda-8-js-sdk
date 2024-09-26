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
