import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { matrix } from '../../../test-support/testTags'

const restClient = new CamundaRestClient()

beforeAll(async () => {
	await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `test-drd.dmn`),
	])
})
test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('it can call an endpoint', async () => {
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
