import path from 'node:path'

import { test } from 'vitest'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { matrix } from '../../../test-support/testTags'

let processDefinitionId: string
const restClient = new CamundaRestClient()

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant'],
			security: ['secured'],
		},
	})
)('It can deploy with a specific tenantId', async () => {
	const res = await restClient.deployResourcesFromFiles(
		[
			path.join(
				'.',
				'src',
				'__tests__',
				'testdata',
				'hello-world-complete-rest.bpmn'
			),
		],
		{ tenantId: 'green' }
	)
	processDefinitionId = res.processes[0].processDefinitionId
	expect(processDefinitionId).toBeTruthy()
})
