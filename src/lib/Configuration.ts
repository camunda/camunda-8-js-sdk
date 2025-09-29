import debug from 'debug'
import { BeforeRequestHook } from 'got'
import mergeWith from 'lodash.mergewith'
import { createEnv } from 'typed-env'

import { Logger } from '../c8/lib/C8Logger'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - imported for TypeDoc generation, not used in code
import type { IHeadersProvider } from '../oauth' // eslint-disable-line @typescript-eslint/no-unused-vars

import {
	emitConflictWarnings,
	emitDeprecationWarnings,
	parseZeebeGrpcAddress,
} from './ZeebeGrpcAddressUtils'

// This creates a type-only reference that gets erased during compilation
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// type _UnusedTypes = IHeadersProvider
const trace = debug('test:config')

/**
 * We want to get the environment variables from the environment.
 * Optional keys are not required to have a default, but we set them as undefined in order to populate a dictionary of environment variables.
 * Keys with no default value and no value in the environment will not appear in the dictionary.
 */
const mainEnv = createEnv({
	/** Maximum polling backoff time in milliseconds for Job Workers when an error is encountered. Defaults to 16000 (16 seconds). */
	CAMUNDA_JOB_WORKER_MAX_BACKOFF_MS: {
		type: 'number',
		optional: true,
		default: 15000,
	},
	/** Custom user agent  */
	CAMUNDA_CUSTOM_USER_AGENT_STRING: {
		type: 'string',
		optional: true,
		default: undefined,
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
	/** The log level for logging. Defaults to 'info'. Values (in order of priority): 'error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly'. Set to 'none' to suppress logging. */
	CAMUNDA_LOG_LEVEL: {
		type: 'string',
		optional: true,
		choices: [
			'error',
			'warn',
			'info',
			'http',
			'verbose',
			'debug',
			'silly',
			'none',
		],
		default: 'info',
	},
	/**
	 * The address for the Zeebe gRPC Gateway with protocol. Takes precedence over ZEEBE_ADDRESS.
	 * Must include protocol: grpc:// for insecure connections or grpcs:// for secure connections.
	 * Examples: 'grpc://localhost:26500', 'grpcs://zeebe.example.com:443'
	 * When using this, ZEEBE_ADDRESS, ZEEBE_INSECURE_CONNECTION, and CAMUNDA_SECURE_CONNECTION are ignored.
	 */
	ZEEBE_GRPC_ADDRESS: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** The address for the Zeebe REST API. Defaults to localhost:8080 */
	ZEEBE_REST_ADDRESS: {
		type: 'string',
		optional: true,
		default: 'http://localhost:8080',
	},
	/** The address for the Zeebe gRPC Gateway. Defaults to localhost:26500 */
	ZEEBE_ADDRESS: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** This is the client ID for the client credentials */
	ZEEBE_CLIENT_ID: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** This is the client secret for the client credentials */
	ZEEBE_CLIENT_SECRET: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** The OAuth token exchange endpoint url */
	CAMUNDA_OAUTH_URL: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** The OAuth token (used for CAMUNDA_AUTH_STRATEGY "BEARER") */
	CAMUNDA_OAUTH_TOKEN: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** Optional scope parameter for OAuth (needed by some OIDC, such as Microsoft Entra) */
	CAMUNDA_TOKEN_SCOPE: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** The tenant id when multi-tenancy is enabled */
	CAMUNDA_TENANT_ID: {
		type: 'string',
		optional: true,
		default: '<default>',
	},
	/**
	 * The audience parameter for a Zeebe OAuth token request.
	 * This is a synonym for and has precedence over ZEEBE_TOKEN_AUDIENCE. If this value is not set, ZEEBE_TOKEN_AUDIENCE will be used.
	 * */
	CAMUNDA_ZEEBE_OAUTH_AUDIENCE: {
		type: 'string',
		optional: true,
	},
	/**
	 * The audience parameter for a Zeebe OAuth token request. Defaults to zeebe.camunda.io
	 **/
	ZEEBE_TOKEN_AUDIENCE: {
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
	/**
	 * The audience parameter for a Modeler OAuth token request. Defaults to api.cloud.camunda.io when connecting to Camunda SaaS, and '' otherwise
	 * See: https://github.com/camunda/camunda-8-js-sdk/issues/60
	 * */
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
	CAMUNDA_TOKEN_CACHE_DIR: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** Set to true to disable disk caching of OAuth tokens and use memory caching only */
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: {
		type: 'boolean',
		optional: true,
		default: false,
	},
	/**
	 * @deprecated Use ZEEBE_GRPC_ADDRESS with grpc:// or grpcs:// protocol instead.
	 * Control TLS for Zeebe GRPC connections. Defaults to true.
	 *
	 * Note: This setting interacts with the `ZEEBE_INSECURE_CONNECTION` setting in `zeebeGrpcSettings`.
	 * - If `CAMUNDA_SECURE_CONNECTION` is true and `ZEEBE_INSECURE_CONNECTION` is false, a secure TLS connection will be used.
	 * - If `CAMUNDA_SECURE_CONNECTION` is false or `ZEEBE_INSECURE_CONNECTION` is true, an insecure connection will be used.
	 * - Setting both `CAMUNDA_SECURE_CONNECTION` to true and `ZEEBE_INSECURE_CONNECTION` to true will result in a warning
	 *   and an insecure connection will be used.
	 * - Setting both `CAMUNDA_SECURE_CONNECTION` to false and `ZEEBE_INSECURE_CONNECTION` to false will result in a warning
	 *   and an insecure connection will be used.
	 *
	 * @defaultValue true
	 */
	CAMUNDA_SECURE_CONNECTION: {
		type: 'boolean',
		optional: true,
		default: undefined,
	},
	/** The login endpoint for Cookie authentication (for use with C8Run in 8.7). Defaults to http://localhost:8080/api/login */
	CAMUNDA_COOKIE_AUTH_URL: {
		type: 'string',
		optional: true,
		default: 'http://localhost:8080/api/login',
	},
	/** The username for Cookie authentication when `CAMUNDA_AUTH_STRATEGY` is set to `COOKIE`. Defaults to 'demo' */
	CAMUNDA_COOKIE_AUTH_USERNAME: {
		type: 'string',
		optional: true,
		default: 'demo',
	},
	/** The password for Cookie authentication when `CAMUNDA_AUTH_STRATEGY` is set to `COOKIE`. Defaults to 'demo' */
	CAMUNDA_COOKIE_AUTH_PASSWORD: {
		type: 'string',
		optional: true,
		default: 'demo',
	},
	/** In an environment using self-signed certificates, provide the path to the server certificate. Provide this to allow the client to connect to a server secured with this cert. */
	CAMUNDA_CUSTOM_ROOT_CERT_PATH: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** In an environment using self-signed certificates, provide the server certificate as a string. Provide this to allow the client to connect to a server secured with this cert. */
	CAMUNDA_CUSTOM_ROOT_CERT_STRING: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** When using custom or self-signed certificates with mTLS, provide the path to the client certificate chain. Works with Zeebe gRPC. */
	CAMUNDA_CUSTOM_CERT_CHAIN_PATH: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** When using custom or self-signed certificates with mTLS, provide the path to the client private key. Works with Zeebe gRPC. */
	CAMUNDA_CUSTOM_PRIVATE_KEY_PATH: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** The base url for the Operate API */
	CAMUNDA_OPERATE_BASE_URL: {
		type: 'string',
		optional: true,
		default: 'http://localhost:8080/operate',
	},
	/** The base url for the Optimize API */
	CAMUNDA_OPTIMIZE_BASE_URL: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** The base url for the Tasklist API */
	CAMUNDA_TASKLIST_BASE_URL: {
		type: 'string',
		optional: true,
		default: 'http://localhost:8080/tasklist',
	},
	/**
	 * The base url for the Modeler API. Defaults to Camunda Saas - https://modeler.camunda.io/api
	 *
	 * See: https://github.com/camunda/camunda-8-js-sdk/issues/203
	 * */
	CAMUNDA_MODELER_BASE_URL: {
		type: 'string',
		optional: true,
		default: 'https://modeler.camunda.io/api',
	},
	/** The base url for the Admin Console API. */
	CAMUNDA_CONSOLE_BASE_URL: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** Credentials id for Admin Console and Modeler API */
	CAMUNDA_CONSOLE_CLIENT_ID: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** Credentials secret for Admin Console and Modeler API */
	CAMUNDA_CONSOLE_CLIENT_SECRET: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** Username for Basic Auth. Set this when using the `BASIC` auth strategy with `CAMUNDA_AUTH_STRATEGY`. */
	CAMUNDA_BASIC_AUTH_USERNAME: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/** Password for Basic Auth. Set this when using the `BASIC` auth strategy with `CAMUNDA_AUTH_STRATEGY`. */
	CAMUNDA_BASIC_AUTH_PASSWORD: {
		type: 'string',
		optional: true,
		default: undefined,
	},
	/**
	 * The authentication strategy to use for the Camunda 8 SDK. Defaults to 'OAUTH'.
	 * - 'BASIC' - Basic authentication
	 * - 'OAUTH' - OAuth authentication
	 * - 'BEARER' - Bearer token authentication
	 * - 'COOKIE' - Cookie authentication
	 * - 'NONE' - No authentication
	 *
	 * If you are passing in a custom {@link IHeadersProvider} implementation, you can set this to 'NONE' to disable the default authentication.
	 */
	CAMUNDA_AUTH_STRATEGY: {
		type: 'string',
		choices: ['BASIC', 'OAUTH', 'BEARER', 'COOKIE', 'NONE'],
		default: 'NONE',
	},
	/** Set to true to enable an output log file with debugging information and diagnostic traces to assist Camunda Support in technical support. */
	CAMUNDA_SUPPORT_LOG_ENABLED: {
		type: 'boolean',
		optional: true,
		default: false,
	},
	/** Optionally provide a file path for the support log. By default it will be emitted as `camunda-support.log` */
	CAMUNDA_SUPPORT_LOG_FILE_PATH: {
		type: 'string',
		optional: true,
		default: undefined,
	},
})
const zeebeEnv = createEnv({
	/**
	 * @deprecated Use ZEEBE_GRPC_ADDRESS with grpc:// or grpcs:// protocol instead.
	 * Use an insecure connection for Zeebe GRPC.
	 *
	 * Note: This setting interacts with the `CAMUNDA_SECURE_CONNECTION` setting.
	 * - If `ZEEBE_INSECURE_CONNECTION` is false and `CAMUNDA_SECURE_CONNECTION` is true, a secure TLS connection will be used (recommended).
	 * - If `ZEEBE_INSECURE_CONNECTION` is true or `CAMUNDA_SECURE_CONNECTION` is false, an insecure connection will be used.
	 * - Setting both `ZEEBE_INSECURE_CONNECTION` to true and `CAMUNDA_SECURE_CONNECTION` to true will result in a warning
	 *   and an insecure connection will be used.
	 * - Setting both `ZEEBE_INSECURE_CONNECTION` to false and `CAMUNDA_SECURE_CONNECTION` to false will result in a warning
	 *   and an insecure connection will be used.
	 *
	 * @defaultValue false
	 */
	ZEEBE_INSECURE_CONNECTION: {
		type: 'boolean',
		optional: true,
		default: undefined,
	},
	/** Log level of Zeebe Client and Workers - 'DEBUG' | 'INFO' | 'NONE'. Defaults to 'INFO' */
	ZEEBE_CLIENT_LOG_LEVEL: {
		type: 'string',
		optional: true,
		choices: ['DEBUG', 'INFO', 'ERROR', 'NONE'],
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
	/**
	 * After a duration of this time the client/server pings its peer to see if the transport is still alive.
	 * Int valued, milliseconds. Defaults to 360000.
	 */
	GRPC_KEEPALIVE_TIME_MS: {
		type: 'number',
		optional: true,
		default: 360000,
	},
	/**
	 * After waiting for a duration of this time, if the keepalive ping sender does not receive the ping ack, it will close the
	 * transport. Int valued, milliseconds. Defaults to 120000.
	 */
	GRPC_KEEPALIVE_TIMEOUT_MS: {
		type: 'number',
		optional: true,
		default: 120000,
	},
	/**
	 * The time between the first and second connection attempts,
	 * in ms. Defaults to 1000.
	 */
	GRPC_INITIAL_RECONNECT_BACKOFF_MS: {
		type: 'string',
		optional: true,
		default: 1000,
	},
	/**
	 * The maximum time between subsequent connection attempts,
	 * in ms. Defaults to 10000.
	 */
	GRPC_MAX_RECONNECT_BACKOFF_MS: {
		type: 'string',
		optional: true,
		default: 10000,
	},
	/**
	 * The minimum time between subsequent connection attempts,
	 * in ms. Default is 1000ms, but this can cause an SSL Handshake failure.
	 * This causes an intermittent failure in the Worker-LongPoll test when run
	 * against Camunda Cloud.
	 * Raised to 5000ms.
	 * See: https://github.com/grpc/grpc/issues/8382#issuecomment-259482949
	 */
	GRPC_MIN_RECONNECT_BACKOFF_MS: {
		type: 'string',
		optional: true,
		default: 5000,
	},
	/**
	 * Defaults to 90000.
	 */
	GRPC_HTTP2_MIN_TIME_BETWEEN_PINGS_MS: {
		type: 'number',
		optional: true,
		default: 90000,
	},
	/**
	 * Minimum allowed time between a server receiving
	 * successive ping frames without sending any data
	 * frame. Int valued, milliseconds. Default: 90000
	 */
	GRPC_HTTP2_MIN_PING_INTERVAL_WITHOUT_DATA_MS: {
		type: 'number',
		optional: true,
		default: 90000,
	},
	/**
	 * This channel argument if set to 1
	 * (0 : false; 1 : true), allows keepalive pings
	 * to be sent even if there are no calls in flight.
	 * Defaults to 1.
	 */
	GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS: {
		type: 'number',
		optional: true,
		default: 1,
	},
	/**
	 * This channel argument controls the maximum number
	 * of pings that can be sent when there is no other
	 * data (data frame or header frame) to be sent.
	 * GRPC Core will not continue sending pings if we
	 * run over the limit. Setting it to 0 allows sending
	 * pings without sending data.
	 */
	GRPC_HTTP2_MAX_PINGS_WITHOUT_DATA: {
		type: 'number',
		optional: true,
		default: 0,
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
		default: 50, // At 60 seconds, SaaS will throw a 504 Gateway Timeout
	},
	/** After a long poll Job Activation request, this is the cool-off period in milliseconds before the worker requests more work. Defaults to 300  */
	ZEEBE_GRPC_WORKER_POLL_INTERVAL_MS: {
		type: 'number',
		optional: true,
		default: 300,
	},
})

/**
 * These are the configuration parameters for the Camunda 8 SDK.
 * You can pass these into a constructor to create a new client, and any explicit values you pass in will override the environment variables.
 * Otherwise, any of these values can be set in the environment variables and will be used by the SDK.
 *
 * Note that although some values are passed to the constructor in the subkey `zeebeGrpcSettings`, they need no special treatment as environment variables.
 * Simply use the same name as the key in the `zeebeGrpcSettings` object for the environment variable, and the SDK will pick it up.
 */
export const CamundaSDKConfiguration = {
	...mainEnv,
	zeebeGrpcSettings: { ...zeebeEnv },
}

export type CamundaPlatform8Configuration = typeof CamundaSDKConfiguration

type ConfigWithMiddleware = CamundaPlatform8Configuration & {
	middleware?: BeforeRequestHook[]
}

export class CamundaEnvironmentConfigurator {
	public static mergeConfigWithEnvironment = (
		config: DeepPartial<ConfigWithMiddleware>
	): ConfigWithMiddleware => {
		const mergedConfig = mergeWith({}, CamundaSDKConfiguration, config)

		// Set default ZEEBE_GRPC_ADDRESS if neither it nor ZEEBE_ADDRESS are explicitly set
		if (!mergedConfig.ZEEBE_GRPC_ADDRESS && !mergedConfig.ZEEBE_ADDRESS) {
			mergedConfig.ZEEBE_GRPC_ADDRESS = 'grpc://localhost:26500'
		}

		// Handle ZEEBE_GRPC_ADDRESS validation and warnings
		if (mergedConfig.ZEEBE_GRPC_ADDRESS) {
			const address = mergedConfig.ZEEBE_GRPC_ADDRESS
			// Only validate if the address contains protocol (://)
			if (address.includes('://')) {
				try {
					parseZeebeGrpcAddress(address)
				} catch (error) {
					if (error instanceof Error) {
						throw new Error(error.message)
					}
					throw error
				}
			}
		}

		// Emit warnings for deprecated settings
		emitDeprecationWarnings(mergedConfig)

		// Emit warnings for conflicting settings
		emitConflictWarnings(mergedConfig)

		return mergedConfig
	}
}

export type DeepPartial<T> = {
	[K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K]
}

export type Camunda8ClientConfiguration =
	DeepPartial<CamundaPlatform8Configuration> & {
		/** An optional logger. If no logger is supplied, [winston](https://github.com/winstonjs/winston) will be used. */
		logger?: Logger
	}

/**
 * This section creates a type-safe runtime dictionary of environment variables. This is used for Require Configuration.
 */

/**
 * All the environment variables.
 */
export const CamundaEnvironmentVariables = { ...mainEnv, ...zeebeEnv }

function getKeys<T extends object>(obj: T): (keyof T)[] {
	return Object.keys(obj) as (keyof T)[]
}

trace('Building environment variable dictionary')
export const CamundaEnvironmentVariableDictionary = getKeys(
	CamundaEnvironmentVariables
)
trace('Environment variable dictionary', CamundaEnvironmentVariableDictionary)
