/* eslint-disable @typescript-eslint/no-explicit-any */
import http from 'node:http'
import https from 'node:https'

import { debug } from 'debug'
import { BeforeRetryHook, HandlerFunction, Method, RequestError } from 'got'

import { CamundaRestError } from '../c8/lib/C8Dto'

import { asyncOperationContext } from './AsyncTrace'
import { CamundaSupportLogger } from './CamundaSupportLogger'

const trace = debug('camunda:gotHooks')

export const supportLogger = CamundaSupportLogger.getInstance()

/**
 * Capturing useful async stack traces is challenging with got.
 * See here: https://github.com/sindresorhus/got/blob/main/documentation/async-stack-traces.md
 * This function stores the call point from the application of got requests.
 * This enables users to see where the error originated from.
 */

export const beforeCallHook: HandlerFunction = (options, next) => {
	if (Object.isFrozen(options.context)) {
		options.context = { ...options.context, hasRetried: false }
	}
	// If we stored the creation stack in the async context, we can use it to enhance the stack trace of the request.
	const creationStack = asyncOperationContext.getStore()?.creationStack
	const obj = {}
	Error.captureStackTrace(obj, beforeCallHook)
	Error.stackTraceLimit = 100
	options.context.stack = creationStack
		? `${creationStack}\n${(obj as any).stack as string}`
		: ((obj as any).stack as string)
	supportLogger.log(`Rest call:`)
	supportLogger.log(options)
	return next(options)
}

/**
 * This function is used to handle 401 errors in got requests.
 * It will retry the request only once if the error code is 401.
 * Otherwise, for 429 and 503 errors, it will retry according to the GotRetryConfig.
 */
export const gotBeforeRetryHook: BeforeRetryHook = (_, error, retryCount) => {
	trace(
		'gotBeforeRetryHook called with error:',
		JSON.stringify(Object.keys(error as unknown as object))
	)
	if (error instanceof RequestError) {
		const errorDetail = error.response?.body as CamundaRestError
		const statusCode = errorDetail?.status
		const is401 = statusCode === 401
		const hasRetried = retryCount && retryCount > 0
		trace('gotBeforeRetryHook: HTTPError detected: ', statusCode)
		// If we have a 401 error, we handle it by retrying the request only once.
		if (is401) {
			// If we get a 401 error, we will retry the request only once.
			if (hasRetried) {
				// If we have already retried, we throw the error to stop retrying.
				throw error
			}
		}
	}
}

/**
 * Retry configuration for got requests.
 * This configuration is used to retry requests on certain status codes and methods.
 * We will retry on 429 (Too Many Requests) and 503 (Service Unavailable) status codes.
 * 503 and 500 with a specific title or detail string is used for Camunda 8 to indicate server backpressure.
 *    See: https://github.com/camunda/camunda-8-js-sdk/issues/509 and https://github.com/camunda/camunda-8-js-sdk/issues/612
 * 401 (Unauthorized) is used for OAuth token refreshes.
 * We will retry only once on 401 (see the BeforeRetryHook), because the worker polls continuously, and a worker that is misconfigured with an invalid secret will retry indefinitely.
 * This is not ideal, but it is the current behaviour. We need to ensure that such a worker does not flood the broker, so we cause a backoff.
 */
export const GotRetryConfig = {
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[],
	// 429 is the backpressure status code on 8.7
	// 503 is the backpressure status code on 8.8.3+
	// 500 is the backpressure status code on 8.7 + 8.8.0-2 for job activation only
	// - we handle Job activation backpressure in the worker directly
	// See: https://github.com/camunda/camunda/issues/25806#issuecomment-3459961630
	statusCodes: [429, 503],
}

/**
 * Request function for got that works around a crash on Node.js >= 24.20.
 *
 * Since 24.20, when the socket closes before the connection is established
 * (e.g. ECONNREFUSED), Node also calls the `ClientRequest.end()` callback with
 * an `ERR_SOCKET_CLOSED_BEFORE_CONNECTION` error. got 11 hands that error to its
 * stream's `_final` callback, so it surfaces as a raw, context-free `'error'`
 * on got's request - after got has already scheduled a retry for the real
 * error. The promise rejects with the raw error, and when the retry timer
 * fires, p-cancelable throws "The `onCancel` handler was attached after the
 * promise settled" as an uncaught exception, crashing the process.
 *
 * The real error still arrives through the request's `'error'` event, which got
 * handles (and retries) properly, so we drop the error from the `end()`
 * callback. got 11 is no longer maintained; this goes away with the move off got.
 * See: https://github.com/camunda/camunda-8-js-sdk/pull/840
 */
export const GotRequestFunction = (
	url: URL,
	options: https.RequestOptions,
	callback?: (res: http.IncomingMessage) => void
): http.ClientRequest => {
	const req = (url.protocol === 'https:' ? https : http).request(
		url,
		options,
		callback
	)
	const end = req.end as (...a: any[]) => http.ClientRequest
	req.end = function (this: http.ClientRequest, ...args: any[]) {
		const i = args.findIndex((a) => typeof a === 'function')
		if (i !== -1) {
			const cb = args[i]
			args[i] = () => cb()
		}
		return end.apply(this, args)
	} as typeof req.end
	return req
}
