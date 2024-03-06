import { createEnv } from 'neon-env'

import { BaseCredentialElements, BaseCredentials } from './basecreds'

export function _getOptimizeEnv() {
	return createEnv({
		...BaseCredentialElements,
		CAMUNDA_OPTIMIZE_BASE_URL: {
			type: 'string',
			optional: false,
		},
	}) as BaseCredentials & {
		CAMUNDA_OPTIMIZE_BASE_URL: string
	}
}
