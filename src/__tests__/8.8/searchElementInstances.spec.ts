import { CamundaRestClient, PollingOperation } from '../../'
import { matrix } from '../../test-support/testTags'

vi.setConfig({ testTimeout: 10_000 })

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can search Element Instances', async () => {
	const c8 = new CamundaRestClient()

	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-search-element-instances-test.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const { processInstanceKey } = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'search-element-instances-test',
		},
	})
	const elementInstances = await PollingOperation({
		operation: () =>
			c8.searchElementInstances({
				sort: [{ field: 'processDefinitionKey' }],
				filter: { processInstanceKey },
			}),
		interval: 500,
		timeout: 7000,
	})
	expect(elementInstances).toBeDefined()
	await c8.cancelProcessInstance({
		processInstanceKey,
	})
})
