import EventEmitter from 'node:events'
import { isDeepStrictEqual } from 'node:util'

import TypedEmitter from 'typed-emitter'

import { runWithAsyncErrorContext } from './AsyncTrace'

export function QuerySubscription<T>(
	options: QuerySubscriptionConstructorWithPredicate<T>
): _QuerySubscription<T>
export function QuerySubscription<T>(
	options: QuerySubscriptionConstructorsWithoutPredicate<
		T & { items: Array<unknown> }
	>
): _QuerySubscription<T>
export function QuerySubscription<T>(
	options:
		| QuerySubscriptionConstructorWithPredicate<T>
		| QuerySubscriptionConstructorsWithoutPredicate<
				T & { items: Array<unknown> }
		  >
): _QuerySubscription<T> {
	return new _QuerySubscription<T>(options)
}

type QuerySubscriptionReturnValue<T> =
	| void
	| null
	| undefined
	| T
	| true
	| false
type QuerySubscriptionPredicate<T> = (
	previous: T | undefined,
	current: T
) => QuerySubscriptionReturnValue<T> | Promise<QuerySubscriptionReturnValue<T>>

type QuerySubscriptionEvents<T> = {
	update: (update: T) => void
}

/**
 * @description The default predicate function for QuerySubscription.
 * It checks if the current query result has new items compared to the previous state.
 * If there are new items, it returns the current state with only the new items and updates the totalItems count.
 * If there are no new items, it returns false, indicating that no update should be emitted.
 * @param previous the previous state of the query result
 * @param current the current state of the query result
 * @returns - If there are new items, returns the current state with only the new items and updated totalItems count.
 * - If there are no new items, returns false, indicating that no update should be emitted.
 */
function defaultPredicate<
	T extends { items: Array<unknown>; page: { totalItems: number } },
>(previous: T | undefined, current: T): QuerySubscriptionReturnValue<T> {
	const previousItems = (previous?.items ?? []) as Array<unknown>
	const currentItems = current.items.filter(
		(item) =>
			!previousItems.some((prevItem) => isDeepStrictEqual(prevItem, item))
	)
	if (currentItems.length > 0) {
		return {
			...current,
			items: currentItems,
			page: { ...current.page, totalItems: currentItems.length },
		}
	}
	return false // No new items, do not emit
}

interface QuerySubscriptionConstructorBase<T> {
	query: () => Promise<T>
	interval?: number
}

interface QuerySubscriptionConstructorWithPredicate<T>
	extends QuerySubscriptionConstructorBase<T> {
	predicate: QuerySubscriptionPredicate<T>
}

interface QuerySubscriptionConstructorsWithoutPredicate<
	T extends { items: Array<unknown> },
> extends QuerySubscriptionConstructorBase<T> {
	/** predicate to check if the result is valid - optional when T has items array */
	predicate?: QuerySubscriptionPredicate<T>
}

/**
 * @description QuerySubscription is a utility class that allows you to subscribe to a query and receive updates when the query result changes.
 * It is useful for polling operations where you want to receive updates when the result of a query changes, such as when a process instance is created or updated.
 * It uses a predicate function to determine whether to emit an update event. When using the Orchestration Cluster API, the default predicate checks if the result has new items compared to the previous state.
 * The predicate function receives the previous state and the current state of the query result and should return a value that indicates whether to emit an update.
 * If the predicate returns `true`, the current state is emitted. If it returns an object, that object is emitted as the update.
 * If it returns `false`, no update is emitted.
 * @experimental This is an experimental feature and may change in the future.
 * It is not yet stable and may have breaking changes in future releases. We're still working on it, and we welcome feedback.
 * Please use it with caution and be prepared for potential changes.
 * @example
 * ```ts
 * const query = () =>
 *   c8.searchProcessInstances({
 *     filter: {
 *     processDefinitionKey: key,
 *     state: 'ACTIVE',
 *   },
 *   sort: [{ field: 'startDate', order: 'ASC' }],
 * })
 *
 * const subscription = QuerySubscription({
 *   query,
 *   predicate: (previous, current) => { // This is the default predicate, shown here for clarity
 *     const previousItems = (previous?.items ?? []) as Array<unknown>
 *     const currentItems = current.items.filter(
 *       (item) =>
 *         !previousItems.some((prevItem) => isDeepStrictEqual(prevItem, item))
 *     )
 *     if (currentItems.length > 0) {
 *       return {
 *         ...current,
 *         items: currentItems,
 *         page: { ...current.page, totalItems: currentItems.length },
 *       }
 *     }
 *     return false // No new items, do not emit
 *   },
 *   interval: 500,
 * })
 * subscription.on('update', (data) => {
 *   console.log('Received new processes:', data.items)
 * })
 * // After some time
 * subscription.stop() // Stop polling when no longer needed, you can also call `start()` to resume polling
 * subscription.cancel() // Or cancel the subscription to free resources
 * ```
 * @see {@link PollingOperation} for a simpler polling operation that does a single query.
 */
class _QuerySubscription<T> {
	private _query: () => Promise<T>
	/** The current state of the query, used to compare with the next result */
	private _state: T | undefined = undefined
	private _predicate: QuerySubscriptionPredicate<T>
	private _pollHandle: NodeJS.Timeout | null = null
	/** We prevent further polling while we are calculating the predicate */
	private _predicateLock: boolean = false
	/** We prevent further polling while we are processing the current poll */
	private _pollLock: boolean = false
	private _interval: number
	private emitter: TypedEmitter<QuerySubscriptionEvents<T>>
	on: <E extends 'update'>(
		event: E,
		listener: QuerySubscriptionEvents<T>[E]
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	off: <E extends 'update'>(
		event: E,
		listener: QuerySubscriptionEvents<T>[E]
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	once: <E extends 'update'>(
		event: E,
		listener: QuerySubscriptionEvents<T>[E]
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	private emit: <E extends 'update'>(
		event: E,
		...args: Parameters<QuerySubscriptionEvents<T>[E]>
	) => boolean
	removeListener: <E extends 'update'>(
		event: E,
		listener: QuerySubscriptionEvents<T>[E]
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	removeAllListeners: <E extends 'update'>(
		event?: E | undefined
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	prependListener: <E extends 'update'>(
		event: E,
		listener: QuerySubscriptionEvents<T>[E]
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	prependOnceListener: <E extends 'update'>(
		event: E,
		listener: QuerySubscriptionEvents<T>[E]
	) => TypedEmitter<QuerySubscriptionEvents<T>>
	listeners: <E extends 'update'>(event: E) => QuerySubscriptionEvents<T>[E][]
	private _poll?: Promise<T>

	constructor(
		options:
			| QuerySubscriptionConstructorWithPredicate<T>
			| QuerySubscriptionConstructorsWithoutPredicate<
					T & { items: Array<unknown> }
			  >
	) {
		this._query = options.query

		if ('predicate' in options && options.predicate) {
			this._predicate = options.predicate as QuerySubscriptionPredicate<T>
		} else {
			// Use type assertion to handle the default predicate
			this._predicate = defaultPredicate as QuerySubscriptionPredicate<T>
		}

		this._interval = options.interval || 1000
		this.resume()
		this.emitter = new EventEmitter() as TypedEmitter<
			QuerySubscriptionEvents<T>
		>

		// Delegate all EventEmitter methods to the internal emitter
		this.on = this.emitter.on.bind(this.emitter)
		this.off = this.emitter.off.bind(this.emitter)
		this.once = this.emitter.once.bind(this.emitter)
		this.emit = this.emitter.emit.bind(this.emitter)
		this.removeListener = this.emitter.removeListener.bind(this.emitter)
		this.removeAllListeners = this.emitter.removeAllListeners.bind(this.emitter)
		this.prependListener = this.emitter.prependListener.bind(this.emitter)
		this.prependOnceListener = this.emitter.prependOnceListener.bind(
			this.emitter
		)
		this.listeners = this.emitter.listeners.bind(this.emitter)
	}

	pause() {
		if (!this._pollHandle) {
			return
		}
		clearInterval(this._pollHandle)
		this._pollHandle = null
		this._pollLock = false
	}

	cancel() {
		this.pause()
		this._state = undefined
		this._poll = undefined
		this._predicateLock = false
		this._pollLock = false
		this.removeAllListeners()
	}

	resume() {
		if (this._pollHandle) {
			return
		}
		this._pollHandle = setInterval(
			() => runWithAsyncErrorContext(this.poll.bind(this), 'QuerySubscription'),
			this._interval
		)
	}

	async poll() {
		if (
			this._pollLock ||
			this._predicateLock ||
			this.listeners('update').length === 0
		) {
			return
		}

		this._pollLock = true
		try {
			this._poll = this._query()
			const current = await this._poll

			if (this._state) {
				// If we have a previous state, check if it is the same as the current one
				if (isDeepStrictEqual(this._state, current)) {
					// If the state is the same, we don't need to emit an update
					this._pollLock = false
					return
				}
			}

			this._predicateLock = true
			const diff = await this._predicate(this._state, current)
			this._state = current
			if (diff) {
				if (diff === true) {
					this.emit('update', current)
				} else {
					this.emit('update', diff)
				}
			}
		} catch (error: unknown) {
			;(error as Error).message = `QuerySubscription: ${
				(error as Error).message
			}`
			throw error
		} finally {
			this._predicateLock = false
			this._pollLock = false
		}
	}
}
