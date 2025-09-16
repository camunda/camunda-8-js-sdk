import path from 'node:path'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const restClient = new CamundaRestClient()

beforeAll(async () => {
	// Deploy a decision resource for testing
	await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `test-drd.dmn`),
	])
})

describe('searchDecisionInstances', () => {
	test('it can search decision instances with minimal request', async () => {
		// First evaluate a decision to create a decision instance
		await restClient.evaluateDecision({
			decisionDefinitionId: 'test-decision',
			variables: {
				name: 'camunda',
			},
		})

		// Now search for decision instances
		const result = await restClient.searchDecisionInstances({
			filter: {},
		})

		expect(result).toBeTruthy()
		expect(result.page).toBeDefined()
		expect(result.page.totalItems).toBeGreaterThanOrEqual(0)
		expect(result.items).toBeDefined()
		expect(Array.isArray(result.items)).toBe(true)
	})

	test('it can search decision instances with filters', async () => {
		// Evaluate a decision to ensure we have decision instances
		await restClient.evaluateDecision({
			decisionDefinitionId: 'test-decision',
			variables: {
				name: 'camunda',
			},
		})

		// Search with specific filters
		const result = await restClient.searchDecisionInstances({
			filter: {
				decisionDefinitionId: 'test-decision',
				state: 'EVALUATED',
			},
			sort: [
				{
					field: 'evaluationDate',
					order: 'DESC',
				},
			],
			page: {
				from: 0,
				limit: 10,
			},
		})

		expect(result).toBeTruthy()
		expect(result.page).toBeDefined()
		expect(result.items).toBeDefined()
		expect(Array.isArray(result.items)).toBe(true)

		// If we have items, verify they match our filter
		if (result.items.length > 0) {
			const firstItem = result.items[0]
			expect(firstItem.decisionDefinitionId).toBe('test-decision')
			expect(firstItem.state).toBe('EVALUATED')
			expect(firstItem.decisionEvaluationInstanceKey).toBeDefined()
			expect(firstItem.evaluationDate).toBeDefined()
		}
	})

	test('it can search decision instances with pagination', async () => {
		// Search with pagination
		const result = await restClient.searchDecisionInstances({
			filter: {},
			page: {
				from: 0,
				limit: 5,
			},
		})

		expect(result).toBeTruthy()
		expect(result.page).toBeDefined()
		expect(result.page.totalItems).toBeGreaterThanOrEqual(0)
		expect(result.items).toBeDefined()
		expect(Array.isArray(result.items)).toBe(true)
		expect(result.items.length).toBeLessThanOrEqual(5)
	})

	test('it can search decision instances with sort options', async () => {
		const result = await restClient.searchDecisionInstances({
			filter: {},
			sort: [
				{
					field: 'decisionEvaluationInstanceKey',
					order: 'ASC',
				},
			],
		})

		expect(result).toBeTruthy()
		expect(result.page).toBeDefined()
		expect(result.items).toBeDefined()
		expect(Array.isArray(result.items)).toBe(true)
	})

	test('it handles empty search results', async () => {
		// Search with a filter that should return no results
		const result = await restClient.searchDecisionInstances({
			filter: {
				decisionDefinitionId: 'non-existent-decision-id',
			},
		})

		expect(result).toBeTruthy()
		expect(result.page).toBeDefined()
		expect(result.page.totalItems).toBe(0)
		expect(result.items).toBeDefined()
		expect(Array.isArray(result.items)).toBe(true)
		expect(result.items.length).toBe(0)
	})

	test('it returns correct decision instance properties', async () => {
		// Evaluate a decision to ensure we have a decision instance
		await restClient.evaluateDecision({
			decisionDefinitionId: 'test-decision',
			variables: {
				name: 'camunda',
			},
		})

		const result = await restClient.searchDecisionInstances({
			filter: {
				decisionDefinitionId: 'test-decision',
			},
			page: {
				from: 0,
				limit: 1,
			},
		})

		expect(result).toBeTruthy()

		if (result.items.length > 0) {
			const decisionInstance = result.items[0]

			// Verify required properties exist
			expect(decisionInstance.decisionEvaluationInstanceKey).toBeDefined()
			expect(typeof decisionInstance.decisionEvaluationInstanceKey).toBe(
				'string'
			)

			expect(decisionInstance.decisionDefinitionId).toBeDefined()
			expect(typeof decisionInstance.decisionDefinitionId).toBe('string')

			expect(decisionInstance.decisionDefinitionKey).toBeDefined()
			expect(typeof decisionInstance.decisionDefinitionKey).toBe('string')

			expect(decisionInstance.state).toBeDefined()
			expect(['EVALUATED', 'FAILED', 'UNKNOWN', 'UNSPECIFIED']).toContain(
				decisionInstance.state
			)

			expect(decisionInstance.evaluationDate).toBeDefined()
			expect(typeof decisionInstance.evaluationDate).toBe('string')
		}
	})
})
