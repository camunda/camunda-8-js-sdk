/**
 * An opaque holder for a credential (client secret, password, bearer token).
 *
 * The value is stored in a runtime-private field, so inspection, spread,
 * enumeration, serialisation and string conversion cannot reach it. Every
 * default rendering returns `[REDACTED]`. The only way to read the value is
 * {@link Secret.reveal}. ESLint allows that call only where the credential
 * goes out on the wire or is hashed (see `.eslintrc.json`).
 *
 * Design: https://github.com/camunda/camunda-8-js-sdk/issues/917
 */
export class Secret {
	static readonly REDACTED = '[REDACTED]'

	readonly #value: string

	constructor(value: string) {
		this.#value = value
		Object.freeze(this)
	}

	/** Returns the plain value. Use only where the credential is sent or hashed. */
	reveal(): string {
		return this.#value
	}

	toString(): string {
		return Secret.REDACTED
	}

	toJSON(): string {
		return Secret.REDACTED
	}

	[Symbol.toPrimitive](): string {
		return Secret.REDACTED
	}

	[Symbol.for('nodejs.util.inspect.custom')](): string {
		return `Secret(${Secret.REDACTED})`
	}
}

/** Wraps a credential in a {@link Secret}. Empty strings and undefined stay undefined. */
export function toSecret(value: string | Secret | undefined | null) {
	if (value instanceof Secret) {
		return value
	}
	if (value === undefined || value === null || value === '') {
		return undefined
	}
	return new Secret(String(value))
}

/**
 * The configuration keys that hold credentials. These are wrapped in a
 * {@link Secret} when configuration is read, so no plain copy is kept on a
 * config object.
 */
export const SECRET_CONFIG_KEYS = [
	'ZEEBE_CLIENT_SECRET',
	'CAMUNDA_CONSOLE_CLIENT_SECRET',
	'CAMUNDA_OAUTH_TOKEN',
	'CAMUNDA_BASIC_AUTH_PASSWORD',
	'CAMUNDA_COOKIE_AUTH_PASSWORD',
] as const

export type SecretConfigKey = (typeof SECRET_CONFIG_KEYS)[number]

/** Returns a shallow copy of `config` with every credential key wrapped in a {@link Secret}. */
export function wrapSecretConfig<T extends object>(config: T): T {
	const out = { ...config } as Record<string, unknown>
	for (const key of SECRET_CONFIG_KEYS) {
		if (key in out) {
			out[key] = toSecret(out[key] as string | Secret | undefined)
		}
	}
	return out as T
}

/**
 * Returns the plain value of a credential, accepting either form. Use only
 * where the credential is sent, hashed, or handed to another library that
 * requires a plain string.
 */
export function revealSecret(value: string | Secret | undefined | null) {
	if (value instanceof Secret) {
		return value.reveal()
	}
	return value ?? undefined
}
