/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	BeforeErrorHook,
	HTTPError as GotHTTPError,
	HandlerFunction,
	Method,
} from 'got'

import { CamundaSupportLogger } from './CamundaSupportLogger'
import { CamundaPlatform8Configuration } from './Configuration'
import { HTTPError } from './GotErrors'

const supportLogger = CamundaSupportLogger.getInstance()

/**
 *
 * This function stores the call point from the application of got requests.
 * This enables users to see where the error originated from.
 */
export const beforeCallHook: HandlerFunction = (options, next) => {
	if (Object.isFrozen(options.context)) {
		options.context = { ...options.context, hasRetried: false }
	}
	Error.captureStackTrace(options.context)
	supportLogger.log(`Rest call:`)
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
export const gotBeforeErrorHook =
	(config: CamundaPlatform8Configuration): BeforeErrorHook =>
	(error) => {
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

		/** Hinting for error messages. See https://github.com/camunda/camunda-8-js-sdk/issues/456 */
		/** Here we reason over the error and the configuration to enrich the message with hints */
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

export const GotRetryConfig = {
	limit: 1,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] as Method[],
	statusCodes: [401],
}
