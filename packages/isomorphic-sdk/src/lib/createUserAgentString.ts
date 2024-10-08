export function createUserAgentString(config: {
	CAMUNDA_CUSTOM_USER_AGENT_STRING?: string
}) {
	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const pkg = require('../../package.json')
	const packageVersion = pkg.version
	const userAgent = `camunda8-sdk-nodejs/${packageVersion}`
	const customUserAgent = config.CAMUNDA_CUSTOM_USER_AGENT_STRING
	return customUserAgent ? `${userAgent} ${customUserAgent}` : `${userAgent}`
}
