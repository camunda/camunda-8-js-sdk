import { expect, test, vi } from 'vitest'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()

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
)('It can get an Element Instance', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-search-element-instances-test.bpmn',
	])
	const { processDefinitionKey } = res.processes[0]
	const processInstance = await c8.createProcessInstance({
		processDefinitionKey,
		variables: {
			queryTag: 'search-element-instances-test',
		},
	})
	const elementInstances = await PollingOperation({
		operation: () =>
			c8.searchElementInstances({
				sort: [{ field: 'processDefinitionKey' }],
				filter: { processInstanceKey: processInstance.processInstanceKey },
			}),
		interval: 500,
		timeout: 7000,
	})

	expect(elementInstances).toBeDefined()
	const elementInstance = await c8.getElementInstance(
		elementInstances.items[0].elementInstanceKey
	)

	// Assertions for every field in ElementInstanceDetails
	expect(elementInstance.elementId).toBe('StartEvent_1')
	expect(elementInstance.processDefinitionId).toBeDefined()
	expect(elementInstance.startDate).toBeDefined()
	expect(elementInstance.endDate).toBeDefined()
	expect(elementInstance.elementName).toBeDefined()
	expect(elementInstance.type).toBeDefined()
	expect(['START_EVENT', 'UNSPECIFIED', 'PROCESS']).toContain(
		elementInstance.type
	)
	expect(['ACTIVE', 'COMPLETED', 'TERMINATED']).toContain(elementInstance.state)
	expect(typeof elementInstance.hasIncident).toBe('boolean')
	expect(elementInstance.tenantId).toBeDefined()
	expect(elementInstance.elementInstanceKey).toBe(
		elementInstances.items[0].elementInstanceKey
	)
	expect(elementInstance.processInstanceKey).toBe(
		processInstance.processInstanceKey
	)
	expect(elementInstance.processDefinitionKey).toBe(processDefinitionKey)

	// Check if incidentKey exists only when hasIncident is true
	if (elementInstance.hasIncident) {
		expect(elementInstance.incidentKey).toBeDefined()
	}

	await c8.cancelProcessInstance({
		processInstanceKey: processInstance.processInstanceKey,
	})
})
