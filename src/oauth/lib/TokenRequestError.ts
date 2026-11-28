import { sanitizeSensitiveString } from '../../lib/CamundaSupportLogger'

/**
 * The only error a credential-carrying request (OAuth token request, cookie
 * login) may throw.
 *
 * HTTP client errors keep a reference to the request options, and with them
 * the request body or URL that holds the credential. This error is built from
 * an allowlist of fields copied from the original, after sanitising. It has
 * no `cause` and no reference to the original error, request or response.
 *
 * Design: https://github.com/camunda/camunda-8-js-sdk/issues/917 (part 2)
 */
export class TokenRequestError extends Error {
	override readonly name = 'TokenRequestError'
	/** HTTP status of the response, if there was one. */
	readonly statusCode?: number
	/** Error code of a network-level failure, for example ECONNREFUSED. */
	readonly code?: string
	/** OAuth `error` field of the response, if it had one. */
	readonly error?: string
	/** OAuth `error_description` field of the response, if it had one. */
	readonly errorDescription?: string

	constructor(
		message: string,
		fields: {
			statusCode?: number
			code?: string
			error?: string
			errorDescription?: string
		} = {}
	) {
		// Callers pass only text they wrote or sanitised; see from().
		super(message)
		const clean = (v?: string) =>
			v === undefined ? undefined : sanitizeSensitiveString(String(v))
		this.statusCode = fields.statusCode
		this.code = clean(fields.code)
		this.error = clean(fields.error)
		this.errorDescription = clean(fields.errorDescription)
	}

	/**
	 * Builds a clean error from whatever the request threw. Reads only the
	 * fields listed here; everything else on the original is dropped.
	 */
	static from(e: unknown, context: string): TokenRequestError {
		if (e instanceof TokenRequestError) {
			return e
		}
		const original = (e ?? {}) as {
			message?: unknown
			code?: unknown
			statusCode?: unknown
			response?: { statusCode?: unknown; body?: unknown }
		}
		const statusCode = asNumber(
			original.response?.statusCode ?? original.statusCode
		)
		const code =
			typeof original.code === 'string' &&
			/^[A-Z][A-Z0-9_]+$/.test(original.code)
				? original.code
				: undefined
		const { error, errorDescription } = oauthError(original.response?.body)
		const reason =
			statusCode !== undefined
				? `HTTP ${statusCode}${
						error ? ` ${sanitizeSensitiveString(error)}` : ''
					}${
						errorDescription
							? `: ${sanitizeSensitiveString(errorDescription)}`
							: ''
					}`
				: code ??
					(e instanceof Error && e.name === 'SyntaxError'
						? 'response is not valid JSON'
						: e instanceof Error
							? firstLine(e.message)
							: 'unknown error')
		return new TokenRequestError(`${context}: ${reason}`, {
			statusCode,
			code,
			error,
			errorDescription,
		})
	}
}

function asNumber(v: unknown) {
	return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : undefined
}

function firstLine(s: string) {
	return s.split('\n')[0].slice(0, 200)
}

/** Reads only the standard OAuth error fields (RFC 6749 section 5.2) from a response body. */
function oauthError(body: unknown): {
	error?: string
	errorDescription?: string
} {
	if (typeof body !== 'string' || body.length === 0) {
		return {}
	}
	try {
		const parsed = JSON.parse(body) as Record<string, unknown>
		const pick = (k: string) =>
			typeof parsed?.[k] === 'string'
				? firstLine(parsed[k] as string)
				: undefined
		return {
			error: pick('error'),
			errorDescription: pick('error_description'),
		}
	} catch {
		return {}
	}
}
