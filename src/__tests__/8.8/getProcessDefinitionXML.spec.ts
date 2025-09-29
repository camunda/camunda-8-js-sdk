import { expect, test } from 'vitest'

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
)('It can get the Process Definition XML', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/SearchProcessInstances.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processXML = await c8.getProcessDefinitionXML(key)

	// Validate the XML string response
	expect(typeof processXML).toBe('string')
	expect(processXML.length).toBeGreaterThan(0)

	// Check for required BPMN XML elements
	expect(processXML).toContain('<?xml version=')
	expect(processXML).toContain('<bpmn:definitions')
	expect(processXML).toContain('<bpmn:process id=')
	expect(processXML).toContain('search-process-instances-test')

	// Validate BPMN namespace declarations
	expect(processXML).toContain('xmlns:bpmn=')
	expect(processXML).toContain('xmlns:zeebe=')

	// Check for standard BPMN elements
	expect(processXML).toMatch(/<bpmn:(startEvent|endEvent|sequenceFlow)/i)

	// Validate that the XML is properly formatted (no truncation)
	expect(processXML).toContain('</bpmn:definitions>')
})
