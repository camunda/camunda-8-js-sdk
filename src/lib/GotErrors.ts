import * as Got from 'got'
import { BeforeErrorHook, HTTPError as GotHTTPError, RequestError } from 'got'

import { CamundaRestError } from '../c8/lib/C8Dto'

import { CamundaPlatform8Configuration } from './Configuration'
import { supportLogger } from './GotHooks'

const Defaults: CamundaRestError = {
	status: 0,
	title: '',
	detail: '',
	instance: '',
	type: 'about:blank' as const,
}
export class HTTPError extends Got.HTTPError implements CamundaRestError {
	statusCode: number
	title: string
	detail: string
	instance: string
	type = 'about:blank' as const
	status: number
	originalMessage: string
	method: string | undefined
	url: string | undefined
	constructor({
		response,
		method,
		url,
		message,
	}: {
		response: Got.Response<unknown>
		method?: string
		url?: string
		message: string
	}) {
		super(response)
		this.method = method
		this.url = url
		this.originalMessage = message
		let details = Defaults
		try {
			details = JSON.parse((response?.body as string) || '{}')
		} catch {
			// ignore JSON parse errors
		}
		this.statusCode = details.status
		this.title = details.title
		this.detail = details.detail
		this.instance = details.instance
		this.status = details.status
		// Sometimes APIs return errors data in plain text (not JSON)
		// and sometimes we get back an HTML error page (for example: 502 Bad Gateway)
		// We want to extract and surface plain text errors
		// and ignore the HTML strings
		if (!((response.body as string) ?? '<').startsWith('<')) {
			this.message += ` - ${response.body}`
		}
	}
}

export type RestError =
	| HTTPError
	| Got.RequestError
	| Got.ReadError
	| Got.ParseError
	| Got.TimeoutError
	| Got.CancelError
	| Got.CacheError
	| Got.MaxRedirectsError
	| Got.UnsupportedProtocolError /**
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
		const method = request?.options.method
		const url = request?.options.url.href
		let detail = ''
		if (error instanceof GotHTTPError) {
			error = new HTTPError({
				response: error.response,
				method,
				url,
				message: error.message,
			})
			try {
				const details = JSON.parse(
					(error.response?.body as string) || '{detail:""}'
				)
				error.statusCode = details.status
				detail = details ?? ''
			} catch {
				error.statusCode = 0
			}
		}

		const enhancedStack = error.options.context.stack?.split('\n')
		error.source = enhancedStack ?? ['No enhanced stack trace available']
		error.message += ` (${method} ${url}). ${JSON.stringify(detail)}`
		if (enhancedStack) {
			error.message += `. Enhanced stack trace available as error.source.`
		}

		// Replace the runtime stack with our synthesized origin stack (filtered, user-facing)
		// while preserving the original Node stack in error.originalStack for diagnostics.
		interface StructuredTraceContext {
			__stackTrace?: {
				stacks: { location: string }[]
				requestId: string
				capturedAt: number
				apiMethod?: string
			}
		}
		const structured = (
			error.options.context as unknown as StructuredTraceContext
		).__stackTrace
		if (structured?.stacks?.length) {
			;(error as RequestError & { originalStack?: string }).originalStack =
				error.stack
			const synthesized = [
				`${error.name}: ${error.message}`,
				...structured.stacks.map((s) => s.location),
				`RequestId: ${structured.requestId}`,
				structured.apiMethod ? `ApiMethod: ${structured.apiMethod}` : undefined,
			]
				.filter(Boolean)
				.join('\n')
			error.stack = synthesized
		}

		/** Hinting for error messages. See https://github.com/camunda/camunda-8-js-sdk/issues/456 */
		/** Here we reason over the error and the configuration to enrich the message with hints */
		if (error.message.includes('Invalid header token')) {
			// This is a parse error, which means the response header was not valid JSON.
			// Debugging for https://github.com/camunda/camunda-8-js-sdk/issues/491
			error.message += ` (response headers: ${JSON.stringify(
				error.response?.headers
			)})`
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
			stack: error.stack, // replaced stack
			originalStack: (error as RequestError & { originalStack?: string })
				.originalStack,
			requestOptions: error.request?.options,
			source: error.source,
		})
		return error
	}
