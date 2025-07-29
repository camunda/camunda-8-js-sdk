/* eslint-disable @typescript-eslint/no-explicit-any */
import { debug } from 'debug'
import {
	BeforeErrorHook,
	BeforeRetryHook,
	HTTPError as GotHTTPError,
	HandlerFunction,
	Method,
	RequestError,
} from 'got'

import { asyncOperationContext } from './AsyncTrace'
import { CamundaSupportLogger } from './CamundaSupportLogger'
import { CamundaPlatform8Configuration } from './Configuration'
import { HTTPError } from './GotErrors'

const trace = debug('camunda:gotHooks')

const supportLogger = CamundaSupportLogger.getInstance()

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
		const is401 = error.response?.statusCode === 401
		const hasRetried = retryCount && retryCount > 0
		trace('gotBeforeRetryHook: HTTPError detected:', error.response?.statusCode)
		// If we have a 401 error, we handle it by retrying the request only once.
		if (is401 || error.code === '401') {
			// If we get a 401 error, we will retry the request only once.
			if (hasRetried) {
				// If we have already retried, we throw the error to stop retrying.
				throw error
			}
		}
	}
}

/**
 * This function adds the call point to the error stack trace of got errors.
 * This enables users to see where the error originated from.
 *
 * It also logs the error to the Camunda Support log.
 * This is useful for debugging and support purposes.
 */
export const gotBeforeErrorHook =
	(config: CamundaPlatform8Configuration): BeforeErrorHook =>
	(
		error: RequestError & { statusCode?: number; source?: string[] } & {
			options: { context: { stack?: string } }
		}
	) => {
		const { request } = error
		let detail = ''
		if (error instanceof GotHTTPError) {
			error = new HTTPError(error.response)
			try {
				const details = JSON.parse(
					(error.response?.body as string) || '{detail:""}'
				)
				error.statusCode = details.status
				detail = details ?? ''
			} catch (e) {
				error.statusCode = 0
			}
		}
		const enhancedStack = error.options.context.stack?.split('\n')
		error.source = enhancedStack ?? ['No enhanced stack trace available']
		const method = request?.options.method
		const url = request?.options.url.href
		error.message += ` (${method} ${url}). ${JSON.stringify(detail)}`
		if (enhancedStack) {
			error.message += `. Enhanced stack trace available as error.source.`
		}

		/** Hinting for error messages. See https://github.com/camunda/camunda-8-js-sdk/issues/456 */
		/** Here we reason over the error and the configuration to enrich the message with hints */
		if (error.message.includes('Invalid header token')) {
			// This is a parse error, which means the response header was not valid JSON.
			// Debugging for https://github.com/camunda/camunda-8-js-sdk/issues/491
			error.message += ` (response headers: ${error.response?.headers})`
		}
		if (error.code === '401') {
			// the call was unauthorized
			if (config.CAMUNDA_AUTH_STRATEGY === 'OAUTH') {
				if (request?.options.headers?.authorization) {
					/** This is a 401 error, but the token is set in the header */
					error.message +=
						' (this may be due to the client credentials not being authorized to access the resource)'
					if (config.CAMUNDA_TENANT_ID) {
						/** We're *probably* making a multi-tenant call. It might have been overridden in the call, but we don't have access to the body */
						error.message += `. Is the client credential authorized in the tenant?`
					}
				}
			}
		}

		/** Log details of errors to the Camunda Support log */
		supportLogger.log('**ERROR**: Got error during Rest call:')
		supportLogger.log({
			code: error.code,
			message: error.message,
			stack: error.stack,
			requestOptions: error.request?.options,
			source: (error as any).source,
		})

		return error
	}

/**
 *
 * This function is used on a 401 response to retry the request with a new token, one single time.
 * https://github.com/camunda/camunda-8-js-sdk/issues/125
 */
export const makeBeforeRetryHandlerFor401TokenRetry =
	(getHeadersFn) => async (context) => {
		context.headers.authorization = (await getHeadersFn()).authorization
	}

/**
 * Retry configuration for got requests.
 * This configuration is used to retry requests on certain status codes and methods.
 * We will retry on 429 (Too Many Requests) and 503 (Service Unavailable) status codes.
 * 503 is used for Camunda 8 to indicate server backpressure. See: https://github.com/camunda/camunda-8-js-sdk/issues/509
 * 401 (Unauthorized) is used for OAuth token refreshes.
 * We will retry only once on 401 (see the BeforeRetryHook), because the worker polls continuously, and a worker that is misconfigured with an invalid secret will retry indefinitely.
 * This is not ideal, but it is the current behaviour. We need to ensure that such a worker does not flood the broker, so we cause a backoff.
 */
export const GotRetryConfig = {
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[],
	statusCodes: [401, 429, 503],
}
