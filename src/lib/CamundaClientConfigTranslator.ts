/**
 * CamundaClientConfigTranslator
 * ---------------------------------
 * Translates Camunda 8 JS SDK configuration (constructor overrides + environment)
 * into an EnvOverrides object suitable for hydrating the Orchestration Cluster API
 * (OCA) client via its `hydrateConfig` function.
 *
 * Precedence (highest -> lowest) for each OCA config key:
 * 1. Explicit OCA overrides passed into translator (ocaOverrides)
 * 2. Matching OCA environment variable in `env` / process.env
 * 3. Derived/mapped value from merged SDK configuration
 * 4. OCA schema default (not emitted – left for OCA hydrator)
 *
 * Unsupported auth strategies (BEARER, COOKIE, others) throw.
 * Empty string override / env values are treated as unset.
 */
// NOTE: Importing deep internal hydration APIs from the orchestration client is avoided here
// to keep this translator usable in unit-test contexts where package export maps may block deep imports.
// We define a lightweight EnvOverrides type compatible with the orchestration client's expectations.
export type EnvOverrides = Record<string, string | number | boolean>
import {
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
} from './Configuration'

export interface CamundaClientTranslationOptions {
	/** Partial explicit SDK configuration object passed by user */
	sdkConfig?: Camunda8ClientConfiguration
	/** Explicit overrides for OCA keys to short‑circuit translation for those keys */
	ocaOverrides?: EnvOverrides
	/** Environment source – defaults to process.env */
	env?: Record<string, string | undefined>
	/** If true, return hydrated configuration instead of raw overrides */
	hydrate?: boolean
}

/** Log level mapping SDK -> OCA */
const LOG_LEVEL_MAP: Record<
	string,
	'silent' | 'error' | 'warn' | 'info' | 'debug' | 'trace'
> = {
	none: 'silent',
	error: 'error',
	warn: 'warn',
	info: 'info',
	http: 'debug', // Decision: treat http as debug detail
	verbose: 'debug',
	debug: 'debug',
	silly: 'trace',
}

function normalizeEmpty(v: string | undefined): string | undefined {
	if (v === undefined || v === null) return undefined
	const s = String(v).trim()
	return s === '' ? undefined : s
}

function appendV2IfNeeded(address: string): string {
	if (!address) return address
	const lower = address.toLowerCase()
	// If already contains /v2 segment (end or mid-path) do nothing
	if (/(\/v2(\/|$))/i.test(lower)) return address
	// Ensure single trailing slash semantics
	return address.endsWith('/') ? `${address}v2` : `${address}/v2`
}

/**
 * Translate merged SDK configuration into OCA EnvOverrides
 */
export function translateToOcaEnvOverrides(
	options: CamundaClientTranslationOptions
): EnvOverrides {
	const { sdkConfig, ocaOverrides, env } = options
	const sourceEnv = env ?? process.env

	// Merge SDK config with environment
	const mergedSdk = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
		sdkConfig ?? {}
	) as Camunda8ClientConfiguration

	const overrides: EnvOverrides = { ...(ocaOverrides ?? {}) }

	const setIfAbsent = (
		key: keyof EnvOverrides,
		value: string | number | boolean | undefined
	) => {
		// If an explicit override already exists, do nothing.
		if (overrides[key] !== undefined) return
		const existingEnv = normalizeEmpty(sourceEnv[key as string])
		if (existingEnv !== undefined) {
			// Promote existing OCA env value into overrides for explicitness
			overrides[key] = existingEnv
			return
		}
		if (value === undefined) return
		overrides[key] = value
	}

	// Auth strategy
	const sdkAuth = (
		normalizeEmpty(mergedSdk.CAMUNDA_AUTH_STRATEGY) || 'NONE'
	).toUpperCase()
	if (!['NONE', 'OAUTH', 'BASIC'].includes(sdkAuth)) {
		throw new Error(
			`Unsupported auth strategy for OCA translation: ${sdkAuth}. Supported: NONE|OAUTH|BASIC.`
		)
	}
	setIfAbsent('CAMUNDA_AUTH_STRATEGY', sdkAuth)

	// Client credentials
	const clientId =
		normalizeEmpty(mergedSdk.ZEEBE_CLIENT_ID) ??
		normalizeEmpty(mergedSdk.CAMUNDA_CONSOLE_CLIENT_ID)
	setIfAbsent('CAMUNDA_CLIENT_ID', clientId)
	const clientSecret =
		normalizeEmpty(mergedSdk.ZEEBE_CLIENT_SECRET) ??
		normalizeEmpty(mergedSdk.CAMUNDA_CONSOLE_CLIENT_SECRET)
	setIfAbsent('CAMUNDA_CLIENT_SECRET', clientSecret)

	// Audience
	const audience =
		normalizeEmpty(mergedSdk.CAMUNDA_ZEEBE_OAUTH_AUDIENCE) ??
		normalizeEmpty(mergedSdk.ZEEBE_TOKEN_AUDIENCE)
	setIfAbsent('CAMUNDA_TOKEN_AUDIENCE', audience)

	// OAuth URL & scope
	setIfAbsent('CAMUNDA_OAUTH_URL', normalizeEmpty(mergedSdk.CAMUNDA_OAUTH_URL))
	setIfAbsent(
		'CAMUNDA_OAUTH_SCOPE',
		normalizeEmpty(mergedSdk.CAMUNDA_TOKEN_SCOPE)
	)

	// Cache dir (skip if disk cache disabled)
	if (!mergedSdk.CAMUNDA_TOKEN_DISK_CACHE_DISABLE) {
		setIfAbsent(
			'CAMUNDA_OAUTH_CACHE_DIR',
			normalizeEmpty(mergedSdk.CAMUNDA_TOKEN_CACHE_DIR)
		)
	}

	// Basic auth supplementary fields
	if (sdkAuth === 'BASIC') {
		setIfAbsent(
			'CAMUNDA_BASIC_AUTH_USERNAME',
			normalizeEmpty(mergedSdk.CAMUNDA_BASIC_AUTH_USERNAME)
		)
		setIfAbsent(
			'CAMUNDA_BASIC_AUTH_PASSWORD',
			normalizeEmpty(mergedSdk.CAMUNDA_BASIC_AUTH_PASSWORD)
		)
	}

	// Tenant
	setIfAbsent(
		'CAMUNDA_DEFAULT_TENANT_ID',
		normalizeEmpty(mergedSdk.CAMUNDA_TENANT_ID)
	)

	// Log level mapping
	const rawLevel = normalizeEmpty(mergedSdk.CAMUNDA_LOG_LEVEL) || 'error'
	const mappedLevel = LOG_LEVEL_MAP[rawLevel] ?? 'error'
	setIfAbsent('CAMUNDA_SDK_LOG_LEVEL', mappedLevel)

	// REST address
	const restBase =
		normalizeEmpty(mergedSdk.ZEEBE_REST_ADDRESS) || 'http://localhost:8080'
	setIfAbsent('CAMUNDA_REST_ADDRESS', appendV2IfNeeded(restBase))

	// mTLS (path precedence)
	const certPath = normalizeEmpty(mergedSdk.CAMUNDA_CUSTOM_CERT_CHAIN_PATH)
	const keyPath = normalizeEmpty(mergedSdk.CAMUNDA_CUSTOM_PRIVATE_KEY_PATH)
	const caPath = normalizeEmpty(mergedSdk.CAMUNDA_CUSTOM_ROOT_CERT_PATH)
	const caInline = normalizeEmpty(mergedSdk.CAMUNDA_CUSTOM_ROOT_CERT_STRING)

	if (certPath) setIfAbsent('CAMUNDA_MTLS_CERT_PATH', certPath)
	if (keyPath) setIfAbsent('CAMUNDA_MTLS_KEY_PATH', keyPath)
	if (caPath) setIfAbsent('CAMUNDA_MTLS_CA_PATH', caPath)
	else if (caInline) setIfAbsent('CAMUNDA_MTLS_CA', caInline)

	return overrides
}

/** Convenience wrapper returning hydrated configuration directly */
export default {
	translateToOcaEnvOverrides,
}
