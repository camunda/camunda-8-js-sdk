import path from 'node:path'

import {
	DecisionDeployment,
	DecisionRequirementsDeployment,
	DeployResourceResponse,
	FormDeployment,
	ProcessDeployment,
} from '../../../c8/lib/C8Dto'
import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { matrix } from '../../../test-support/testTags'

const c8 = new CamundaRestClient()

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('can deploy resources and validate complete response DTO', async () => {
	const res = await c8.deployResourcesFromFiles([
		path.join(
			'.',
			'src',
			'__tests__',
			'testdata',
			'query-subscription-test.bpmn'
		),

		path.join('.', 'src', '__tests__', 'testdata', 'test-drd.dmn'),
		path.join(
			'.',
			'src',
			'__tests__',
			'testdata',
			'form',
			'test-basic-form.form'
		),
	])

	// Assert that the response is an instance of DeployResourceResponse
	expect(res).toBeInstanceOf(DeployResourceResponse)

	// Assert deploymentKey is present and is a string (int64 string)
	expect(res.deploymentKey).toBeDefined()
	expect(typeof res.deploymentKey).toBe('string')
	expect(res.deploymentKey).toMatch(/^\d+$/)

	// Assert tenantId is present
	expect(res.tenantId).toBeDefined()

	// Assert deployments array is present and has correct structure
	expect(res.deployments).toBeDefined()
	expect(Array.isArray(res.deployments)).toBe(true)
	expect(res.deployments.length).toBe(4)

	// Assert that the helper arrays are populated correctly
	expect(Array.isArray(res.processes)).toBe(true)
	expect(Array.isArray(res.decisions)).toBe(true)
	expect(Array.isArray(res.decisionRequirements)).toBe(true)
	expect(Array.isArray(res.forms)).toBe(true)

	// Assert that we have at least one process
	expect(res.processes.length).toBe(1)

	// Validate process deployment properties
	const process = res.processes[0]
	expect(process).toBeInstanceOf(ProcessDeployment)
	expect(process.processDefinitionId).toBeDefined()
	expect(process.processDefinitionVersion).toBeDefined()
	expect(process.processDefinitionKey).toBeDefined()
	expect(typeof process.processDefinitionKey).toBe('string')
	expect(process.processDefinitionKey).toMatch(/^\d+$/)
	expect(process.resourceName).toBeDefined()
	expect(process.tenantId).toBeDefined()

	// Validate decision deployment properties
	expect(res.decisions.length).toBe(1)
	const decision = res.decisions[0]
	expect(decision).toBeInstanceOf(DecisionDeployment)

	// Assert all properties based on the actual structure
	expect(decision.decisionDefinitionId).toBeDefined()
	expect(decision.version).toBeDefined()
	expect(typeof decision.version).toBe('number')
	expect(decision.name).toBeDefined()
	expect(decision.tenantId).toBeDefined()
	expect(decision.decisionRequirementsId).toBeDefined()
	expect(decision.decisionDefinitionKey).toBeDefined()
	expect(typeof decision.decisionDefinitionKey).toBe('string')
	expect(decision.decisionDefinitionKey).toMatch(/^\d+$/)
	expect(decision.decisionRequirementsKey).toBeDefined()
	expect(typeof decision.decisionRequirementsKey).toBe('string')
	expect(decision.decisionRequirementsKey).toMatch(/^\d+$/)

	// Validate decision requirements deployment properties
	expect(res.decisionRequirements.length).toBe(1)
	const decisionRequirement = res.decisionRequirements[0]
	expect(decisionRequirement).toBeInstanceOf(DecisionRequirementsDeployment)

	// Assert all properties based on the actual structure
	expect(decisionRequirement.decisionRequirementsId).toBeDefined()
	expect(decisionRequirement.version).toBeDefined()
	expect(typeof decisionRequirement.version).toBe('number')
	expect(decisionRequirement.decisionRequirementsName).toBeDefined()
	expect(decisionRequirement.tenantId).toBeDefined()
	expect(decisionRequirement.resourceName).toBeDefined()
	expect(decisionRequirement.decisionRequirementsKey).toBeDefined()
	expect(typeof decisionRequirement.decisionRequirementsKey).toBe('string')
	expect(decisionRequirement.decisionRequirementsKey).toMatch(/^\d+$/)

	// Validate form deployment properties
	expect(res.forms.length).toBe(1)
	const form = res.forms[0]

	expect(form).toBeInstanceOf(FormDeployment)
	expect(form.formId).toBeDefined()
	expect(form.version).toBeDefined()
	expect(typeof form.version).toBe('number')
	expect(form.formKey).toBeDefined()
	expect(typeof form.formKey).toBe('string')
	expect(form.formKey).toMatch(/^\d+$/)
	expect(form.resourceName).toBeDefined()
	expect(form.tenantId).toBeDefined()
})
