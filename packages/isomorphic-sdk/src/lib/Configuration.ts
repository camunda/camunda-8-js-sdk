import { BeforeRequestHook } from 'got'
import { createEnv } from 'neon-env'

import { ILogger } from './C8Logger'

const getEnv = () =>
	createEnv({
		/** Custom user agent  */
		CAMUNDA_CUSTOM_USER_AGENT_STRING: {
			type: 'string',
			optional: true,
		},
		/** Set to true to disable OAuth completely */
		CAMUNDA_OAUTH_DISABLED: {
			type: 'boolean',
			optional: true,
			default: false,
		},
		/** How soon in milliseconds before its expiration time a cached OAuth token should be considered expired. Defaults to 1000 */
		CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS: {
			type: 'number',
			optional: true,
			default: 1000,
		},
		/** The log level for logging. Defaults to 'info'. Values (in order of priority): 'error', 'warn', 'info', 'debug', 'trace' */
		CAMUNDA_LOG_LEVEL: {
			type: 'string',
			optional: true,
			choices: ['error', 'warn', 'info', 'debug', 'trace'],
			default: 'info',
		},
		/** The address for the Zeebe GRPC. */
		// ZEEBE_GRPC_ADDRESS: {
		// 	type: 'string',
		// 	optional: true,
		// 	default: 'localhost:26500',
		// },
		/** The address for the Zeebe REST API. Defaults to localhost:8080 */
		ZEEBE_REST_ADDRESS: {
			type: 'string',
			optional: true,
			default: 'http://localhost:8080',
		},
		/** The address for the Zeebe Gateway. Defaults to localhost:26500 */
		// ZEEBE_ADDRESS: {
		// 	type: 'string',
		// 	optional: true,
		// },
		/** This is the client ID for the client credentials */
		ZEEBE_CLIENT_ID: {
			type: 'string',
			optional: true,
		},
		/** This is the client secret for the client credentials */
		ZEEBE_CLIENT_SECRET: {
			type: 'string',
			optional: true,
		},
		/** The client ID for the client credentials. Alias for ZEEBE_CLIENT_ID. */
		CAMUNDA_CLIENT_ID: {
			type: 'string',
			optional: true,
		},
		/** The client secret for the client credentials. Alias for ZEEBE_CLIENT_SECRET. */
		CAMUNDA_CLIENT_SECRET: {
			type: 'string',
			optional: true,
		},
		/** The OAuth token exchange endpoint url */
		CAMUNDA_OAUTH_URL: {
			type: 'string',
			optional: true,
		},
		/** Optional scope parameter for OAuth (needed by some OIDC) */
		CAMUNDA_TOKEN_SCOPE: {
			type: 'string',
			optional: true,
		},
		/** The tenant id when multi-tenancy is enabled */
		CAMUNDA_TENANT_ID: {
			type: 'string',
			optional: true,
		},
		/** The audience parameter for a Zeebe OAuth token request. Defaults to zeebe.camunda.io */
		CAMUNDA_ZEEBE_OAUTH_AUDIENCE: {
			type: 'string',
			optional: true,
			default: 'zeebe.camunda.io',
		},
		/** The audience parameter for an Operate OAuth token request. Defaults to operate.camunda.io */
		CAMUNDA_OPERATE_OAUTH_AUDIENCE: {
			type: 'string',
			optional: true,
			default: 'operate.camunda.io',
		},
		/** The audience parameter for a Tasklist OAuth token request. Defaults to tasklist.camunda.io */
		CAMUNDA_TASKLIST_OAUTH_AUDIENCE: {
			type: 'string',
			optional: true,
			default: 'tasklist.camunda.io',
		},
		/** The audience parameter for a Modeler OAuth token request. Defaults to api.cloud.camunda.io when connecting to Camunda SaaS, and '' otherwise */
		CAMUNDA_MODELER_OAUTH_AUDIENCE: {
			type: 'string',
			optional: true,
			// No default for this, because on Self-Managed it's not needed, and we omit it if the user doesn't set it.
			// However, if someone sets up Self-Managed in a way that needs it, we let them set one.
			// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
		},
		/** The audience parameter for an Optimize OAuth token request. Defaults to optimize.camunda.io */
		CAMUNDA_OPTIMIZE_OAUTH_AUDIENCE: {
			type: 'string',
			optional: true,
			default: 'optimize.camunda.io',
		},
		/** The audience parameter for an Admin Console OAuth token request. Defaults to api.cloud.camunda.io when connecting to Camunda SaaS, and '' otherwise */
		CAMUNDA_CONSOLE_OAUTH_AUDIENCE: {
			type: 'string',
			optional: true,
			default: 'api.cloud.camunda.io',
		},
		/** The directory to cache OAuth tokens on-disk. Defaults to $HOME/.camunda */
		// CAMUNDA_TOKEN_CACHE_DIR: {
		// 	type: 'string',
		// 	optional: true,
		// },
		/** Set to true to disable disk caching of OAuth tokens and use memory caching only */
		// CAMUNDA_TOKEN_DISK_CACHE_DISABLE: {
		// 	type: 'boolean',
		// 	optional: true,
		// 	default: false,
		// },
		/** Control TLS for Zeebe Grpc. Defaults to true. Set to false when using an unsecured gateway */
		// CAMUNDA_SECURE_CONNECTION: {
		// 	type: 'boolean',
		// 	optional: true,
		// 	default: true,
		// },
		/** In an environment using self-signed certificates, provide the path to the root certificate */
		// CAMUNDA_CUSTOM_ROOT_CERT_PATH: {
		// 	type: 'string',
		// 	optional: true,
		// },
		/** When using self-signed certificates, provide the complete certificate chain as a string.
		 *
		 * Refer to the package @camunda8/certificates for the code used to generate this string in a Node.js environment.
		 * */
		CAMUNDA_CUSTOM_CERT_STRING: {
			type: 'string',
			optional: true,
		},
		/** When using custom or self-signed certificates, provide the certificate chain as a string */
		CAMUNDA_CUSTOM_CERT_CHAIN_STRING: {
			type: 'string',
			optional: true,
		},
		/** When using custom or self-signed certificates, provide the path to the certificate chain */
		// CAMUNDA_CUSTOM_CERT_CHAIN_PATH: {
		// 	type: 'string',
		// 	optional: true,
		// },
		/** When using custom or self-signed certificates, provide the private key as a string */
		CAMUNDA_CUSTOM_PRIVATE_KEY_STRING: {
			type: 'string',
			optional: true,
		},
		/** When using custom or self-signed certificates, provide the path to the private key */
		// CAMUNDA_CUSTOM_PRIVATE_KEY_PATH: {
		// 	type: 'string',
		// 	optional: true,
		// },
		/** The base url for the Operate API */
		CAMUNDA_OPERATE_BASE_URL: {
			type: 'string',
			optional: true,
		},
		/** The base url for the Optimize API */
		CAMUNDA_OPTIMIZE_BASE_URL: {
			type: 'string',
			optional: true,
		},
		/** The base url for the Tasklist API */
		CAMUNDA_TASKLIST_BASE_URL: {
			type: 'string',
			optional: true,
		},
		/** The base url for the Modeler API. Defaults to Camunda Saas - https://modeler.cloud.camunda.io/api */
		CAMUNDA_MODELER_BASE_URL: {
			type: 'string',
			optional: true,
			default: 'https://modeler.cloud.camunda.io/api',
		},
		/** The base url for the Admin Console API. */
		CAMUNDA_CONSOLE_BASE_URL: {
			type: 'string',
			optional: true,
		},
		/** Credentials for Admin Console and Modeler API */
		CAMUNDA_CONSOLE_CLIENT_ID: {
			type: 'string',
			optional: true,
		},
		/** Credentials for Admin Console and Modeler API */
		CAMUNDA_CONSOLE_CLIENT_SECRET: {
			type: 'string',
			optional: true,
		},
		/** Username for Basic Auth */
		CAMUNDA_BASIC_AUTH_USERNAME: {
			type: 'string',
			optional: true,
		},
		/** Username for Basic Auth */
		CAMUNDA_BASIC_AUTH_PASSWORD: {
			type: 'string',
			optional: true,
		},
		CAMUNDA_AUTH_STRATEGY: {
			type: 'string',
			choices: ['BASIC', 'OAUTH', 'NONE'],
			default: 'OAUTH',
		},
	})

// Helper type for enforcing array contents to match an object's keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EnforceArrayContent<T, K extends keyof any> =
	T extends Array<K> ? T : never

// Function to create a complete keys array, enforcing completeness at compile time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCompleteKeysArray<K extends keyof any>(
	keys: EnforceArrayContent<K[], K>
): K[] {
	return keys
}

type IsoSdkEnvironmentVariables = ReturnType<typeof getEnv>
export type IsoSdkEnvironmentVariable = keyof IsoSdkEnvironmentVariables
export const IsoSdkEnvironmentVariableDictionary =
	createCompleteKeysArray<IsoSdkEnvironmentVariable>([
		'CAMUNDA_LOG_LEVEL',
		'ZEEBE_REST_ADDRESS',
		'CAMUNDA_OAUTH_DISABLED',
		'CAMUNDA_OAUTH_URL',
		'CAMUNDA_TENANT_ID',
		'CAMUNDA_TOKEN_SCOPE',
		'CAMUNDA_ZEEBE_OAUTH_AUDIENCE',
		'CAMUNDA_BASIC_AUTH_USERNAME',
		'CAMUNDA_BASIC_AUTH_PASSWORD',
		'ZEEBE_CLIENT_ID',
		'ZEEBE_CLIENT_SECRET',
		'CAMUNDA_AUTH_STRATEGY',
		'CAMUNDA_CLIENT_ID',
		'CAMUNDA_CLIENT_SECRET',
		'CAMUNDA_CONSOLE_BASE_URL',
		'CAMUNDA_CONSOLE_CLIENT_ID',
		'CAMUNDA_CONSOLE_CLIENT_SECRET',
		'CAMUNDA_CONSOLE_OAUTH_AUDIENCE',
		'CAMUNDA_CUSTOM_CERT_CHAIN_STRING',
		'CAMUNDA_CUSTOM_PRIVATE_KEY_STRING',
		'CAMUNDA_CUSTOM_CERT_STRING',
	])

export class IsoSdkEnvironmentConfigurator {
	public static ENV = () => getEnv()

	public static mergeConfigWithEnvironment = (
		config: Partial<IsoSdkConfiguration>
	): IsoSdkConfiguration => ({
		...IsoSdkEnvironmentConfigurator.ENV(),
		...config,
	})
}

export type IsoSdkConfiguration = ReturnType<
	typeof IsoSdkEnvironmentConfigurator.ENV
> & {
	middleware?: BeforeRequestHook[]
}

export type IsoSdkClientConfiguration = Partial<IsoSdkConfiguration> & {
	logger?: ILogger
}

export function RequireConfiguration<T>(
	config: T | undefined,
	key: IsoSdkEnvironmentVariable
): T {
	if (!config) {
		throw new Error(
			`Missing required configuration ${key}. Please supply this value as an environment variable or configuration object field.`
		)
	}
	return config
}
