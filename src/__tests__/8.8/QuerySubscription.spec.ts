import { ProcessInstanceDetails } from 'c8/lib/C8Dto'

import { CamundaRestClient, QuerySubscription } from '../../'

jest.setTimeout(10000)

test('QuerySubscription retrieves results and emits exactly once for new items in the query result', async () => {
	const queryTag = `query-subscription-test-${Date.now()}`
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
				// variables: [{ name: 'queryTag', value: { $eq: queryTag } }],
			},
			sort: [{ field: 'startDate', order: 'ASC' }],
		})
	const subscription = QuerySubscription({
		query,
		interval: 500,
	})

	let correlations: ProcessInstanceDetails[] = []

	subscription.on('update', (data) => {
		queryResultCount += data.items.length
		correlations = [...correlations, ...data.items]
	})

	const processInstance = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag,
		},
	})
	const processInstance2 = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag,
		},
	})
	const processInstance3 = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag,
		},
	})

	await new Promise((resolve) => setTimeout(resolve, 7000)) // Wait for the subscription to pick up the new process instances
	// tslint:disable-next-line: no-console
	// console.log('Correlations:', JSON.stringify(correlations, null, 2)) // @DEBUG
	expect(queryResultCount).toBe(3)

	// Check if process instances are found in the correlations array by their keys
	expect(
		correlations.some(
			(item) => item.processInstanceKey === processInstance.processInstanceKey
		)
	).toBe(true)
	expect(
		correlations.some(
			(item) => item.processInstanceKey === processInstance2.processInstanceKey
		)
	).toBe(true)
	expect(
		correlations.some(
			(item) => item.processInstanceKey === processInstance3.processInstanceKey
		)
	).toBe(true)
	expect(correlations.length).toBe(3)
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
