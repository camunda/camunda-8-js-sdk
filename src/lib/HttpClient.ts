/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal got-compatible HTTP client built on undici's fetch.
 *
 * This replaces got 11 (see https://github.com/camunda/camunda-8-js-sdk/issues/837).
 * It deliberately mirrors the subset of the got API used by this SDK
 * (`client(url, options)`, verb helpers, `.extend()`, `.json()/.text()/.buffer()`,
 * `.cancel()`, hooks, retry, timeouts, TLS options) so that call sites and the
 * public `middleware` / `HTTPError` shapes stay compatible.
 *
 * We use the `undici` package's own `fetch`, `Agent` and `FormData` (rather than the
 * Node.js globals) so that the TLS dispatcher and fetch implementation always match,
 * independent of the Node.js-bundled undici version.
 */
import { createHash } from 'node:crypto'

import { Agent, Dispatcher, FormData, fetch } from 'undici'

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

export interface RetryObject {
	attemptCount: number
	retryOptions: RequiredRetryOptions
	error: RequestError
	computedValue: number
}

export interface RequiredRetryOptions {
	limit: number
	methods: Method[]
	statusCodes: number[]
	errorCodes: string[]
	maxRetryAfter?: number
	calculateDelay: (retryObject: RetryObject) => number
}

export type RetryOptions = Partial<RequiredRetryOptions> | number

export type BeforeRequestHook = (
	options: NormalizedOptions
) => void | Promise<void>
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
	timings: undefined
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
		this.timings = undefined
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

/** got 11-compatible default backoff: 2^(n-1) * 1000ms + up to 100ms jitter, honouring Retry-After. */
export const defaultCalculateDelay = ({
	attemptCount,
	retryOptions,
	error,
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
		const header = error.response.headers['retry-after']
		const value = Array.isArray(header) ? header[0] : header
		if (value) {
			let after = Number(value)
			if (Number.isNaN(after)) {
				after = Date.parse(value) - Date.now()
			} else {
				after *= 1000
			}
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
	const b = typeof base === 'number' ? { limit: base } : base ?? {}
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
		toSearchParams(override.searchParams).forEach((v, k) => sp.set(k, v))
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
	extra.forEach((v, k) => resolved.searchParams.set(k, v))

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

const dispatcherCache = new Map<string, Dispatcher>()

function pemKey(value: unknown): string {
	if (value === undefined || value === null) return ''
	if (Array.isArray(value)) return value.map(pemKey).join('|')
	return createHash('sha256')
		.update(Buffer.isBuffer(value) ? value : String(value))
		.digest('hex')
}

/** Returns an undici Agent configured for custom CA / mTLS, or undefined for the default dispatcher. */
export function getDispatcher(https: HttpsOptions): Dispatcher | undefined {
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
		pemKey(passphrase),
		String(rejectUnauthorized),
	].join(':')
	let dispatcher = dispatcherCache.get(cacheKey)
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
		dispatcherCache.set(cacheKey, dispatcher)
	}
	return dispatcher
}

/* ------------------------------------------------------------------ */
/* Request execution                                                  */
/* ------------------------------------------------------------------ */

/** Extract a Node/undici error code from a fetch failure (`TypeError: fetch failed` with a cause chain). */
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

function responseHeaders(h: globalThis.Headers | any) {
	const out: Record<string, string | string[]> = {}
	h.forEach((value: string, key: string) => {
		if (key !== 'set-cookie') out[key] = value
	})
	const cookies: string[] =
		typeof h.getSetCookie === 'function' ? h.getSetCookie() : []
	if (cookies.length) out['set-cookie'] = cookies
	return out
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

async function executeOnce(
	options: NormalizedOptions,
	cancelSignal: AbortSignal,
	retryCount: number
): Promise<Response<string>> {
	const timeoutMs = options.timeout.request
	const timeoutController = new AbortController()
	const timer =
		timeoutMs !== undefined
			? setTimeout(
					() => timeoutController.abort(new TimeoutError(timeoutMs, options)),
					timeoutMs
				)
			: undefined
	const signal = AbortSignal.any([cancelSignal, timeoutController.signal])
	try {
		let res
		try {
			res = await fetch(options.url, {
				method: options.method,
				headers: options.headers,
				body:
					options.method === 'GET' || options.method === 'HEAD'
						? undefined
						: (options.body as any),
				signal,
				dispatcher: getDispatcher(options.https),
			})
		} catch (err: any) {
			if (timeoutController.signal.aborted) {
				throw timeoutController.signal.reason
			}
			if (cancelSignal.aborted) {
				throw cancelSignal.reason
			}
			throw new RequestError(networkErrorMessage(err), {
				code: networkErrorCode(err),
				options,
				cause: err,
			})
		}
		let rawBody: Buffer
		try {
			rawBody = Buffer.from(await res.arrayBuffer())
		} catch (err: any) {
			if (timeoutController.signal.aborted) {
				throw timeoutController.signal.reason
			}
			if (cancelSignal.aborted) throw cancelSignal.reason
			throw new RequestError(networkErrorMessage(err), {
				code: networkErrorCode(err) ?? 'ERR_READING_RESPONSE_STREAM',
				options,
				cause: err,
			})
		}
		let response: Response<string> = {
			statusCode: res.status,
			statusMessage: res.statusText,
			headers: responseHeaders(res.headers),
			body: rawBody.toString('utf8'),
			rawBody,
			url: res.url || options.url.toString(),
			ok: res.ok,
			retryCount,
			request: { options },
		}
		for (const hook of options.hooks.afterResponse) {
			response = await hook(response)
		}
		if (options.throwHttpErrors && !(res.status >= 200 && res.status < 400)) {
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
	for (const hook of options.hooks.beforeRequest) {
		await hook(options)
	}
	let attempt = 0
	for (;;) {
		try {
			return await executeOnce(options, cancelSignal, attempt)
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
			let delay = 0
			try {
				const computedValue = defaultCalculateDelay({
					attemptCount: attempt,
					retryOptions: options.retry,
					error,
					computedValue: 0,
				})
				delay =
					options.retry.calculateDelay === defaultCalculateDelay
						? computedValue
						: options.retry.calculateDelay({
								attemptCount: attempt,
								retryOptions: options.retry,
								error,
								computedValue,
							})
			} catch {
				delay = 0
			}
			if (!delay || delay <= 0) {
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
		for (const handler of handlers) {
			handler(options)
		}
		try {
			return await executeWithRetry(options, controller.signal)
		} catch (err) {
			if (err instanceof CancelError) throw err
			throw await applyBeforeError(err as RequestError, options)
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
