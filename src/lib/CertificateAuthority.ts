import fs from 'fs'

import { CamundaPlatform8Configuration } from './Configuration'

export function GetCertificateAuthority(
	config: CamundaPlatform8Configuration
): string | undefined {
	const customRootCertPath = config.CAMUNDA_CUSTOM_ROOT_CERT_PATH
	return customRootCertPath
		? fs.readFileSync(customRootCertPath, 'utf-8')
		: undefined
}
