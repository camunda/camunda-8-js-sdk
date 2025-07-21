import EventEmitter from 'node:events'
import { isDeepStrictEqual } from 'node:util'

import Debug from 'debug'
import TypedEmitter from 'typed-emitter'

import { runWithAsyncErrorContext } from './AsyncTrace'

/**
 * Generates a hash code from a string using the djb2 algorithm.
 * This is faster than JSON.stringify for comparison purposes.
 * @param str String to hash
 * @returns A number hash of the string
 */
function hashString(str: string): string {
	let hash = 5381
	for (let i = 0; i < str.length; i++) {
		hash = (hash << 5) + hash + str.charCodeAt(i) /* hash * 33 + c */
	}
	return hash.toString(36)
}

/**
 * Creates a hash of an object by first converting to JSON string and then hashing
 * @param obj Object to hash
 * @returns A string hash representing the object
 */
function hashObject(obj: unknown): string {
	return hashString(JSON.stringify(obj))
}

const debug = Debug('camunda:querySubscription')

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
	T extends { items?: Array<unknown>; page?: { totalItems: number } },
>(previous: T | undefined, current: T): QuerySubscriptionReturnValue<T> {
	// Handle missing items arrays gracefully
	if (!current || !current.items) return false

	const previousItems = (previous?.items ?? []) as Array<unknown>
	const currentItems = current.items.filter(
		(item) =>
			!previousItems.some((prevItem) => isDeepStrictEqual(prevItem, item))
	)
	if (currentItems.length > 0) {
		const result = {
			...current,
			items: currentItems,
		}

		// Update page totalItems if it exists
		if (current.page) {
			result.page = { ...current.page, totalItems: currentItems.length }
		}

		return result
	}
	return false // No new items, do not emit
}

interface QuerySubscriptionConstructorBase<T> {
	query: () => Promise<T>
	interval?: number
	/**
	 * Number of poll cycles to track emitted items for duplicate prevention. See: https://github.com/camunda/camunda-8-js-sdk/issues/540
	 * Set to 0 to disable tracking (not recommended).
	 * Default: 5
	 */
	trackingWindow?: number
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
	/** Track items we've emitted to prevent duplicates within a limited window of poll cycles */
	private _recentEmittedItems: Map<number, Set<string>> = new Map()
	/** Current poll cycle number, used for the rolling window of tracked items */
	private _currentPollCycle = 0
	/** Number of poll cycles to track emitted items for duplicate prevention */
	private _trackingWindow: number
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
		this._trackingWindow =
			options.trackingWindow !== undefined ? options.trackingWindow : 5

		debug(
			`Created with interval ${
				options.interval || 1000
			}ms and tracking window ${this._trackingWindow} cycles`
		)

		if ('predicate' in options && options.predicate) {
			this._predicate = options.predicate as QuerySubscriptionPredicate<T>
			debug(`Using custom predicate`)
		} else {
			// Use type assertion to handle the default predicate
			this._predicate = defaultPredicate as QuerySubscriptionPredicate<T>
			debug(`Using default predicate`)
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
		this._currentPollCycle = 0
		this._recentEmittedItems.clear()
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

	/**
	 * Gets the hash for an item, used for tracking across poll cycles
	 * @param item The item to hash
	 * @returns The hash string for the item
	 */
	private getItemHash(item: unknown): string {
		return hashObject(item)
	}

	/**
	 * Gets the item set for a specific poll cycle
	 * @param cycleOffset The offset from the current poll cycle
	 * @returns The set of item hashes for that cycle, or undefined if none exist
	 */
	private getCycleItemSet(cycleOffset: number): Set<string> | undefined {
		// If tracking window is disabled, return undefined
		if (this._trackingWindow <= 0) return undefined

		// Calculate the actual cycle index with a safe modulo operation
		const normalizedOffset =
			(this._currentPollCycle - cycleOffset + this._trackingWindow) %
			this._trackingWindow

		return this._recentEmittedItems.get(normalizedOffset)
	}

	/**
	 * Check if an item has already been emitted within the tracking window to prevent duplicates
	 */
	private hasEmittedItem(item: unknown): boolean {
		// If tracking window is disabled (set to 0), we don't track items
		if (this._trackingWindow <= 0) return false

		// Generate a hash of the item
		const itemHash = this.getItemHash(item)

		// Check in all recent poll cycles
		for (let i = 0; i < this._trackingWindow; i++) {
			const itemSet = this.getCycleItemSet(i)
			if (itemSet && itemSet.has(itemHash)) {
				if (debug.enabled) {
					// Check if debug is enabled before logging - this impacts performance
					// For debugging, we'll still include a short preview of the item
					const itemPreview = JSON.stringify(item).substring(0, 50) + '...'
					debug(
						`Item already emitted within last ${
							i + 1
						} poll cycles: ${itemPreview}`
					)
				}
				return true
			}
		}

		return false
	}

	/**
	 * Gets or creates an item set for the current poll cycle
	 * @returns The set of item hashes for the current cycle
	 */
	private getCurrentCycleItemSet(): Set<string> {
		let currentSet = this._recentEmittedItems.get(this._currentPollCycle)
		if (!currentSet) {
			currentSet = new Set<string>()
			this._recentEmittedItems.set(this._currentPollCycle, currentSet)
		}
		return currentSet
	}

	/**
	 * Advances the poll cycle and cleans up old data
	 */
	private advancePollCycle(): void {
		// If tracking window is disabled, do nothing
		if (this._trackingWindow <= 0) return

		// Increment the poll cycle
		this._currentPollCycle = (this._currentPollCycle + 1) % this._trackingWindow

		// Remove old data from the next cycle slot that we'll use in the future
		this._recentEmittedItems.delete(this._currentPollCycle)

		debug(`Advanced to poll cycle ${this._currentPollCycle}`)
	}

	/**
	 * Mark an item as emitted to prevent duplicates within the tracking window
	 */
	private markItemAsEmitted(item: unknown): void {
		// If tracking window is disabled, do nothing
		if (this._trackingWindow <= 0) return

		// Generate a hash of the item
		const itemHash = this.getItemHash(item)

		// For debugging, we'll still include a short preview of the item
		if (debug.enabled) {
			const itemPreview = JSON.stringify(item).substring(0, 50) + '...'
			debug(
				`Marking item as emitted in cycle ${this._currentPollCycle}: ${itemPreview}`
			)
		}

		// Get or create the Set for the current poll cycle and add the item
		const currentSet = this.getCurrentCycleItemSet()
		currentSet.add(itemHash)
	}

	/**
	 * Safely emit items, preventing duplicates
	 */
	private safeEmit(data: T): void {
		// Handle items array if present
		if (data && typeof data === 'object' && 'items' in data) {
			const dataWithItems = data as unknown as { items: unknown[] }

			// Check if we already emitted any of these items
			const newItems = dataWithItems.items.filter(
				(item) => !this.hasEmittedItem(item)
			)

			if (newItems.length === 0) {
				debug(`All items have already been emitted, skipping update`)
				return
			}

			if (newItems.length !== dataWithItems.items.length) {
				debug(
					`Filtered out ${
						dataWithItems.items.length - newItems.length
					} duplicate items`
				)

				// Create a new object with only the new items
				const filteredData = {
					...data,
					items: newItems,
				}

				if ('page' in filteredData && typeof filteredData.page === 'object') {
					filteredData.page = {
						...filteredData.page,
						totalItems: newItems.length,
					}
				}

				// Mark all items as emitted
				newItems.forEach((item) => this.markItemAsEmitted(item))

				// Emit the filtered data
				this.emit('update', filteredData as T)
				return
			}

			// Mark all items as emitted
			dataWithItems.items.forEach((item) => this.markItemAsEmitted(item))
		}

		// Emit the data
		this.emit('update', data)
	}

	async poll() {
		// Skip polling if locks are already set or if there are no listeners
		if (
			this._pollLock ||
			this._predicateLock ||
			this.listeners('update').length === 0
		) {
			debug(
				`Poll skipped: locks=${this._pollLock},${
					this._predicateLock
				}, listeners=${this.listeners('update').length}`
			)

			return
		}

		// Acquire locks before any async operation
		this._pollLock = true
		this._predicateLock = true

		try {
			// Advance the poll cycle and clean up old data if tracking is enabled
			this.advancePollCycle()

			debug(`Poll starting, locks acquired`)
			this._poll = this._query()
			const current = await this._poll

			debug(
				`Query returned data with ${
					current && typeof current === 'object' && 'items' in current
						? (current as Record<string, unknown[]>).items.length
						: 'unknown'
				} items`
			)

			// Save a local copy of the state to ensure consistency during this poll cycle
			const previousState = this._state

			debug(
				`Previous state: ${
					previousState
						? typeof previousState === 'object' && 'items' in previousState
							? `has ${
									(previousState as Record<string, unknown[]>).items.length
								} items`
							: 'exists but has no items array'
						: 'undefined'
				}`
			)

			if (previousState) {
				// If we have a previous state, check if it is the same as the current one
				if (isDeepStrictEqual(previousState, current)) {
					// If the state is the same, we don't need to emit an update
					debug(`Current state is identical to previous state, not emitting`)
					return
				}

				debug(`State has changed since previous poll`)
			} else {
				debug(`First poll, no previous state`)
			}

			// Run the predicate with our safely stored previous state
			debug(`Running predicate function`)
			const diff = await this._predicate(previousState, current)

			debug(
				`Predicate returned: ${
					diff
						? diff === true
							? 'true'
							: 'custom result object'
						: 'false/null/undefined'
				}`
			)

			// Update state FIRST, before any potential emissions
			// This ensures race conditions don't cause duplicate emissions
			this._state = current

			debug(`Updated state BEFORE emission processing`)

			if (diff) {
				// Emit the appropriate update using our safe emit method
				if (diff === true) {
					if (debug.enabled) {
						// Check if debug is enabled before logging - this impacts performance
						debug(
							`Safely emitting full current state with duplicate prevention`
						)
						const itemsCount =
							current && typeof current === 'object' && 'items' in current
								? (current as Record<string, unknown[]>).items.length
								: 'N/A'
						debug(`Attempting to emit ${itemsCount} items`)
					}

					this.safeEmit(current)
				} else {
					debug(
						`Safely emitting custom result from predicate with duplicate prevention`
					)
					const itemsCount =
						diff && typeof diff === 'object' && 'items' in diff
							? (diff as { items: unknown[] }).items.length
							: 'N/A'
					debug(`Attempting to emit ${itemsCount} items`)

					this.safeEmit(diff)
				}
			} else {
				debug(`No emission needed based on predicate result`)
			}
		} catch (error: unknown) {
			;(error as Error).message = `QuerySubscription: ${
				(error as Error).message
			}`
			throw error
		} finally {
			// Centralized lock release - ensures locks are always released regardless of execution path
			this._predicateLock = false
			this._pollLock = false
			debug(`Poll completed, locks released`)
		}
	}
}
