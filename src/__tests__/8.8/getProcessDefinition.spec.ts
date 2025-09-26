import { expect, test } from 'vitest'

import { PollingOperation } from '../../'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
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
)('It can get the Process Definition', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processDefinition = await PollingOperation({
		operation: () => c8.getProcessDefinition(key),
		predicate: (pd) => pd !== null,
		interval: 500,
		timeout: 5000,
	})

	// Validate all fields of the GetProcessDefinitionResponse DTO
	expect(processDefinition.processDefinitionId).toBe(
		'search-process-instances-test'
	)
	expect(processDefinition.processDefinitionKey).toBe(key)
	expect(processDefinition.name).toBeDefined()
	expect(typeof processDefinition.name).toBe('string')
	expect(processDefinition.resourceName).toBeDefined()
	expect(typeof processDefinition.resourceName).toBe('string')
	expect(processDefinition.version).toBeDefined()
	expect(typeof processDefinition.version).toBe('number')
	expect(processDefinition.tenantId).toBeDefined()

	// versionTag is optional, so check if it exists, then validate its type
	if (processDefinition.versionTag !== undefined) {
		expect(typeof processDefinition.versionTag).toBe('string')
	}
})
