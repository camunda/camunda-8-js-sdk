import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

// Mock the dependencies
jest.mock('got')

describe('searchDecisionInstances (unit)', () => {
	let restClient: CamundaRestClient
	let mockCallApiEndpoint: jest.SpyInstance

	beforeEach(() => {
		// Create a mock client that doesn't require OAuth
		restClient = new CamundaRestClient({
			config: {
				CAMUNDA_OAUTH_URL: 'https://mock.camunda.com/oauth',
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'test',
				ZEEBE_CLIENT_ID: 'test',
				ZEEBE_CLIENT_SECRET: 'test',
				ZEEBE_REST_ADDRESS: 'https://mock.camunda.com/rest',
			},
		})

		// Mock the callApiEndpoint method
		mockCallApiEndpoint = jest.spyOn(restClient, 'callApiEndpoint')
	})

	afterEach(() => {
		jest.clearAllMocks()
	})

	test('it calls the correct API endpoint with proper parameters', async () => {
		const mockResponse = {
			page: {
				totalItems: 2,
				startCursor: 'cursor1',
				endCursor: 'cursor2',
			},
			items: [
				{
					decisionInstanceKey: '123',
					decisionDefinitionId: 'test-decision',
					decisionDefinitionKey: '456',
					decisionDefinitionName: 'Test Decision',
					decisionDefinitionVersion: 1,
					processDefinitionKey: '789',
					processInstanceKey: '101112',
					state: 'EVALUATED',
					evaluationDate: '2023-01-01T00:00:00Z',
					tenantId: 'default',
					decisionType: 'DECISION_TABLE',
					result: '{"result": "approved"}',
				},
			],
		}

		mockCallApiEndpoint.mockResolvedValue(mockResponse)

		const request = {
			filter: {
				decisionDefinitionId: 'test-decision',
				state: 'EVALUATED' as const,
			},
			sort: [
				{
					field: 'evaluationDate' as const,
					order: 'DESC' as const,
				},
			],
			page: {
				from: 0,
				limit: 10,
			},
		}

		const result = await restClient.searchDecisionInstances(request)

		// Verify the callApiEndpoint was called with correct parameters
		expect(mockCallApiEndpoint).toHaveBeenCalledWith({
			method: 'POST',
			urlPath: 'decision-instances/search',
			body: request,
		})

		// Verify the response
		expect(result).toEqual(mockResponse)
		expect(result.page.totalItems).toBe(2)
		expect(result.items).toHaveLength(1)
		expect(result.items[0].decisionInstanceKey).toBe('123')
		expect(result.items[0].state).toBe('EVALUATED')
	})

	test('it handles minimal request with only filter', async () => {
		const mockResponse = {
			page: {
				totalItems: 0,
				startCursor: '',
				endCursor: '',
			},
			items: [],
		}

		mockCallApiEndpoint.mockResolvedValue(mockResponse)

		const request = {
			filter: {},
		}

		const result = await restClient.searchDecisionInstances(request)

		expect(mockCallApiEndpoint).toHaveBeenCalledWith({
			method: 'POST',
			urlPath: 'decision-instances/search',
			body: request,
		})

		expect(result.page.totalItems).toBe(0)
		expect(result.items).toHaveLength(0)
	})

	test('it handles all filter options', async () => {
		const mockResponse = {
			page: {
				totalItems: 1,
				startCursor: 'cursor1',
				endCursor: 'cursor1',
			},
			items: [
				{
					decisionInstanceKey: '123',
					decisionDefinitionId: 'test-decision',
					decisionDefinitionKey: '456',
					decisionDefinitionName: 'Test Decision',
					decisionDefinitionVersion: 1,
					processDefinitionKey: '789',
					processInstanceKey: '101112',
					state: 'EVALUATED',
					evaluationDate: '2023-01-01T00:00:00Z',
					tenantId: 'tenant1',
					decisionType: 'DECISION_TABLE',
					result: '{"result": "approved"}',
				},
			],
		}

		mockCallApiEndpoint.mockResolvedValue(mockResponse)

		const request = {
			filter: {
				decisionInstanceKey: '123',
				decisionDefinitionId: 'test-decision',
				decisionDefinitionKey: '456',
				decisionDefinitionName: 'Test Decision',
				decisionDefinitionVersion: 1,
				processDefinitionKey: '789',
				processInstanceKey: '101112',
				state: 'EVALUATED' as const,
				evaluationDate: '2023-01-01T00:00:00Z',
				tenantId: 'tenant1',
				decisionType: 'DECISION_TABLE' as const,
			},
		}

		const result = await restClient.searchDecisionInstances(request)

		expect(mockCallApiEndpoint).toHaveBeenCalledWith({
			method: 'POST',
			urlPath: 'decision-instances/search',
			body: request,
		})

		expect(result).toEqual(mockResponse)
	})

	test('it handles all sort field options', async () => {
		const mockResponse = {
			page: {
				totalItems: 0,
				startCursor: '',
				endCursor: '',
			},
			items: [],
		}

		mockCallApiEndpoint.mockResolvedValue(mockResponse)

		const sortFields = [
			'decisionInstanceKey',
			'decisionDefinitionId',
			'decisionDefinitionKey',
			'decisionDefinitionName',
			'decisionDefinitionVersion',
			'processDefinitionKey',
			'processInstanceKey',
			'state',
			'evaluationDate',
			'tenantId',
			'decisionType',
		] as const

		for (const field of sortFields) {
			const request = {
				filter: {},
				sort: [
					{
						field,
						order: 'ASC' as const,
					},
				],
			}

			await restClient.searchDecisionInstances(request)

			expect(mockCallApiEndpoint).toHaveBeenCalledWith({
				method: 'POST',
				urlPath: 'decision-instances/search',
				body: request,
			})
		}

		expect(mockCallApiEndpoint).toHaveBeenCalledTimes(sortFields.length)
	})

	test('it handles pagination options', async () => {
		const mockResponse = {
			page: {
				totalItems: 100,
				startCursor: 'cursor1',
				endCursor: 'cursor10',
			},
			items: [],
		}

		mockCallApiEndpoint.mockResolvedValue(mockResponse)

		const request = {
			filter: {},
			page: {
				from: 20,
				limit: 10,
			},
		}

		const result = await restClient.searchDecisionInstances(request)

		expect(mockCallApiEndpoint).toHaveBeenCalledWith({
			method: 'POST',
			urlPath: 'decision-instances/search',
			body: request,
		})

		expect(result.page.totalItems).toBe(100)
	})
})
