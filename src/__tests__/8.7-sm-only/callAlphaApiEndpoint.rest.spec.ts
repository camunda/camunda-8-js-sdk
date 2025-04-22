import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const restClient = new CamundaRestClient()

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
	expect(res).toBeTruthy()
})
