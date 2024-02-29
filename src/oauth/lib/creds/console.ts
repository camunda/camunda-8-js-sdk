import { createEnv } from 'neon-env'

export function _getConsoleEnv() {
	return createEnv({
		CAMUNDA_CONSOLE_CLIENT_ID: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_CONSOLE_CLIENT_SECRET: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_CONSOLE_BASE_URL: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_OAUTH_URL: {
			type: 'string',
			optional: false,
		},
		CAMUNDA_CONSOLE_OAUTH_AUDIENCE: {
			type: 'string',
			optional: false,
		},
	}) as {
		CAMUNDA_CONSOLE_CLIENT_ID: string
		CAMUNDA_CONSOLE_CLIENT_SECRET: string
		CAMUNDA_CONSOLE_BASE_URL: string
		CAMUNDA_OAUTH_URL: string
		CAMUNDA_CONSOLE_OAUTH_AUDIENCE: string
	}
}
