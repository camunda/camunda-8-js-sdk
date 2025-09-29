import debug from 'debug'

import { CookieAuthProvider, NullAuthProvider, OAuthProvider } from '../oauth'
import { BasicAuthProvider } from '../oauth/lib/BasicAuthProvider'
import { BearerAuthProvider } from '../oauth/lib/BearerAuthProvider'

import { CamundaPlatform8Configuration } from './Configuration'

const trace = debug('camunda:oauth')

export function constructOAuthProvider(
	config: CamundaPlatform8Configuration,
	options?: { explicitFromConstructor?: boolean }
) {
	// Record the original (possibly defaulted) strategy
	let effectiveStrategy = config.CAMUNDA_AUTH_STRATEGY

	// Legacy override: if CAMUNDA_OAUTH_DISABLED=true we hard-force NONE, even if user explicitly set another strategy.
	// This preserves backward compatibility with historical semantics while making the precedence explicit.
	if (config.CAMUNDA_OAUTH_DISABLED) {
		trace(
			'CAMUNDA_OAUTH_DISABLED is true; forcing CAMUNDA_AUTH_STRATEGY=NONE and skipping any auto-selection'
		)
		effectiveStrategy = 'NONE'
		config.CAMUNDA_AUTH_STRATEGY = 'NONE'
	}
	const explicitFromEnv = process.env.CAMUNDA_AUTH_STRATEGY !== undefined
	const explicitFromConstructor = !!options?.explicitFromConstructor

	// Determine if we can safely auto-promote to OAuth
	const hasAppCreds = !!config.ZEEBE_CLIENT_ID && !!config.ZEEBE_CLIENT_SECRET
	const hasConsoleCreds =
		!!config.CAMUNDA_CONSOLE_CLIENT_ID && !!config.CAMUNDA_CONSOLE_CLIENT_SECRET
	const oauthUrlPresent = !!config.CAMUNDA_OAUTH_URL
	const oauthNotDisabled = !config.CAMUNDA_OAUTH_DISABLED
	const canAutoSelectOAuth =
		oauthUrlPresent && oauthNotDisabled && (hasAppCreds || hasConsoleCreds)

	// Auto-select logic: only when strategy is the default 'NONE' *and* user did not explicitly set it in the environment
	if (
		effectiveStrategy === 'NONE' &&
		!explicitFromEnv &&
		!explicitFromConstructor &&
		canAutoSelectOAuth
	) {
		trace(
			'Auth strategy auto-selected as OAUTH (implicit) based on presence of CAMUNDA_OAUTH_URL and credentials'
		)
		effectiveStrategy = 'OAUTH'
		// Reflect the promotion so downstream logging / diagnostics see the final choice
		config.CAMUNDA_AUTH_STRATEGY = 'OAUTH'
	}

	trace(`Auth strategy (effective) is ${effectiveStrategy}`)
	trace(`OAuth disabled is ${config.CAMUNDA_OAUTH_DISABLED}`)

	if (config.CAMUNDA_OAUTH_DISABLED || effectiveStrategy === 'NONE') {
		trace('Disabling Auth')
		return new NullAuthProvider()
	}

	if (effectiveStrategy === 'BASIC') {
		trace('Using Basic Auth')
		return new BasicAuthProvider({ config })
	}
	if (effectiveStrategy === 'BEARER') {
		trace('Using Bearer Token')
		return new BearerAuthProvider({ config })
	}
	if (effectiveStrategy === 'COOKIE') {
		trace('Using Cookie Auth')
		return new CookieAuthProvider({ config })
	}

	trace('Using OAuth')
	return new OAuthProvider({ config })
}
