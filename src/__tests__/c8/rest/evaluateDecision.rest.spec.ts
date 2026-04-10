import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { matrix } from '../../../test-support/testTags'

vi.setConfig({ testTimeout: 30_000 })

const c8 = new CamundaRestClient()

beforeAll(async () => {
	await c8.deployResourcesFromFiles([
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
)('can evaluate a decision', async () => {
	const output = await c8.evaluateDecision({
		decisionDefinitionId: 'test-decision',
		variables: {
			name: 'camunda',
		},
	})

	// Validate the complete EvaluateDecisionResponse DTO
	expect(output.decisionDefinitionId).toBeDefined()
	expect(output.decisionDefinitionName).toBeDefined()
	expect(output.decisionDefinitionVersion).toBeDefined()
	expect(typeof output.decisionDefinitionVersion).toBe('number')
	expect(output.decisionRequirementsId).toBeDefined()
	expect(output.decisionRequirementsKey).toBeDefined()
	expect(output.decisionDefinitionKey).toBeDefined()
	expect(output.decisionInstanceKey).toBeDefined()
	expect(output.tenantId).toBeDefined()

	// Output might be undefined if not directly available at the top level
	if (output.output !== undefined) {
		expect(typeof output.output).toBe('string')
	}

	// Validate evaluatedDecisions array
	expect(output.evaluatedDecisions).toBeDefined()
	expect(Array.isArray(output.evaluatedDecisions)).toBe(true)
	expect(output.evaluatedDecisions.length).toBeGreaterThan(0)

	// Validate first evaluatedDecision
	const evaluatedDecision = output.evaluatedDecisions[0]
	expect(evaluatedDecision.decisionDefinitionId).toBeDefined()
	expect(evaluatedDecision.decisionDefinitionName).toBeDefined()
	expect(evaluatedDecision.decisionDefinitionVersion).toBeDefined()
	expect(typeof evaluatedDecision.decisionDefinitionVersion).toBe('number')
	// decisionDefinitionType might not be present in all API versions
	if (evaluatedDecision.decisionDefinitionType !== undefined) {
		expect(typeof evaluatedDecision.decisionDefinitionType).toBe('string')
	}
	expect(evaluatedDecision.decisionDefinitionKey).toBeDefined()
	expect(evaluatedDecision.tenantId).toBeDefined()
	expect(evaluatedDecision.output).toBeDefined() // Check for existence without exact value match

	// Validate evaluatedInputs
	expect(evaluatedDecision.evaluatedInputs).toBeDefined()
	expect(Array.isArray(evaluatedDecision.evaluatedInputs)).toBe(true)
	if (evaluatedDecision.evaluatedInputs.length > 0) {
		const input = evaluatedDecision.evaluatedInputs[0]
		expect(input.inputId).toBeDefined()
		expect(input.inputName).toBeDefined()
		expect(input.inputValue).toBeDefined()
	}

	// Validate matchedRules
	expect(evaluatedDecision.matchedRules).toBeDefined()
	expect(Array.isArray(evaluatedDecision.matchedRules)).toBe(true)
	if (evaluatedDecision.matchedRules.length > 0) {
		const rule = evaluatedDecision.matchedRules[0]
		expect(rule.ruleId).toBeDefined()
		expect(rule.ruleIndex).toBeDefined()
		expect(rule.evaluatedOutputs).toBeDefined()
		expect(Array.isArray(rule.evaluatedOutputs)).toBe(true)

		if (rule.evaluatedOutputs.length > 0) {
			const output = rule.evaluatedOutputs[0]
			expect(output.outputId).toBeDefined()
			expect(output.outputName).toBeDefined()
			expect(output.outputValue).toBeDefined()
		}
	}
})
