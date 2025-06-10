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

/**
 * Poll for a result of an operation until it returns a valid result or times out.
 * This is useful for operations that may take some time to complete, such as waiting for a process instance to finish.
 * @param options options for the polling operation
 * @returns either the result of the operation or an error if the operation times out
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
					throw new Error('No items found in the result')
				}
				resolve(result)
			} catch (error) {
				if (Date.now() - startTime < timeout) {
					setTimeout(poll, interval)
				} else {
					reject(new Error('Polling operation timed out'))
				}
			}
		}

		poll()
	})
}
