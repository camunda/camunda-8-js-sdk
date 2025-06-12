import { CamundaRestClient, QuerySubscription } from '../../'

jest.setTimeout(10000)

test('QuerySubscription retrieves results', async () => {
	let queryResultCount = 0
	const c8 = new CamundaRestClient()

	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/query-subscription-test.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const query = () =>
		c8.searchProcessInstances({
			filter: {
				processDefinitionKey: key,
				state: 'ACTIVE',
			},
			sort: [{ field: 'startDate', order: 'ASC' }],
		})

	const subscription = new QuerySubscription({
		query,
		predicate: (previous, current) => {
			const previousItemState = previous ? previous : { items: [] }
			// remove the previous items from the current items
			const previousItems = previousItemState.items.map(
				(item) => item.processInstanceKey
			)
			const currentItems = current.items.filter(
				(item) => !previousItems.includes(item.processInstanceKey)
			)
			if (currentItems.length > 0) {
				return { ...current, items: currentItems }
			}
			return false // No new items, do not emit
		},
		interval: 500,
	})

	expect(subscription).toBeInstanceOf(QuerySubscription)

	subscription.on('update', (data) => {
		queryResultCount += data.items.length
	})

	const processInstance = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'query-subscription-test',
		},
	})
	const processInstance2 = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'query-subscription-test',
		},
	})
	const processInstance3 = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'query-subscription-test',
		},
	})

	await new Promise((resolve) => setTimeout(resolve, 7000)) // Wait for the subscription to pick up the new process instances
	expect(queryResultCount).toBe(3)
	await c8.cancelProcessInstance({
		processInstanceKey: processInstance.processInstanceKey,
	})
	await c8.cancelProcessInstance({
		processInstanceKey: processInstance2.processInstanceKey,
	})
	await c8.cancelProcessInstance({
		processInstanceKey: processInstance3.processInstanceKey,
	})

	subscription.cancel()
})
