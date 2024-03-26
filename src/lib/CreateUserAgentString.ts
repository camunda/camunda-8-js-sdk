import { CamundaPlatform8Configuration, DeepPartial } from './Configuration'
import { packageVersion } from './GetPackageVersion'

export const createUserAgentString = (
	config: DeepPartial<CamundaPlatform8Configuration>
) => {
	const userAgent = `camunda8-sdk-nodejs/${packageVersion}`
	const customUserAgent = config.CAMUNDA_CUSTOM_USER_AGENT_STRING
	return customUserAgent ? `${userAgent} ${customUserAgent}` : `${userAgent}`
}
