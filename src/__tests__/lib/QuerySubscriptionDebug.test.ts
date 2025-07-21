import Debug from 'debug'

import { QuerySubscription } from '../../lib/QuerySubscription'

const debug = Debug('camunda:querySubscriptionDebugTest')

describe('QuerySubscription Debug Test', () => {
	it('should not emit the same item twice', async () => {
		// Setup test data
		const items = [
			{ id: '1', name: 'item1' },
			{ id: '2', name: 'item2' },
			{ id: '3', name: 'item3' },
		]

		// This mock will first return initial data, then add a new item
		const mockQuery = jest
			.fn()
			.mockResolvedValueOnce({
				items: [items[0], items[1]],
				page: { totalItems: 2, startCursor: '', endCursor: '' },
			})
			.mockResolvedValueOnce({
				items: [items[0], items[1], items[2]],
				page: { totalItems: 3, startCursor: '', endCursor: '' },
			})

		// Create subscription
		const subscription = QuerySubscription({
			query: mockQuery,
			interval: 10, // Short interval to quickly test multiple polls
		})

		// Track emitted items to check for duplicates
		const emittedItems: unknown[] = []
		const capturedResponses: unknown[] = []

		subscription.on('update', (response) => {
			debug('RECEIVED UPDATE:', response)
			capturedResponses.push(response)

			// Add items to our tracking array
			if (response && typeof response === 'object' && 'items' in response) {
				const items = (response as { items: unknown[] }).items
				emittedItems.push(...items)

				// Log all emitted items for debugging
				debug('EMITTED ITEMS NOW:', JSON.stringify(emittedItems))
			}
		})

		// Wait for multiple poll cycles
		await new Promise((resolve) => setTimeout(resolve, 50))

		// Cancel subscription to prevent further polling
		subscription.cancel()

		// Check if any item was emitted more than once
		// First, map the items to a string representation for comparison
		const stringifiedItems = emittedItems.map((item) => JSON.stringify(item))
		const uniqueItems = new Set(stringifiedItems)

		// If there are duplicates, the sets will have different sizes
		expect(uniqueItems.size).toEqual(stringifiedItems.length)
		debug('FINAL EMITTED:', JSON.stringify(emittedItems))
		debug('RESPONSES:', capturedResponses.length)

		// We should have exactly 3 items emitted (without duplicates)
		expect(emittedItems.length).toBe(3)
	})
})
