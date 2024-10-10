import { HTTPError as GotHTTPError, Method } from 'got'

import { HTTPError } from './GotErrors'

/**
 *
 * This function stores the call point from the application of got requests.
 * This enables users to see where the error originated from.
 */
export const gotErrorHandler = (options, next) => {
	if (Object.isFrozen(options.context)) {
		options.context = { ...options.context, hasRetried: false }
	}
	Error.captureStackTrace(options.context)

	return next(options)
}

/**
 * This function adds the call point to the error stack trace of got errors.
 * This enables users to see where the error originated from.
 */
export const gotBeforeErrorHook = (error) => {
	const { request } = error
	let detail = ''
	if (error instanceof GotHTTPError) {
		error = new HTTPError(error.response)
		try {
			const details = JSON.parse(
				(error.response?.body as string) || '{detail:""}'
			)
			error.statusCode = details.status
			detail = details.detail ?? ''
		} catch (e) {
			error.statusCode = 0
		}
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	;(error as any).source = (error as any).options.context.stack.split('\n')
	error.message += ` (request to ${request?.options.url.href}). ${detail}`
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

export const GotRetryConfig = {
	limit: 1,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[],
	statusCodes: [401],
}
