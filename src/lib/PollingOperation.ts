function defaultPredicate<T extends { items: Array<unknown> }>(
	result: T
): boolean {
	return (
		result !== null &&
		result !== undefined &&
		result.items &&
		result.items.length > 0
	)
}

interface PollingOperationOptions<T> {
	operation: () => Promise<T>
	/** predicate to check if the result is valid */
	predicate?: (result: T) => boolean
	/** how often to poll in ms - defaults to 1000 */
	interval?: number
	/** when to timeout - defaults to 30000 */
	timeout?: number
}

class PredicateError<T> extends Error {
	result: T | null
	constructor(message: string) {
		super(message)
		this.name = 'PredicateError'
		// Ensure the prototype chain is correctly set up
		Object.setPrototypeOf(this, PredicateError.prototype)
		this.result = null
	}
}
/**
 * Poll for a result of an operation until it returns an awaited result or times out.
 * This is useful for operations that may take some time to complete, such as waiting for a process instance to finish or data to propagate to query indices.
 * Takes an optional prediicate function to determine if the result is the awaited one. By default, it checks if the result is not null or undefined and has at least one item in the `items` array.
 * @param options options for the polling operation
 * @returns either the result of the operation or an error if the operation times out. If results were returned, but the predicate was not met, a PredicateError is thrown.
 * Otherwise, the failure is propagated as an error.
 */
export function PollingOperation<T extends { items: Array<unknown> }>(
	options: PollingOperationOptions<T>
): Promise<T> {
	const interval = options.interval || 1000
	const timeout = options.timeout || 30000
	const operation = options.operation
	const predicate = options.predicate || defaultPredicate
	return new Promise((resolve, reject) => {
		const startTime = Date.now()

		const poll = async () => {
			try {
				const result = await operation()
				if (!predicate(result)) {
					const error = new PredicateError<T>('Predicate did not match')
					error.result = result
					throw error
				}
				resolve(result)
			} catch (error) {
				if (Date.now() - startTime < timeout) {
					setTimeout(poll, interval)
				} else {
					reject(error)
				}
			}
		}

		poll()
	})
}
