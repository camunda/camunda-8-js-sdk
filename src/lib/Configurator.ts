import mergeWith from 'lodash.mergewith'
/**
 * These are the credentials provided from the Camunda SaaS Console for an API client,
 * with the exception of CAMUNDA_TOKEN_SCOPE and CAMUNDA_TENANT_ID - those two are used
 * for Self-Managed at the moment, and we invented them.
 */
const BaseCredentialEnvironmentVariables = [
	'ZEEBE_ADDRESS',
	'ZEEBE_CLIENT_ID',
	'ZEEBE_CLIENT_SECRET',
	'ZEEBE_AUTHORIZATION_SERVER_URL',
	'ZEEBE_TOKEN_AUDIENCE',
	'CAMUNDA_CLUSTER_ID',
	'CAMUNDA_CLUSTER_REGION',
	'CAMUNDA_CREDENTIALS_SCOPES',
	'CAMUNDA_OAUTH_URL',
	'CAMUNDA_TOKEN_SCOPE',
	'CAMUNDA_TENANT_ID',
] as const

const OAuthConfigurationEnvironmentVariables = [
	'CAMUNDA_TOKEN_CACHE_DIR',
	/* Set to 'memory-only' to disable file cache */
	'CAMUNDA_TOKEN_CACHE',
	/** These only need to be set if they differ from the SaaS and standard Self-Managed settings */
	'CAMUNDA_OPERATE_OAUTH_AUDIENCE',
	'CAMUNDA_OPTIMIZE_OAUTH_AUDIENCE',
	'CAMUNDA_ZEEBE_OAUTH_AUDIENCE',
	'CAMUNDA_TASKLIST_OAUTH_AUDIENCE',
	'CAMUNDA_MODELER_OAUTH_AUDIENCE',
	/** Set this to true to disable OAuth, for example when running in a dev environment */
	'CAMUNDA_OAUTH_DISABLED',
] as const

const TLSSettingEnvironmentVariables = [
	/* Defaults to true. Set to false when connecting to insecure gateway */
	'CAMUNDA_SECURE_CONNECTION',
] as const

const CustomCertificateEnvironmentVariables = [
	'CAMUNDA_CUSTOM_ROOT_CERT_PATH',
	'CAMUNDA_CUSTOM_PRIVATE_KEY_PATH',
	'CAMUNDA_CUSTOM_CERT_CHAIN_PATH',
	// 'ZEEBE_CLIENT_SSL_ROOT_CERTS_PATH',
	// 'ZEEBE_CLIENT_SSL_PRIVATE_KEY_PATH',
	// 'ZEEBE_CLIENT_SSL_CERT_CHAIN_PATH',
] as const

const UrlEnvironmentVariables = [
	'CAMUNDA_OPERATE_BASE_URL',
	'CAMUNDA_OPTIMIZE_BASE_URL',
	'CAMUNDA_TASKLIST_BASE_URL',
	/* This one is not provided by the SaaS credentials, but we default it to the SaaS URL */
	'CAMUNDA_MODELER_BASE_URL',
] as const

/**
 * These are the credentials provided from the Camunda SaaS Console for a Console API client.
 *
 * They are also the credentials to use to get a token for use with Modeler API on SaaS.
 */
const ConsoleCredentialsEnvironmentVariables = [
	'CAMUNDA_CONSOLE_CLIENT_ID',
	'CAMUNDA_CONSOLE_CLIENT_SECRET',
	'CAMUNDA_CONSOLE_BASE_URL',
	'CAMUNDA_CONSOLE_OAUTH_AUDIENCE',
] as const

const ZeebeGrpcSettingsEnvironmentVariables = [
	'ZEEBE_CLIENT_LOG_LEVEL',
	'ZEEBE_GRPC_CLIENT_EAGER_CONNECT',
	/** Set to true to automate retries */
	'ZEEBE_GRPC_CLIENT_RETRY',
	'ZEEBE_GRPC_CLIENT_MAX_RETRIES',
	'ZEEBE_GRPC_CLIENT_MAX_RETRY_TIMEOUT',
	'ZEEBE_GRPC_CLIENT_INITIAL_CONNECTION_TOLERANCE ',
	'GRPC_KEEPALIVE_TIME_MS',
	'ZEEBE_GRPC_CLIENT_CONNECTION_TOLERANCE_MS',
	/* JSON or SIMPLE */
	'ZEEBE_CLIENT_LOG_TYPE',
	/** How long the long poll is held open */
	'ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS',
	/** When a long poll completes, how long to wait before polling again */
	'ZEEBE_GRPC_WORKER_POLL_INTERVAL_MS',
] as const

type EnvFunction = <T extends Readonly<K[]>, K extends string>(
	keys: T
) => {
	[key1 in T[number]]: string | undefined
}

const getEnv: EnvFunction = (keys) => {
	return keys.reduce(
		(prev, current) => ({
			...prev,
			[current]: process.env[current],
		}),
		{} as { [key in (typeof keys)[number]]: string }
	)
}

export const CamundaEnvironmentVariableDictionary = [
	...BaseCredentialEnvironmentVariables,
	...OAuthConfigurationEnvironmentVariables,
	...TLSSettingEnvironmentVariables,
	...CustomCertificateEnvironmentVariables,
	...UrlEnvironmentVariables,
	...ConsoleCredentialsEnvironmentVariables,
	...ZeebeGrpcSettingsEnvironmentVariables,
] as const

export type CamundaEnvironmentVariable =
	(typeof CamundaEnvironmentVariableDictionary)[number]

export class CamundaEnvironmentConfigurator {
	public static ENV = () => ({
		...getEnv([
			...BaseCredentialEnvironmentVariables,
			...TLSSettingEnvironmentVariables,
			...CustomCertificateEnvironmentVariables,
			...UrlEnvironmentVariables,
			...ConsoleCredentialsEnvironmentVariables,
			...OAuthConfigurationEnvironmentVariables,
		]),
		zeebeGrpcSettings: getEnv(ZeebeGrpcSettingsEnvironmentVariables),
	})

	public static mergeConfigWithEnvironment = (
		config: Partial<CamundaPlatform8Configuration>
	): CamundaPlatform8Configuration =>
		mergeWith({}, CamundaEnvironmentConfigurator.ENV(), config)
}

export type CamundaPlatform8Configuration = ReturnType<
	typeof CamundaEnvironmentConfigurator.ENV
>
