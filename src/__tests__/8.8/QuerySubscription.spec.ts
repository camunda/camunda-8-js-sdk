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
	const subscription = QuerySubscription({
		query,
		interval: 500,
	})

	const correlations: string[] = []

	subscription.on('update', (data) => {
		queryResultCount += data.items.length
		correlations.push(...data.items.map((item) => item.processInstanceKey))
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
	expect(correlations.includes(processInstance.processInstanceKey)).toBe(true)
	expect(correlations.includes(processInstance2.processInstanceKey)).toBe(true)
	expect(correlations.includes(processInstance3.processInstanceKey)).toBe(true)
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
