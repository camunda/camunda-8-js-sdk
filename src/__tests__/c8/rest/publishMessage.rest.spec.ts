import { randomUUID } from 'node:crypto'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'
import { matrix } from '../../../test-support/testTags'

const c8 = new CamundaRestClient()

beforeAll(async () => {
	await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-message-test.bpmn',
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
)('Can publish a message', async () => {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<void>(async (resolve) => {
		const uuid = randomUUID()
		const outputVariablesDto = class extends LosslessDto {
			messageReceived!: boolean
		}
		c8.createProcessInstanceWithResult({
			processDefinitionId: 'rest-message-test',
			variables: {
				correlationId: uuid,
			},
			outputVariablesDto,
		}).then((result) => {
			expect(result.variables.messageReceived).toBe(true)
			return resolve()
		})
		const publishResponse = await c8.publishMessage({
			correlationKey: uuid,
			messageId: uuid,
			name: 'rest-message',
			variables: {
				messageReceived: true,
			},
			timeToLive: 10000,
		})
		expect(publishResponse).toBeDefined()
		expect(publishResponse.messageKey).toBeDefined()
		expect(typeof publishResponse.messageKey).toBe('string')
		expect(publishResponse.tenantId).toBeDefined()
	})
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
)(
	'Can correlate a message',
	() =>
		new Promise<void>((done) => {
			const uuid = randomUUID()
			const outputVariablesDto = class extends LosslessDto {
				messageReceived!: boolean
			}
			c8.createProcessInstanceWithResult({
				processDefinitionId: 'rest-message-test',
				variables: {
					correlationId: uuid,
				},
				outputVariablesDto,
			}).then((result) => {
				expect(result.variables.messageReceived).toBe(true)
				done()
			})
			setTimeout(async () => {
				const correlationResponse = await c8.correlateMessage({
					correlationKey: uuid,
					name: 'rest-message',
					variables: {
						messageReceived: true,
					},
				})
				expect(correlationResponse).toBeDefined()
				expect(correlationResponse.messageKey).toBeDefined()
				expect(typeof correlationResponse.messageKey).toBe('string')
				expect(correlationResponse.processInstanceKey).toBeDefined()
				expect(typeof correlationResponse.processInstanceKey).toBe('string')
				expect(correlationResponse.processInstanceKey.length).toBeGreaterThan(0)
				expect(correlationResponse.tenantId).toBeDefined()
			}, 1000)
		})
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Correlate message returns expected data',
	() =>
		new Promise<void>((done) => {
			const uuid = randomUUID()
			let processInstanceKey: string
			c8.createProcessInstance({
				processDefinitionId: 'rest-message-test',
				variables: {
					correlationId: uuid,
				},
			}).then((result) => {
				processInstanceKey = result.processInstanceKey
				setTimeout(
					() =>
						c8
							.correlateMessage({
								correlationKey: uuid,
								name: 'rest-message',
								variables: {
									messageReceived: true,
								},
							})
							.then((res) => {
								expect(res.processInstanceKey).toBe(processInstanceKey)
								done()
							}),
					1000
				)
			})
		})
)
