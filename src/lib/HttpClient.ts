/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal got-compatible HTTP client built on undici's `request` API.
 *
 * This replaces got 11 (see https://github.com/camunda/camunda-8-js-sdk/issues/837).
 * It deliberately mirrors the subset of the got API used by this SDK
 * (`client(url, options)`, verb helpers, `.extend()`, `.json()/.text()/.buffer()`,
 * `.cancel()`, hooks, retry, timeouts, TLS options) so that call sites and the
 * public `middleware` / `HTTPError` shapes stay compatible.
 *
 * We use the `undici` package's own `request`, `Agent` and `FormData` (rather than the
 * Node.js globals) so that the TLS dispatcher and request implementation always match,
 * independent of the Node.js-bundled undici version.
 *
 * `request` rather than `fetch`: fetch applies browser-only rules that got 11 did
 * not (e.g. refusing fetch-spec "bad ports" such as 6000 or 6666), which would be
 * a behavioural break for SDK users. Redirects are followed by the redirect
 * interceptor, matching got 11's default.
 */
import { createHash } from 'node:crypto'
import { STATUS_CODES } from 'node:http'
import { Readable } from 'node:stream'

import {
	Agent,
	Dispatcher,
	FormData,
	interceptors,
	request as undiciRequest,
	Response as UndiciResponse,
} from 'undici'

export type Method =
	| 'GET'
	| 'POST'
	| 'PUT'
	| 'PATCH'
	| 'DELETE'
	| 'HEAD'
	| 'OPTIONS'
	| 'TRACE'
	| 'get'
	| 'post'
	| 'put'
	| 'patch'
	| 'delete'
	| 'head'
	| 'options'
	| 'trace'

export type Headers = Record<string, string | string[] | undefined>

export type SearchParams =
	| string
	| URLSearchParams
	| Record<string, string | number | boolean | null | undefined>

export type RequestBody =
	| string
	| Buffer
	| Uint8Array
	| URLSearchParams
	| FormData

export interface HttpsOptions {
	certificateAuthority?: string | Buffer | (string | Buffer)[]
	key?: string | Buffer
	/** Client certificate (PEM). */
	certificate?: string | Buffer
	/** Alias of `certificate`. */
	cert?: string | Buffer
	passphrase?: string
	rejectUnauthorized?: boolean
}

/**
 * The error shape a retry decision is based on. Deliberately structural (not
 * the {@link RequestError} class) so that `calculateDelay` functions written
 * against got 11's `RetryObject` type keep type-checking.
 */
export interface RetryError extends Error {
	code: string
	options: { method: string }
	response?: {
		statusCode: number
		headers: Record<string, string | string[] | undefined>
		body?: unknown
	}
}

export interface RetryObject {
	attemptCount: number
	retryOptions: RequiredRetryOptions
	error: RetryError
	computedValue: number
	/** Parsed `Retry-After` delay in milliseconds, when the response supplied one. */
	retryAfter?: number
}

export interface RequiredRetryOptions {
	limit: number
	methods: Method[]
	statusCodes: number[]
	errorCodes: string[]
	maxRetryAfter?: number
	// Method syntax (bivariant parameter) so got 11-typed `calculateDelay`
	// functions remain assignable. See got11-type-compat.unit.spec.ts.
	calculateDelay(retryObject: RetryObject): number | Promise<number>
}

export type RetryOptions = Partial<RequiredRetryOptions> | number

/**
 * A response a `beforeRequest` hook may return to short-circuit the network
 * call (got 11 contract), e.g. to serve a cached or stubbed response.
 */
export interface ResponseLike {
	statusCode: number
	statusMessage?: string
	headers?: Record<string, string | string[] | undefined>
	body?: string | Buffer
}

export type BeforeRequestHook = (
	options: NormalizedOptions
	// eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => void | ResponseLike | Promise<void | ResponseLike>
export type BeforeRetryHook = (
	options: NormalizedOptions,
	error?: RequestError,
	retryCount?: number
) => void | Promise<void>
export type BeforeErrorHook = (
	error: RequestError
) => RequestError | Promise<RequestError>
export type AfterResponseHook = (
	response: Response
) => Response | Promise<Response>

export interface Hooks {
	beforeRequest?: BeforeRequestHook[]
	beforeRetry?: BeforeRetryHook[]
	beforeError?: BeforeErrorHook[]
	afterResponse?: AfterResponseHook[]
}

/** Runs once per call (not per retry), before any hooks. */
export type HandlerFunction = (options: NormalizedOptions) => void

export interface Options {
	method?: Method
	prefixUrl?: string
	headers?: Headers
	json?: unknown
	body?: RequestBody
	/** application/x-www-form-urlencoded body */
	form?: Record<string, string | number | boolean | undefined>
	searchParams?: SearchParams
	parseJson?: (text: string) => unknown
	retry?: RetryOptions
	timeout?: number | { request?: number }
	throwHttpErrors?: boolean
	username?: string
	password?: string
	context?: Record<string, unknown>
	https?: HttpsOptions
	hooks?: Hooks
	handlers?: HandlerFunction[]
}

export interface NormalizedOptions {
	method: string
	url: URL
	prefixUrl: string
	headers: Record<string, string>
	body?: RequestBody
	json?: unknown
	parseJson: (text: string) => unknown
	retry: RequiredRetryOptions
	timeout: { request?: number }
	throwHttpErrors: boolean
	context: Record<string, any>
	https: HttpsOptions
	hooks: Required<Hooks>
}

export interface Response<T = string> {
	statusCode: number
	statusMessage: string
	headers: Record<string, string | string[]>
	body: T
	rawBody: Buffer
	url: string
	ok: boolean
	retryCount: number
	request: { options: NormalizedOptions }
}

export interface ResponsePromise<T = Response<string>> extends Promise<T> {
	json<J = unknown>(): Promise<J>
	text(): Promise<string>
	buffer(): Promise<Buffer>
	cancel(reason?: string): void
	readonly isCanceled: boolean
}

type VerbFn = (url: string | URL, options?: Options) => ResponsePromise

export interface HttpClient {
	(url: string | URL, options?: Options): ResponsePromise
	get: VerbFn
	post: VerbFn
	put: VerbFn
	patch: VerbFn
	delete: VerbFn
	head: VerbFn
	extend(options: Options): HttpClient
	readonly defaults: Options
}

/* ------------------------------------------------------------------ */
/* Errors                                                             */
/* ------------------------------------------------------------------ */

export class RequestError extends Error {
	code: string
	options: NormalizedOptions
	request?: { options: NormalizedOptions }
	response?: Response<string>
	/** Always undefined; kept for got 11 shape compatibility. */
	timings?: object
	declare cause?: unknown
	constructor(
		message: string,
		{
			code,
			options,
			response,
			cause,
		}: {
			code?: string
			options: NormalizedOptions
			response?: Response<string>
			cause?: unknown
		}
	) {
		super(message)
		this.name = 'RequestError'
		this.code = code ?? 'ERR_GOT_REQUEST_ERROR'
		// Keep these non-enumerable-ish payloads accessible as in got
		this.options = options
		this.request = { options }
		this.response = response
		if (cause !== undefined) {
			Object.defineProperty(this, 'cause', {
				value: cause,
				enumerable: false,
				writable: true,
				configurable: true,
			})
		}
		Object.defineProperty(this, 'options', { enumerable: false })
		Object.defineProperty(this, 'request', { enumerable: false })
		Object.defineProperty(this, 'response', { enumerable: false })
	}
}

export class HTTPError extends RequestError {
	declare response: Response<string>
	constructor(response: Response<string>, options?: NormalizedOptions) {
		super(`Response code ${response.statusCode} (${response.statusMessage})`, {
			code: 'ERR_NON_2XX_3XX_RESPONSE',
			options: options ?? response.request.options,
			response,
		})
		this.name = 'HTTPError'
	}
}

export class TimeoutError extends RequestError {
	event = 'request'
	constructor(ms: number, options: NormalizedOptions) {
		super(`Timeout awaiting 'request' for ${ms}ms`, {
			code: 'ETIMEDOUT',
			options,
		})
		this.name = 'TimeoutError'
	}
}

export class CancelError extends RequestError {
	constructor(reason: string | undefined, options: NormalizedOptions) {
		super(reason ?? 'Promise was canceled', { code: 'ERR_CANCELED', options })
		this.name = 'CancelError'
	}
	get isCanceled() {
		return true
	}
}

export class ParseError extends RequestError {
	constructor(cause: Error, response: Response<string>) {
		super(`${cause.message} in "${response.request.options.url.toString()}"`, {
			code: 'ERR_BODY_PARSE_FAILURE',
			options: response.request.options,
			response,
			cause,
		})
		this.name = 'ParseError'
	}
}

/* ------------------------------------------------------------------ */
/* Defaults                                                           */
/* ------------------------------------------------------------------ */

/** Network error codes that are retried (got 11 defaults plus undici/Node 24 codes). */
export const DEFAULT_RETRY_ERROR_CODES = [
	'ETIMEDOUT',
	'ECONNRESET',
	'EADDRINUSE',
	'ECONNREFUSED',
	'EPIPE',
	'ENOTFOUND',
	'ENETUNREACH',
	'EAI_AGAIN',
	// Node 24.21+ surfaces some refused/closed connections with this code
	'ERR_SOCKET_CLOSED_BEFORE_CONNECTION',
	'UND_ERR_SOCKET',
	'UND_ERR_CONNECT_TIMEOUT',
]

const RETRY_AFTER_STATUS_CODES = [413, 429, 503]

/**
 * Parse a `Retry-After` header (delta-seconds or an HTTP-date) into milliseconds.
 * Returns `undefined` when the error carries no response, the status is not one
 * that uses `Retry-After`, or the header is absent.
 */
export const parseRetryAfter = (error: RetryError): number | undefined => {
	if (
		!error.response ||
		!RETRY_AFTER_STATUS_CODES.includes(error.response.statusCode)
	) {
		return undefined
	}
	const header = error.response.headers['retry-after']
	const value = Array.isArray(header) ? header[0] : header
	if (!value) return undefined
	const seconds = Number(value)
	if (!Number.isNaN(seconds)) return seconds * 1000
	// An HTTP-date Retry-After; a malformed date must be treated as absent
	// (returning NaN here would later collapse to a NaN delay that silently
	// stops retrying instead of falling back to exponential backoff).
	const date = Date.parse(value)
	return Number.isNaN(date) ? undefined : date - Date.now()
}

/** got 11-compatible default backoff: 2^(n-1) * 1000ms + up to 100ms jitter, honouring Retry-After. */
export const defaultCalculateDelay = ({
	attemptCount,
	retryOptions,
	error,
	retryAfter,
}: RetryObject): number => {
	if (attemptCount > retryOptions.limit) return 0
	const hasMethod = retryOptions.methods
		.map((m) => m.toUpperCase())
		.includes(error.options.method.toUpperCase())
	const hasErrorCode = retryOptions.errorCodes.includes(error.code)
	const hasStatusCode =
		!!error.response &&
		retryOptions.statusCodes.includes(error.response.statusCode)
	if (!hasMethod || (!hasErrorCode && !hasStatusCode)) return 0

	if (
		error.response &&
		RETRY_AFTER_STATUS_CODES.includes(error.response.statusCode)
	) {
		const after = retryAfter ?? parseRetryAfter(error)
		if (after !== undefined) {
			if (
				retryOptions.maxRetryAfter !== undefined &&
				after > retryOptions.maxRetryAfter
			) {
				return 0
			}
			// Retry-After: 0 means "retry now" - a 0 delay would mean "do not retry"
			return Math.max(1, after)
		}
		if (error.response.statusCode === 413) return 0
	}
	const noise = Math.random() * 100
	return 2 ** (attemptCount - 1) * 1000 + noise
}

const DEFAULT_RETRY: RequiredRetryOptions = {
	limit: 2,
	methods: ['GET', 'PUT', 'HEAD', 'DELETE', 'OPTIONS', 'TRACE'],
	statusCodes: [408, 413, 429, 500, 502, 503, 504, 521, 522, 524],
	errorCodes: DEFAULT_RETRY_ERROR_CODES,
	maxRetryAfter: undefined,
	calculateDelay: defaultCalculateDelay,
}

/* ------------------------------------------------------------------ */
/* Option merging / normalisation                                     */
/* ------------------------------------------------------------------ */

function lowerCaseHeaders(headers?: Headers): Record<string, string> {
	const out: Record<string, string> = {}
	if (!headers) return out
	for (const [k, v] of Object.entries(headers)) {
		if (v === undefined || v === null) continue
		out[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v)
	}
	return out
}

function toSearchParams(sp?: SearchParams): URLSearchParams {
	if (sp === undefined) return new URLSearchParams()
	if (typeof sp === 'string' || sp instanceof URLSearchParams) {
		return new URLSearchParams(sp)
	}
	const out = new URLSearchParams()
	for (const [k, v] of Object.entries(sp)) {
		if (v === undefined) continue
		out.append(k, v === null ? '' : String(v))
	}
	return out
}

function normalizeRetry(
	base: RetryOptions | undefined,
	override: RetryOptions | undefined
): RetryOptions | undefined {
	if (override === undefined) return base
	const b = typeof base === 'number' ? { limit: base } : (base ?? {})
	const o = typeof override === 'number' ? { limit: override } : override
	return { ...b, ...o }
}

/** Merge two option objects with got.extend()-like semantics. */
export function mergeOptions(base: Options, override: Options = {}): Options {
	const merged: Options = { ...base, ...override }
	merged.headers = { ...(base.headers ?? {}), ...(override.headers ?? {}) }
	merged.context = { ...(base.context ?? {}), ...(override.context ?? {}) }
	merged.https = { ...(base.https ?? {}), ...(override.https ?? {}) }
	merged.retry = normalizeRetry(base.retry, override.retry)
	if (base.searchParams !== undefined || override.searchParams !== undefined) {
		const sp = toSearchParams(base.searchParams)
		const overrideSp = toSearchParams(override.searchParams)
		// Drop each overridden base key once, then append all override entries so
		// repeated params (e.g. tag=a&tag=b) survive instead of collapsing to one.
		for (const key of new Set(overrideSp.keys())) {
			sp.delete(key)
		}
		overrideSp.forEach((v, k) => sp.append(k, v))
		merged.searchParams = sp
	}
	merged.hooks = {
		beforeRequest: [
			...(base.hooks?.beforeRequest ?? []),
			...(override.hooks?.beforeRequest ?? []),
		],
		beforeRetry: [
			...(base.hooks?.beforeRetry ?? []),
			...(override.hooks?.beforeRetry ?? []),
		],
		beforeError: [
			...(base.hooks?.beforeError ?? []),
			...(override.hooks?.beforeError ?? []),
		],
		afterResponse: [
			...(base.hooks?.afterResponse ?? []),
			...(override.hooks?.afterResponse ?? []),
		],
	}
	merged.handlers = [...(base.handlers ?? []), ...(override.handlers ?? [])]
	return merged
}

function resolveUrl(input: string | URL, prefixUrl?: string): URL {
	if (input instanceof URL) return new URL(input.toString())
	if (/^[a-z][a-z\d+\-.]*:\/\//i.test(input)) return new URL(input)
	if (!prefixUrl) {
		throw new TypeError(`Invalid URL: ${input} (no prefixUrl configured)`)
	}
	const prefix = prefixUrl.endsWith('/') ? prefixUrl : `${prefixUrl}/`
	const path = input.startsWith('/') ? input.slice(1) : input
	// got builds prefixUrl + path as a plain string concatenation
	return new URL(prefix + path)
}

function normalize(url: string | URL, options: Options): NormalizedOptions {
	const resolved = resolveUrl(url, options.prefixUrl)
	const extra = toSearchParams(options.searchParams)
	// Drop each overridden URL key once, then append all option entries so
	// repeated params (e.g. tag=a&tag=b) survive instead of collapsing to one.
	for (const key of new Set(extra.keys())) {
		resolved.searchParams.delete(key)
	}
	extra.forEach((v, k) => resolved.searchParams.append(k, v))

	const headers = lowerCaseHeaders(options.headers)
	let body = options.body
	if (options.json !== undefined) {
		body = JSON.stringify(options.json)
		headers['content-type'] ??= 'application/json'
	} else if (options.form !== undefined) {
		body = toSearchParams(options.form).toString()
		headers['content-type'] ??= 'application/x-www-form-urlencoded'
	}
	if (body instanceof FormData) {
		// fetch must set the multipart boundary itself
		delete headers['content-type']
	}
	if (
		(options.username || options.password) &&
		headers['authorization'] === undefined
	) {
		headers['authorization'] = `Basic ${Buffer.from(
			`${options.username ?? ''}:${options.password ?? ''}`
		).toString('base64')}`
	}

	const retryInput = options.retry
	const retry: RequiredRetryOptions =
		typeof retryInput === 'number'
			? { ...DEFAULT_RETRY, limit: retryInput }
			: { ...DEFAULT_RETRY, ...(retryInput ?? {}) }

	const timeout =
		typeof options.timeout === 'number'
			? { request: options.timeout }
			: { ...(options.timeout ?? {}) }

	// got 11 caps Retry-After at the request timeout when maxRetryAfter is unset;
	// otherwise a huge `Retry-After` (e.g. 3600s) would sleep far past the timeout.
	if (retry.maxRetryAfter === undefined && timeout.request !== undefined) {
		retry.maxRetryAfter = timeout.request
	}

	return {
		method: (options.method ?? 'GET').toUpperCase(),
		url: resolved,
		prefixUrl: options.prefixUrl ?? '',
		headers,
		body,
		json: options.json,
		parseJson: options.parseJson ?? JSON.parse,
		retry,
		timeout,
		throwHttpErrors: options.throwHttpErrors ?? true,
		context: { ...(options.context ?? {}) },
		https: { ...(options.https ?? {}) },
		hooks: {
			beforeRequest: [...(options.hooks?.beforeRequest ?? [])],
			beforeRetry: [...(options.hooks?.beforeRetry ?? [])],
			beforeError: [...(options.hooks?.beforeError ?? [])],
			afterResponse: [...(options.hooks?.afterResponse ?? [])],
		},
	}
}

/* ------------------------------------------------------------------ */
/* TLS dispatcher                                                     */
/* ------------------------------------------------------------------ */

/**
 * Dispatcher cache: outer key fingerprints the PEM material, inner key is the
 * raw passphrase. The passphrase is a secret, so it is used as an in-memory
 * map key only and never hashed or serialised into a string key.
 */
const dispatcherCache = new Map<string, Map<string | undefined, Dispatcher>>()

function pemKey(value: unknown): string {
	if (value === undefined || value === null) return ''
	if (Array.isArray(value)) return value.map(pemKey).join('|')
	return createHash('sha256')
		.update(Buffer.isBuffer(value) ? value : String(value))
		.digest('hex')
}

/** Returns an undici Agent configured for custom CA / mTLS, or undefined for the default dispatcher. */
function getTlsDispatcher(https: HttpsOptions): Dispatcher | undefined {
	const cert = https.certificate ?? https.cert
	const {
		certificateAuthority: ca,
		key,
		passphrase,
		rejectUnauthorized,
	} = https
	if (
		ca === undefined &&
		cert === undefined &&
		key === undefined &&
		rejectUnauthorized === undefined
	) {
		return undefined
	}
	const cacheKey = [
		pemKey(ca),
		pemKey(cert),
		pemKey(key),
		String(rejectUnauthorized),
	].join(':')
	let byPassphrase = dispatcherCache.get(cacheKey)
	if (!byPassphrase) {
		byPassphrase = new Map()
		dispatcherCache.set(cacheKey, byPassphrase)
	}
	let dispatcher = byPassphrase.get(passphrase)
	if (!dispatcher) {
		dispatcher = new Agent({
			connect: {
				ca: ca as any,
				cert: cert as any,
				key: key as any,
				passphrase,
				...(rejectUnauthorized === undefined ? {} : { rejectUnauthorized }),
			},
		})
		byPassphrase.set(passphrase, dispatcher)
	}
	return dispatcher
}

const MAX_REDIRECTS = 10 // got 11 default

/**
 * Default (non-TLS-customised) dispatcher, owned by this package's undici.
 * We deliberately do not use getGlobalDispatcher(): the process-global
 * dispatcher belongs to Node's bundled undici, whose version varies by Node
 * release (6.x on Node 22), and composing this package's interceptors onto
 * it fails with UND_ERR_INVALID_ARG ("invalid onError method").
 */
let defaultAgent: Dispatcher | undefined
const redirectingDispatchers = new WeakMap<Dispatcher, Dispatcher>()

/**
 * Returns the dispatcher for a request: the TLS-configured Agent (or the global
 * package-owned default Agent) composed with redirect following, as got 11 followed redirects.
 */
export function getDispatcher(https: HttpsOptions): Dispatcher {
	const base = getTlsDispatcher(https) ?? (defaultAgent ??= new Agent())
	let composed = redirectingDispatchers.get(base)
	if (!composed) {
		composed = base.compose(
			interceptors.redirect({ maxRedirections: MAX_REDIRECTS })
		)
		redirectingDispatchers.set(base, composed)
	}
	return composed
}

/* ------------------------------------------------------------------ */
/* Request execution                                                  */
/* ------------------------------------------------------------------ */

/** Extract a Node/undici error code from a transport failure (walking any cause chain). */
function networkErrorCode(err: any): string | undefined {
	let e = err
	for (let i = 0; i < 5 && e; i++) {
		if (typeof e.code === 'string') return e.code
		e = e.cause
	}
	return undefined
}

function networkErrorMessage(err: any): string {
	let e = err
	let msg = err?.message ?? String(err)
	for (let i = 0; i < 5 && e?.cause; i++) {
		e = e.cause
		if (e?.message) msg = e.message
	}
	return msg
}

function sleep(ms: number, signal: AbortSignal): Promise<void> {
	return new Promise((resolve, reject) => {
		if (signal.aborted) return reject(signal.reason)
		const t = setTimeout(() => {
			signal.removeEventListener('abort', onAbort)
			resolve()
		}, ms)
		const onAbort = () => {
			clearTimeout(t)
			reject(signal.reason)
		}
		signal.addEventListener('abort', onAbort, { once: true })
	})
}

function responseHeaders(
	h: Record<string, string | string[] | undefined> | undefined
) {
	const out: Record<string, string | string[]> = {}
	for (const [key, value] of Object.entries(h ?? {})) {
		if (value === undefined) continue
		const k = key.toLowerCase()
		if (k === 'set-cookie') {
			out[k] = Array.isArray(value) ? value : [value]
		} else {
			out[k] = Array.isArray(value) ? value.join(', ') : value
		}
	}
	return out
}

/** Turn a beforeRequest short-circuit return value into a Response. */
function fromResponseLike(
	like: ResponseLike,
	options: NormalizedOptions,
	retryCount: number
): Response<string> {
	const rawBody = Buffer.isBuffer(like.body)
		? like.body
		: Buffer.from(like.body ?? '', 'utf8')
	return {
		statusCode: like.statusCode,
		statusMessage: like.statusMessage ?? STATUS_CODES[like.statusCode] ?? '',
		headers: responseHeaders(like.headers),
		body: rawBody.toString('utf8'),
		rawBody,
		url: options.url.toString(),
		ok: like.statusCode >= 200 && like.statusCode < 300,
		retryCount,
		request: { options },
	}
}

function isResponseLike(value: unknown): value is ResponseLike {
	return (
		typeof value === 'object' &&
		value !== null &&
		typeof (value as ResponseLike).statusCode === 'number'
	)
}

async function applyBeforeError(
	error: RequestError,
	options: NormalizedOptions
): Promise<RequestError> {
	let e = error
	for (const hook of options.hooks.beforeError) {
		e = await hook(e)
	}
	return e
}

/**
 * Encode the request body for undici's `request`. FormData is serialised
 * per attempt (so retries resend it) via the WHATWG Response body extractor,
 * which streams Blob parts lazily and supplies the multipart boundary.
 */
function encodeBody(options: NormalizedOptions): {
	body: string | Buffer | Uint8Array | Readable | undefined
	headers: Record<string, string>
} {
	if (options.method === 'GET' || options.method === 'HEAD') {
		return { body: undefined, headers: options.headers }
	}
	const body = options.body
	if (body instanceof FormData) {
		const encoded = new UndiciResponse(body)
		return {
			body: encoded.body ? Readable.fromWeb(encoded.body as any) : undefined,
			headers: {
				...options.headers,
				'content-type': encoded.headers.get('content-type') as string,
			},
		}
	}
	if (body instanceof URLSearchParams) {
		return { body: body.toString(), headers: options.headers }
	}
	return { body, headers: options.headers }
}

async function executeOnce(
	options: NormalizedOptions,
	cancelSignal: AbortSignal,
	retryCount: number,
	shortCircuit?: ResponseLike
): Promise<Response<string>> {
	const timeoutMs = options.timeout.request
	const timeoutController = new AbortController()
	const timer =
		timeoutMs !== undefined && !shortCircuit
			? setTimeout(
					() => timeoutController.abort(new TimeoutError(timeoutMs, options)),
					timeoutMs
				)
			: undefined
	const signal = AbortSignal.any([cancelSignal, timeoutController.signal])
	const rethrowAbort = () => {
		if (timeoutController.signal.aborted) throw timeoutController.signal.reason
		if (cancelSignal.aborted) throw cancelSignal.reason
	}
	try {
		let response: Response<string>
		if (shortCircuit) {
			response = fromResponseLike(shortCircuit, options, retryCount)
		} else {
			let res: Dispatcher.ResponseData
			try {
				const { body, headers } = encodeBody(options)
				res = await undiciRequest(options.url, {
					method: options.method as Dispatcher.HttpMethod,
					headers,
					body,
					signal,
					dispatcher: getDispatcher(options.https),
				})
			} catch (err: any) {
				rethrowAbort()
				throw new RequestError(networkErrorMessage(err), {
					code: networkErrorCode(err),
					options,
					cause: err,
				})
			}
			let rawBody: Buffer
			try {
				rawBody = Buffer.from(await res.body.arrayBuffer())
			} catch (err: any) {
				rethrowAbort()
				throw new RequestError(networkErrorMessage(err), {
					code: networkErrorCode(err) ?? 'ERR_READING_RESPONSE_STREAM',
					options,
					cause: err,
				})
			}
			response = {
				statusCode: res.statusCode,
				statusMessage: STATUS_CODES[res.statusCode] ?? '',
				headers: responseHeaders(res.headers),
				body: rawBody.toString('utf8'),
				rawBody,
				url: options.url.toString(),
				ok: res.statusCode >= 200 && res.statusCode < 300,
				retryCount,
				request: { options },
			}
		}
		for (const hook of options.hooks.afterResponse) {
			response = await hook(response)
		}
		// Evaluate the final response returned by the hooks (a hook may recover a
		// 5xx into a success), not the original status. With redirects followed,
		// got treats only 2xx and 304 as successful.
		const status = response.statusCode
		const isOk = (status >= 200 && status < 300) || status === 304
		if (!isOk) {
			throw new HTTPError(response, options)
		}
		return response
	} finally {
		if (timer) clearTimeout(timer)
	}
}

async function executeWithRetry(
	options: NormalizedOptions,
	cancelSignal: AbortSignal
): Promise<Response<string>> {
	let attempt = 0
	for (;;) {
		try {
			// Run beforeRequest middleware before every attempt (including retries)
			// so hooks that refresh signatures, timestamps or attempt-specific
			// headers see fresh state on each try, as got does.
			// As in got 11, a hook that returns a response short-circuits the
			// network call; later hooks are skipped.
			let shortCircuit: ResponseLike | undefined
			for (const hook of options.hooks.beforeRequest) {
				const result = await hook(options)
				if (isResponseLike(result)) {
					shortCircuit = result
					break
				}
			}
			return await executeOnce(options, cancelSignal, attempt, shortCircuit)
		} catch (err) {
			if (err instanceof CancelError || cancelSignal.aborted) {
				throw err instanceof CancelError
					? err
					: new CancelError(undefined, options)
			}
			const error =
				err instanceof RequestError
					? err
					: new RequestError((err as Error)?.message ?? String(err), {
							options,
							cause: err,
						})
			attempt++
			// Do not swallow exceptions from a user-supplied calculateDelay:
			// let them propagate so the outer error path wraps them with request
			// context and runs beforeError, instead of masking a configuration or
			// programming failure behind the unrelated request error.
			const retryAfter = parseRetryAfter(error)
			const computedValue = defaultCalculateDelay({
				attemptCount: attempt,
				retryOptions: options.retry,
				error,
				computedValue: 0,
				retryAfter,
			})
			const delay =
				options.retry.calculateDelay === defaultCalculateDelay
					? computedValue
					: await options.retry.calculateDelay({
							attemptCount: attempt,
							retryOptions: options.retry,
							error,
							computedValue,
							retryAfter,
						})
			if (!delay || delay <= 0) {
				// Retries are exhausted (or this status/error is not retriable).
				// When the caller opted out of throwing on HTTP errors, hand back
				// the final response instead of throwing — but only for HTTP status
				// errors, which carry a response. Network/parse/cancel errors still
				// throw.
				if (
					!options.throwHttpErrors &&
					error instanceof HTTPError &&
					error.response
				) {
					return error.response
				}
				throw error
			}
			// beforeRetry hooks may throw to abort retrying
			for (const hook of options.hooks.beforeRetry) {
				await hook(options, error, attempt)
			}
			await sleep(delay, cancelSignal).catch(() => {
				throw new CancelError(undefined, options)
			})
		}
	}
}

function createResponsePromise(
	options: NormalizedOptions,
	handlers: HandlerFunction[]
): ResponsePromise {
	const controller = new AbortController()
	let canceled = false

	const core: Promise<Response<string>> = (async () => {
		try {
			// Run handlers inside the try so a throwing handler (e.g. beforeCallHook)
			// is enriched by beforeError like hook/transport failures, not returned raw.
			for (const handler of handlers) {
				handler(options)
			}
			return await executeWithRetry(options, controller.signal)
		} catch (err) {
			if (err instanceof CancelError) throw err
			// Hook errors (beforeRequest/beforeRetry/afterResponse) may be ordinary
			// Error objects with no `.options`; wrap them so beforeError hooks that
			// read `error.options` don't mask the original error with a TypeError.
			const requestError =
				err instanceof RequestError
					? err
					: new RequestError((err as Error)?.message ?? String(err), {
							options,
							cause: err,
						})
			throw await applyBeforeError(requestError, options)
		}
	})()

	const parse = async <J>(): Promise<J> => {
		const response = await core
		if (response.body === '') return '' as unknown as J
		try {
			return options.parseJson(response.body) as J
		} catch (e) {
			throw await applyBeforeError(
				new ParseError(e as Error, response),
				options
			)
		}
	}

	const promise = core as ResponsePromise
	Object.defineProperties(promise, {
		json: { value: parse },
		text: { value: () => core.then((r) => r.body) },
		buffer: { value: () => core.then((r) => r.rawBody) },
		cancel: {
			value: (reason?: string) => {
				if (canceled) return
				canceled = true
				controller.abort(new CancelError(reason, options))
			},
		},
		isCanceled: { get: () => canceled },
	})
	return promise
}

/* ------------------------------------------------------------------ */
/* Client factory                                                     */
/* ------------------------------------------------------------------ */

export function createHttpClient(defaults: Options = {}): HttpClient {
	const request = (url: string | URL, options: Options = {}) => {
		const merged = mergeOptions(defaults, options)
		const normalized = normalize(url, merged)
		return createResponsePromise(normalized, merged.handlers ?? [])
	}
	const verb =
		(method: Method): VerbFn =>
		(url, options) =>
			request(url, { ...options, method })

	const client = request as HttpClient
	Object.assign(client, {
		get: verb('GET'),
		post: verb('POST'),
		put: verb('PUT'),
		patch: verb('PATCH'),
		delete: verb('DELETE'),
		head: verb('HEAD'),
		extend: (options: Options) =>
			createHttpClient(mergeOptions(defaults, options)),
	})
	Object.defineProperty(client, 'defaults', { value: defaults })
	return client
}

/** Default client, analogous to `import got from 'got'`. */
export const http = createHttpClient()

export { FormData }
