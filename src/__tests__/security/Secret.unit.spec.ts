import { randomUUID } from 'crypto'
import util from 'util'

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { CamundaEnvironmentConfigurator } from '../../lib/Configuration'
import { EnvironmentSetup } from '../../lib/EnvironmentSetup'
import {
	SECRET_CONFIG_KEYS,
	Secret,
	revealSecret,
	toSecret,
} from '../../lib/Secret'
import {
	BasicAuthProvider,
	BearerAuthProvider,
	CookieAuthProvider,
	OAuthProvider,
} from '../../oauth'

/**
 * Credentials must not be reachable by any default rendering of an object
 * that holds them: the config objects and the auth providers.
 * Design: https://github.com/camunda/camunda-8-js-sdk/issues/917
 */

const canary = () => `CANARY-${randomUUID()}`

/** Every way an SDK object can end up in a log line. */
function renderings(value: unknown): string[] {
	const out = [
		util.inspect(value, { depth: Infinity, showHidden: true, getters: true }),
		util.format('%s %o %O %j', value, value, value, value),
		String(value),
		`${value}`,
	]
	try {
		out.push(JSON.stringify(value) ?? '')
	} catch {
		/* circular structures are rendered by inspect above */
	}
	if (value && typeof value === 'object') {
		out.push(util.inspect({ ...value }, { depth: Infinity, showHidden: true }))
		out.push(util.inspect(Object.entries(value), { depth: Infinity }))
	}
	return out
}

function expectNoCanary(value: unknown, secret: string) {
	for (const rendered of renderings(value)) {
		expect(rendered).not.toContain(secret)
	}
}

describe('Secret', () => {
	it('redacts every default rendering and returns the value only from reveal()', () => {
		const value = canary()
		const secret = new Secret(value)
		expectNoCanary(secret, value)
		expectNoCanary({ nested: { secret } }, value)
		expect(Object.keys(secret)).toEqual([])
		expect(secret.reveal()).toBe(value)
		expect(revealSecret(secret)).toBe(value)
		expect(revealSecret('plain')).toBe('plain')
	})

	it('cannot be modified', () => {
		const secret = new Secret('a')
		expect(Object.isFrozen(secret)).toBe(true)
	})

	it('toSecret wraps strings, keeps Secrets, and treats empty as unset', () => {
		const s = new Secret('x')
		expect(toSecret(s)).toBe(s)
		expect(toSecret('y')).toBeInstanceOf(Secret)
		expect(toSecret('')).toBeUndefined()
		expect(toSecret(undefined)).toBeUndefined()
	})
})

describe('credential config keys', () => {
	let saved: NodeJS.ProcessEnv
	beforeEach(() => {
		saved = { ...process.env }
		EnvironmentSetup.wipeEnv()
	})
	afterEach(() => {
		process.env = saved
	})

	it('are held as Secret after merging explicit config', () => {
		const values = Object.fromEntries(
			SECRET_CONFIG_KEYS.map((k) => [k, canary()])
		)
		const merged =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(values)
		for (const key of SECRET_CONFIG_KEYS) {
			expect(merged[key]).toBeInstanceOf(Secret)
			expect(merged[key]?.reveal()).toBe(values[key])
			expectNoCanary(merged, values[key])
		}
	})

	it('are held as Secret when read from the environment', async () => {
		const values = Object.fromEntries(
			SECRET_CONFIG_KEYS.map((k) => [k, canary()])
		)
		Object.assign(process.env, values)
		const { vi } = await import('vitest')
		vi.resetModules()
		const fresh = await import('../../lib/Configuration')
		expectNoCanary(fresh.CamundaSDKConfiguration, values.ZEEBE_CLIENT_SECRET)
		const merged =
			fresh.CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({})
		for (const key of SECRET_CONFIG_KEYS) {
			expect(merged[key]?.reveal()).toBe(values[key])
			expectNoCanary(merged, values[key])
		}
	})
})

describe('auth providers', () => {
	beforeEach(() => {
		EnvironmentSetup.wipeEnv()
	})

	it('OAuthProvider does not expose client secrets', () => {
		const secret = canary()
		const consoleSecret = canary()
		const provider = new OAuthProvider({
			config: {
				CAMUNDA_OAUTH_URL: 'http://localhost:1/token',
				ZEEBE_CLIENT_ID: 'id',
				ZEEBE_CLIENT_SECRET: secret,
				CAMUNDA_CONSOLE_CLIENT_ID: 'console-id',
				CAMUNDA_CONSOLE_CLIENT_SECRET: consoleSecret,
				CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
			},
		})
		expectNoCanary(provider, secret)
		expectNoCanary(provider, consoleSecret)
	})

	it('BasicAuthProvider does not expose the password, and still sends it', async () => {
		const password = canary()
		const provider = new BasicAuthProvider({
			config: {
				CAMUNDA_BASIC_AUTH_USERNAME: 'user',
				CAMUNDA_BASIC_AUTH_PASSWORD: password,
			},
		})
		expectNoCanary(provider, password)
		const { authorization } = await provider.getHeaders('ZEEBE')
		expect(
			Buffer.from(authorization.replace('Basic ', ''), 'base64').toString()
		).toBe(`user:${password}`)
	})

	it('BearerAuthProvider does not expose the token, and still sends it', async () => {
		const token = canary()
		const provider = new BearerAuthProvider({
			config: { CAMUNDA_OAUTH_TOKEN: token },
		})
		expectNoCanary(provider, token)
		expect((await provider.getHeaders('ZEEBE')).authorization).toBe(
			`Bearer ${token}`
		)
		const next = canary()
		await provider.setToken(next)
		expectNoCanary(provider, next)
		expect((await provider.getHeaders('ZEEBE')).authorization).toBe(
			`Bearer ${next}`
		)
	})

	it('CookieAuthProvider does not expose the password', () => {
		const password = canary()
		const provider = new CookieAuthProvider({
			config: { CAMUNDA_COOKIE_AUTH_PASSWORD: password },
		})
		expectNoCanary(provider, password)
	})
})
