import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

const restClient = new CamundaRestClient()

beforeAll(async () => {
	await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `test-drd.dmn`),
	])
})
test('it can call an endpoint', async () => {
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
