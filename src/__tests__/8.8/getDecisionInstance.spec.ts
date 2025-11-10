import * as fs from 'node:fs'
import * as path from 'node:path'

import { PollingOperation } from '../../'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

vitest.setConfig({ testTimeout: 10_000 })

// Skipping this test suite for now as getDecisionInstance has been refactored and needs review
test.skip('CamundaRestClient.getDecisionInstance', () => {
	let client: CamundaRestClient
	let decisionDefinitionKey: string
	let decisionEvaluationKey: string
	let decisionDefId: string

	vitest.setConfig({ testTimeout: 20_000 })

	beforeAll(async () => {
		client = new CamundaRestClient()

		// Step 1: Deploy DMN
		const dmnFilePath = path.join(__dirname, 'resources', 'dish-decision.dmn')
		const dmnFile = fs.readFileSync(dmnFilePath, 'utf8')

		const resources = [
			{
				name: 'dish-decision.dmn',
				content: dmnFile,
			},
		]

		const deploymentResult = await client.deployResources(resources)

		// Get the decision definition key from the deployment
		decisionDefinitionKey = deploymentResult.decisions[0].decisionDefinitionKey
		decisionDefId = deploymentResult.decisions[0].decisionDefinitionId

		// Step 2: Evaluate decision to create an instance
		const evaluationResult = await client.evaluateDecision({
			decisionDefinitionKey,
			variables: {
				season: 'Summer',
				guestCount: 5,
			},
		})

		// Store the decision instance key for our test
		decisionEvaluationKey = evaluationResult.decisionEvaluationKey
	})

	test.skip('should fetch a decision instance and return all documented fields', async () => {
		const res = await PollingOperation({
			operation: () =>
				// @ts-expect-error Waiting for migration to OCA client
				client.searchDecisionInstances({ filter: { decisionEvaluationKey } }),
			interval: 100,
			timeout: 6000,
		})

		// Now use the created decision instance key
		// @ts-expect-error Waiting for migration to OCA client
		const result = await client.getDecisionInstance(
			// @ts-expect-error Waiting for migration to OCA client
			res.items[0].decisionInstanceId
		)

		// expect(result.decisionEvaluationInstanceKey).toBe(decisionEvaluationKey)
		expect(result.decisionDefinitionKey).toBe(decisionDefinitionKey)
		expect(result.decisionDefinitionId).toBe(decisionDefId)
		expect(result.decisionDefinitionName).toBe('Dish Decision')
		expect(result.decisionDefinitionVersion).toBeDefined()
		expect(result.decisionDefinitionType).toBe('DECISION_TABLE')
		expect(result.processInstanceKey).toBeDefined() // May be null/undefined if not called from a process
		expect(result.processDefinitionKey).toBeDefined() // May be -1 if not called from a process
		expect(result.evaluationDate).toBeDefined()
		expect(result.state).toBe('EVALUATED')
		expect(result.result).toBeDefined()
		expect(JSON.parse(result.result)).toBe('Light Salad and a nice Steak')

		// Assertions for evaluatedInputs
		expect(result.evaluatedInputs).toBeDefined()
		expect(Array.isArray(result.evaluatedInputs)).toBe(true)
		expect(result.evaluatedInputs.length).toBeGreaterThan(0)

		// Validate first input (Season)
		const seasonInput = result.evaluatedInputs.find(
			(input) => input.inputId === 'Input_1'
		)
		expect(seasonInput).toBeDefined()
		expect(seasonInput?.inputName).toBe('Season')
		expect(seasonInput?.inputValue).toBe('"Summer"')

		// Validate second input (Guest Count)
		const guestCountInput = result.evaluatedInputs.find(
			(input) => input.inputId === 'InputClause_0tymfo2'
		)
		expect(guestCountInput).toBeDefined()
		expect(guestCountInput?.inputName).toBe('Guest Count')
		expect(guestCountInput?.inputValue).toBe('5')

		// Assertions for matchedRules
		expect(result.matchedRules).toBeDefined()
		expect(Array.isArray(result.matchedRules)).toBe(true)
		expect(result.matchedRules.length).toBeGreaterThan(0)

		// Validate matched rule
		const matchedRule = result.matchedRules[0]
		expect(matchedRule.ruleId).toBe('DecisionRule_09z3x97')
		expect(matchedRule.ruleIndex).toBeDefined()
		expect(matchedRule.evaluatedOutputs).toBeDefined()
		expect(Array.isArray(matchedRule.evaluatedOutputs)).toBe(true)
		expect(matchedRule.evaluatedOutputs.length).toBeGreaterThan(0)

		// Validate output
		const output = matchedRule.evaluatedOutputs[0]
		expect(output.outputId).toBe('Output_1')
		expect(output.outputName).toBe('Dish')
		expect(output.outputValue).toBe('"Light Salad and a nice Steak"')
	})

	test.skip('should handle a non-existent decision instance', async () => {
		// Try to get a non-existent decision instance
		const INVALID_KEY = '9999999999'

		let errorOccurred = false
		try {
			// @ts-expect-error Waiting for migration to OCA client
			await client.getDecisionInstance(INVALID_KEY)
		} catch (error) {
			errorOccurred = true
			expect(error).toBeDefined()
		}
		expect(errorOccurred).toBe(true)
	})
})
