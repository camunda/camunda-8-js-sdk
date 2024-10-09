/* eslint-disable @typescript-eslint/consistent-type-definitions */
/* eslint-disable @typescript-eslint/naming-convention */
import {type Token, type TokenGrantAudienceType} from './oauth-types.js';

export interface IOAuthProvider {
	getToken(audience: TokenGrantAudienceType): Promise<string>;
}

export interface IPersistentCacheProvider {
	get(key: string): Token | undefined;
	set(key: string, token: Token, decoded: {exp?: number}): void;
	delete(key: string): void;
	flush(): void;
}

export interface ILogger {
	info: (message: string, ...meta: any[]) => void;
	warn: (message: string, ...meta: any[]) => void;
	error: (message: string, ...meta: any[]) => void;
	debug: (message: string, ...meta: any[]) => void;
	trace: (message: string, ...meta: any[]) => void;
}

