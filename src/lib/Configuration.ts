import mergeWith from 'lodash.mergewith'
import { createEnv } from 'neon-env'

const getMainEnv = () =>
	createEnv({
		/** Set to true to disable OAuth completely */
		CAMUNDA_OAUTH_DISABLED: {
			type: 'boolean',
			optional: true,
			default: false,
		},
		/** The address for the Zeebe Gateway. Defaults to localhost:26500 */
		ZEEBE_ADDRESS: {
			type: 'string',
			optional: true,
			default: 'localhost:26500',
		},
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
			// See: https://github.com/camunda-community-hub/camunda-8-js-sdk/issues/60
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
		CAMUNDA_TOKEN_CACHE_DIR: {
			type: 'string',
			optional: true,
		},
		/** Set to true to disable disk caching of OAuth tokens and use memory caching only */
		CAMUNDA_TOKEN_DISK_CACHE_DISABLE: {
			type: 'boolean',
			optional: true,
			default: false,
		},
		/** Control TLS for Zeebe Grpc. Defaults to true. Set to false when using an unsecured gateway */
		CAMUNDA_SECURE_CONNECTION: {
			type: 'boolean',
			optional: true,
			default: true,
		},
		/** In an environment using self-signed certificates, provide the path to the root certificate */
		CAMUNDA_CUSTOM_ROOT_CERT_PATH: {
			type: 'string',
			optional: true,
		},
		/** When using custom or self-signed certificates, provide the path to the certificate chain */
		CAMUNDA_CUSTOM_CERT_CHAIN_PATH: {
			type: 'string',
			optional: true,
		},
		/** When using custom or self-signed certificates, provide the path to the private key */
		CAMUNDA_CUSTOM_PRIVATE_KEY_PATH: {
			type: 'string',
			optional: true,
		},
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
	})

const getZeebeEnv = () =>
	createEnv({
		/** Log level of Zeebe Client and Workers - 'DEBUG' | 'INFO' | 'NONE'. Defaults to 'INFO' */
		ZEEBE_CLIENT_LOG_LEVEL: {
			type: 'string',
			optional: true,
			choices: ['DEBUG', 'INFO', 'NONE'],
			default: 'INFO',
		},
		/** Immediately connect to the Zeebe Gateway (issues a silent topology request). Defaults to false */
		ZEEBE_GRPC_CLIENT_EAGER_CONNECT: {
			type: 'boolean',
			optional: true,
			default: false,
		},
		/** Automate retrying operations that fail due to network conditions or broker backpressure. Defaults to true */
		ZEEBE_GRPC_CLIENT_RETRY: {
			type: 'boolean',
			optional: true,
			default: true,
		},
		/** Maximum number of retries of network operations before failing. Defaults to -1 (infinite retries) */
		ZEEBE_GRPC_CLIENT_MAX_RETRIES: {
			type: 'number',
			optional: true,
			default: -1,
		},
		/** When retrying failed network operations, retries back off to this maximum period. Defaults to 10s */
		ZEEBE_GRPC_CLIENT_MAX_RETRY_TIMEOUT_SECONDS: {
			type: 'number',
			optional: true,
			default: 10,
		},
		/** This suppresses intermediate errors during initial connection negotiation. On Camunda SaaS this defaults to 6000, on Self-Managed to 0 */
		ZEEBE_GRPC_CLIENT_INITIAL_CONNECTION_TOLERANCE_MS: {
			type: 'number',
			optional: true,
		},
		/** The gRPC channel can "jitter". This suppresses a connection error message if the channel comes back within this window in milliseconds. Defaults to 3000 */
		ZEEBE_GRPC_CLIENT_CONNECTION_TOLERANCE_MS: {
			type: 'number',
			optional: true,
			default: 3000,
		},
		GRPC_KEEPALIVE_TIME_MS: {
			type: 'number',
			optional: true,
		},
		/** Zeebe client log output can be human-readable 'SIMPLE' or structured 'JSON'. Defaults to 'SIMPLE' */
		ZEEBE_CLIENT_LOG_TYPE: {
			type: 'string',
			choices: ['JSON', 'SIMPLE'],
			default: 'SIMPLE',
		},
		/** How long in seconds the long poll Job Activation request is held open by a worker. Defaults to 60 */
		ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS: {
			type: 'number',
			optional: true,
			default: 60,
		},
		/** After a long poll Job Activation request, this is the cool-off period in milliseconds before the worker requests more work. Defaults to 300  */
		ZEEBE_GRPC_WORKER_POLL_INTERVAL_MS: {
			type: 'number',
			optional: true,
			default: 300,
		},
	})

const getEnv = () => ({
	...getMainEnv(),
	zeebeGrpcSettings: getZeebeEnv(),
})

// Helper type for enforcing array contents to match an object's keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EnforceArrayContent<T, K extends keyof any> = T extends Array<K>
	? T
	: never

// Function to create a complete keys array, enforcing completeness at compile time
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function createCompleteKeysArray<K extends keyof any>(
	keys: EnforceArrayContent<K[], K>
): K[] {
	return keys
}

type CamundaEnvironmentVariables = ReturnType<typeof getMainEnv> &
	ReturnType<typeof getZeebeEnv>
export type CamundaEnvironmentVariable = keyof CamundaEnvironmentVariables
export const CamundaEnvironmentVariableDictionary =
	createCompleteKeysArray<CamundaEnvironmentVariable>([
		'CAMUNDA_CONSOLE_BASE_URL',
		'CAMUNDA_CONSOLE_CLIENT_ID',
		'CAMUNDA_CONSOLE_CLIENT_SECRET',
		'CAMUNDA_CONSOLE_OAUTH_AUDIENCE',
		'CAMUNDA_MODELER_BASE_URL',
		'CAMUNDA_MODELER_OAUTH_AUDIENCE',
		'CAMUNDA_OPERATE_BASE_URL',
		'CAMUNDA_OPERATE_OAUTH_AUDIENCE',
		'CAMUNDA_OPTIMIZE_BASE_URL',
		'CAMUNDA_OPTIMIZE_OAUTH_AUDIENCE',
		'CAMUNDA_OAUTH_DISABLED',
		'CAMUNDA_OAUTH_URL',
		'CAMUNDA_SECURE_CONNECTION',
		'CAMUNDA_TASKLIST_BASE_URL',
		'CAMUNDA_TASKLIST_OAUTH_AUDIENCE',
		'CAMUNDA_TENANT_ID',
		'CAMUNDA_TOKEN_CACHE_DIR',
		'CAMUNDA_TOKEN_DISK_CACHE_DISABLE',
		'CAMUNDA_TOKEN_SCOPE',
		'CAMUNDA_ZEEBE_OAUTH_AUDIENCE',
		'GRPC_KEEPALIVE_TIME_MS',
		'ZEEBE_ADDRESS',
		'ZEEBE_CLIENT_ID',
		'ZEEBE_CLIENT_SECRET',
		'ZEEBE_CLIENT_LOG_LEVEL',
		'ZEEBE_CLIENT_LOG_TYPE',
		'ZEEBE_GRPC_CLIENT_EAGER_CONNECT',
		'ZEEBE_GRPC_CLIENT_MAX_RETRIES',
		'ZEEBE_GRPC_CLIENT_MAX_RETRY_TIMEOUT_SECONDS',
		'ZEEBE_GRPC_CLIENT_RETRY',
		'ZEEBE_GRPC_CLIENT_CONNECTION_TOLERANCE_MS',
		'ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS',
		'ZEEBE_GRPC_WORKER_POLL_INTERVAL_MS',
	])

export class CamundaEnvironmentConfigurator {
	public static ENV = () => getEnv()

	public static mergeConfigWithEnvironment = (
		config: DeepPartial<CamundaPlatform8Configuration>
	): CamundaPlatform8Configuration =>
		mergeWith({}, CamundaEnvironmentConfigurator.ENV(), config)
}

export type CamundaPlatform8Configuration = ReturnType<
	typeof CamundaEnvironmentConfigurator.ENV
>

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}
