import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

const restClient = new CamundaRestClient()

beforeAll(async () => {
	await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `test-drd.dmn`),
	])
})
test('it can call 8.7 alpha search endpoint', async () => {
	const res = await restClient.callApiEndpoint({
		urlPath: 'process-instances/search',
		method: 'POST',
		body: {
			filter: {
				completed: true,
			},
			sort: [
				{
					field: 'bpmnProcessId',
					order: 'desc',
				},
				{
					field: 'processDefinitionKey',
					order: 'asc',
				},
			],
		},
	})
	console.log(res)
	expect(res).toBeTruthy()

	const res2 = await restClient.callApiEndpoint({
		urlPath: 'decision-definitions/evaluation',
		method: 'POST',
		body: {
			decisionDefinitionId: 'test-decision',
			variables: {
				name: 'camunda',
			},
		},
	})
	expect(res2).toBeTruthy()
})
