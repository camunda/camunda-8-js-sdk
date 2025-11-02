import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../index'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can search Process Definitions', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processDefinitions = await PollingOperation({
		operation: () =>
			c8.searchProcessDefinitions({
				sort: [{ field: 'processDefinitionKey' }],
				filter: { processDefinitionKey: key },
			}),
		predicate: (def) => def.items.length > 0,
		timeout: 10_000,
		interval: 500,
	})
	expect(processDefinitions.items[0].processDefinitionId).toBe(
		'search-process-instances-test'
	)
})
