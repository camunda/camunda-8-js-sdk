import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

let processDefinitionId: string
const restClient = new CamundaRestClient()

test('It can deploy with a specific tenantId', async () => {
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
