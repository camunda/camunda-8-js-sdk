import {packageVersion} from '../package-version.js'

export function createUserAgentString(config: {
	CAMUNDA_CUSTOM_USER_AGENT_STRING?: string;
}) {
	const userAgent = `camunda8-sdk-nodejs/${packageVersion}`
	const customUserAgent = config.CAMUNDA_CUSTOM_USER_AGENT_STRING
	return customUserAgent ? `${userAgent} ${customUserAgent}` : `${userAgent}`
}
