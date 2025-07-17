import * as fs from 'fs'
import * as path from 'path'

import { PollingOperation } from '../../'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

jest.setTimeout(10000) // Set a longer timeout for the test suite

describe('CamundaRestClient.getDecisionInstance', () => {
	let client: CamundaRestClient
	let decisionDefinitionKey: string
	let decisionInstanceKey: string
	let decisionDefId: string

	beforeAll(async () => {
		// Set longer timeout for deployment
		jest.setTimeout(30000)
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
		decisionInstanceKey = evaluationResult.decisionInstanceKey
	})

	it('should fetch a decision instance and return all documented fields', async () => {
		const res = await PollingOperation({
			operation: () =>
				client.searchDecisionInstances({ filter: { decisionInstanceKey } }),
			interval: 100,
			timeout: 6000,
		})

		// Now use the created decision instance key
		const result = await client.getDecisionInstance(
			res.items[0].decisionInstanceId
		)

		expect(result.decisionInstanceKey).toBe(decisionInstanceKey)
		expect(result.decisionDefinitionKey).toBe(decisionDefinitionKey)
		expect(result.decisionDefinitionId).toBe(decisionDefId)
		expect(result.decisionDefinitionName).toBe('Dish Decision')
		expect(result.decisionDefinitionVersion).toBeDefined()
		expect(result.decisionDefinitionType).toBeDefined()
		expect(result.processInstanceKey).toBeDefined() // May be null/undefined if not called from a process
		expect(result.evaluationDate).toBeDefined()
		expect(result.state).toBe('EVALUATED')
		expect(result.result).toBeDefined()
		expect(JSON.parse(result.result)).toBe('Light Salad and a nice Steak')
		expect(result.decisionDefinitionType).toBe('DECISION_TABLE')
	})

	it('should handle a non-existent decision instance', async () => {
		// Try to get a non-existent decision instance
		const INVALID_KEY = '9999999999'

		let errorOccurred = false
		try {
			await client.getDecisionInstance(INVALID_KEY)
			fail('Should have thrown an error for non-existent decision instance')
		} catch (error) {
			errorOccurred = true
			expect(error).toBeDefined()
		}
		expect(errorOccurred).toBe(true)
	})
})
