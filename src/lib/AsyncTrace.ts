import { AsyncLocalStorage } from 'async_hooks'

/**
 * Capturing useful async stack traces is challenging with got.
 * See here: https://github.com/sindresorhus/got/blob/main/documentation/async-stack-traces.md
 * This function stores the call point from the application of got requests.
 * This enables users to see where the error originated from.
 * It uses the AsyncLocalStorage to store the creation stack trace.
 * The stack trace is captured from the point where this function is called, allowing you to see where the async operation was initiated.
 * See QuerySubscription.spec.ts for an example of how to use this function.
 * @param fn The function to run within the async context. It can return a value or a Promise.
 * @param errorTag A meaningful tag to identify the error context, which will be included in the stack trace.
 * @returns
 */
export function runWithAsyncErrorContext<T>(
	fn: () => T | Promise<T>,
	errorTag: string
): T | Promise<T> {
	return asyncOperationContext.run(getAsyncStackTrace(errorTag), fn)
}

/**
 * This is the exported AsyncLocalStorage instance that holds the context for async operations.
 * It is used in the GotHooks.ts to extract the stack trace of the async operation.
 */
export const asyncOperationContext = new AsyncLocalStorage<{
	creationStack: string
}>()

function removeLeadingNewLines(str: string, errorTag: string): string {
	const parts = str.split('\n')
	return [`${errorTag}:`, ...parts.slice(2)].join('\n')
}

function getAsyncStackTrace(errorTag: string) {
	const creationStack =
		new Error(errorTag).stack?.replace(/^.*?\n/, '') || 'No stack available'
	return { creationStack: removeLeadingNewLines(creationStack, errorTag) }
}
