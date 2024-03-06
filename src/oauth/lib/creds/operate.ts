import { createEnv } from 'neon-env'

import { BaseCredentialElements, BaseCredentials } from './basecreds'

export function _getOperateEnv() {
	return createEnv({
		...BaseCredentialElements,
		CAMUNDA_OPERATE_BASE_URL: {
			type: 'string',
			optional: false,
		},
	}) as BaseCredentials & {
		CAMUNDA_OPERATE_BASE_URL: string
	}
}
