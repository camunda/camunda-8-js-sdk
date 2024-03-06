import { createEnv } from 'neon-env'

import { BaseCredentialElements, BaseCredentials } from './basecreds'

export function _getTasklistEnv() {
	return createEnv({
		...BaseCredentialElements,
		CAMUNDA_TASKLIST_BASE_URL: {
			type: 'string' as const,
			optional: true,
		},
	}) as BaseCredentials & {
		CAMUNDA_TASKLIST_BASE_URL: string
	}
}
