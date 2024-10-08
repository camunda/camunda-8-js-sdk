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
export const restBeforeErrorHook = (error) => {
	const { request } = error
	let detail = ''
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	// ;(error as any).source = (error as any).options.context.stack.split('\n')
	error.message += ` (request to ${request?.options.url.href}). ${detail}`
	// error.stack = error.message + '\n' + error.source.join('\n')
	return error
}
