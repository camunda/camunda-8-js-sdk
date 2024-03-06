import { createEnv } from 'neon-env'

import { BaseCredentialElements, BaseCredentials } from './basecreds'

export function _getZeebeEnv(): BaseCredentials {
	return createEnv({ ...BaseCredentialElements }) as BaseCredentials
}
