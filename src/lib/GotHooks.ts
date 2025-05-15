/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	BeforeErrorHook,
	HTTPError as GotHTTPError,
	HandlerFunction,
	Method,
} from 'got'

import { CamundaSupportLogger } from './CamundaSupportLogger'
import { HTTPError } from './GotErrors'

const supportLogger = CamundaSupportLogger.getInstance()

/**
 *
 * This function stores the call point from the application of got requests.
 * This enables users to see where the error originated from.
 */
export const gotErrorHandler: HandlerFunction = (options, next) => {
	if (Object.isFrozen(options.context)) {
		options.context = { ...options.context, hasRetried: false }
	}
	Error.captureStackTrace(options.context)
	supportLogger.log(`options.context`)
	supportLogger.log(options)

	return next(options)
}

/**
 * This function adds the call point to the error stack trace of got errors.
 * This enables users to see where the error originated from.
 *
 * It also logs the error to the Camunda Support log.
 * This is useful for debugging and support purposes.
 */
export const gotBeforeErrorHook: BeforeErrorHook = (error) => {
	const { request } = error
	let detail = ''
	if (error instanceof GotHTTPError) {
		error = new HTTPError(error.response)
		try {
			const details = JSON.parse(
				(error.response?.body as string) || '{detail:""}'
			)
			;(error as any).statusCode = details.status
			detail = details ?? ''
		} catch (e) {
			;(error as any).statusCode = 0
		}
	}
	;(error as any).source = (error as any).options.context.stack.split('\n')
	error.message += ` (request to ${request?.options.url
		.href}). ${JSON.stringify(detail)}`
	/** Log details of errors to the Camunda Support log */
	try {
		supportLogger.log(
			JSON.stringify(
				{
					code: error.code,
					message: error.message,
					stack: error.stack,
					requestOptions: error.request?.options,
					source: (error as any).source,
				},
				null,
				2
			)
		)
	} catch (e) {
		// If the error is not serializable, we just log the error message
		supportLogger.log(`Error: ${error.message}`)
	}

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
