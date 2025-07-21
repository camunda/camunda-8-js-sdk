import EventEmitter from 'node:events'
import { isDeepStrictEqual } from 'node:util'

import Debug from 'debug'
import TypedEmitter from 'typed-emitter'

import { runWithAsyncErrorContext } from './AsyncTrace'

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
 * @description Detects duplicate items in a dataset.
 * Throws an error if exact duplicates are found, meaning the same object instance exists more than once.
 * @param data The data object containing an items array
 * @throws Error if duplicate items are found
 */
function detectDuplicateItems<T extends { items?: unknown[] }>(data: T): void {
	if (!data) return
	const items = data.items
	if (!items || !Array.isArray(items)) return

	// Track items we've seen for exact duplicates
	const seen = new Set()
	const stringifiedItems = new Map<string, unknown>()
	const duplicates: { item: unknown; indices: number[] }[] = []

	items.forEach((item, index) => {
		// Check for exact duplicate object instances (same reference)
		if (seen.has(item)) {
			debug(`Found exact duplicate at index ${index} (same reference)`)
			throw new Error(
				`API response contains exact duplicate items (same reference) at index ${index}: ${JSON.stringify(
					item
				)}`
			)
		}
		seen.add(item)

		// Check for content duplicates (deep equality)
		const stringified = JSON.stringify(item)
		if (stringifiedItems.has(stringified)) {
			const originalItem = stringifiedItems.get(stringified)
			const existingDuplicate = duplicates.find((d) => d.item === originalItem)

			if (existingDuplicate) {
				existingDuplicate.indices.push(index)
			} else {
				duplicates.push({
					item: originalItem,
					indices: [items.findIndex((i) => i === originalItem), index],
				})
			}
		} else {
			stringifiedItems.set(stringified, item)
		}
	})

	// Report content duplicates
	if (duplicates.length > 0) {
		const details = duplicates
			.map(
				(d) =>
					`Item ${JSON.stringify(d.item).substring(
						0,
						100
					)} found at indices ${d.indices.join(', ')}`
			)
			.join('\n')

		debug(`Found ${duplicates.length} duplicate items:\n${details}`)

		throw new Error(
			`API response contains ${duplicates.length} duplicate items:\n${details}`
		)
	}
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
	// Check for duplicates in the API response
	detectDuplicateItems(current)

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
			debug(`[QuerySubscription] Using default predicate`)
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
	 * Check if an item has already been emitted within the tracking window to prevent duplicates
	 */
	private hasEmittedItem(item: unknown): boolean {
		// If tracking window is disabled (set to 0), we don't track items
		if (this._trackingWindow <= 0) return false

		const itemStr = JSON.stringify(item)

		// Check in all recent poll cycles
		for (let i = 0; i < this._trackingWindow; i++) {
			// Calculate cycle index with a safe modulo operation
			const cycleOffset =
				(this._currentPollCycle - i + this._trackingWindow) %
				this._trackingWindow
			const itemSet = this._recentEmittedItems.get(cycleOffset)
			if (itemSet && itemSet.has(itemStr)) {
				debug(
					`Item already emitted within last ${
						i + 1
					} poll cycles: ${itemStr.substring(0, 100)}...`
				)
				return true
			}
		}

		return false
	}

	/**
	 * Mark an item as emitted to prevent duplicates within the tracking window
	 */
	private markItemAsEmitted(item: unknown): void {
		// If tracking window is disabled, do nothing
		if (this._trackingWindow <= 0) return

		const itemStr = JSON.stringify(item)
		debug(
			`Marking item as emitted in cycle ${
				this._currentPollCycle
			}: ${itemStr.substring(0, 100)}...`
		)

		// Get or create the Set for the current poll cycle
		let currentSet = this._recentEmittedItems.get(this._currentPollCycle)
		if (!currentSet) {
			currentSet = new Set<string>()
			this._recentEmittedItems.set(this._currentPollCycle, currentSet)
		}

		currentSet.add(itemStr)
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

		// Prevent concurrent polls by setting both locks immediately
		this._pollLock = true
		this._predicateLock = true

		// Advance the poll cycle and clean up old data if tracking is enabled
		if (this._trackingWindow > 0) {
			// Increment the poll cycle
			this._currentPollCycle =
				(this._currentPollCycle + 1) % this._trackingWindow
			// Remove old data from the next cycle slot that we'll use in the future
			this._recentEmittedItems.delete(this._currentPollCycle)

			debug(`Advanced to poll cycle ${this._currentPollCycle}`)
		}

		debug(`Poll starting, locks acquired`)

		try {
			// Get the current data
			debug(`[QuerySubscription] Querying data...`)
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

					this._pollLock = false
					this._predicateLock = false
					return
				}

				debug(`State has changed since previous poll`)
			} else {
				debug(`First poll, no previous state`)
			}

			// Run the predicate with our safely stored previous state
			debug(`[QuerySubscription] Running predicate function`)
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
					debug(`Safely emitting full current state with duplicate prevention`)
					const itemsCount =
						current && typeof current === 'object' && 'items' in current
							? (current as Record<string, unknown[]>).items.length
							: 'N/A'
					debug(`Attempting to emit ${itemsCount} items`)

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
			this._predicateLock = false
			this._pollLock = false
		}
	}
}
