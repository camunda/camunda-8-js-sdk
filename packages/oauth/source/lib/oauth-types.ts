export type TokenGrantAudienceType =
	| 'OPERATE'
	| 'ZEEBE'
	| 'OPTIMIZE'
	| 'TASKLIST'
	| 'CONSOLE'
	| 'MODELER'

export type Token = {
	access_token: string;
	scope: string;
	expires_in: number;
	token_type: string;
	expiry: number;
	audience: string;
}

export type TokenError = {
	error: string;
	error_description: string;
}

