import test from 'ava'
import {LosslessDto} from '@camunda8/lossless-json'
import {v6} from 'uuid'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {loadResourcesFromFiles} from '../helpers/_load-resources.js'

const c8 = new CamundaRestClient()

test.before(async () => {
	await c8.deployResources({resources: loadResourcesFromFiles(['./distribution/test/resources/rest-message-test.bpmn'])})
})

test('Can publish a message', async t => {
	const uuid = v6()
	const outputVariablesDto = class extends LosslessDto {
		messageReceived!: boolean
	}
	await c8.publishMessage({
		correlationKey: uuid,
		messageId: uuid,
		name: 'rest-message',
		variables: {
			messageReceived: true,
		},
		timeToLive: 10_000,
	})
	const result = await c8.createProcessInstanceWithResult({
		processDefinitionId: 'rest-message-test',
		variables: {
			correlationId: uuid,
		},
		outputVariablesDto,
	})
	t.is(result.variables.messageReceived, true)
})

test('Can correlate a message', async t => {
	const uuid = v6()
	const outputVariablesDto = class extends LosslessDto {
		messageReceived!: boolean
	}
	await new Promise(resolve => {
		void c8.createProcessInstanceWithResult({
			processDefinitionId: 'rest-message-test',
			variables: {
				correlationId: uuid,
			},
			outputVariablesDto,
		})
			.then(result => {
				t.is(result.variables.messageReceived, true)
				resolve(null)
			})
		setTimeout(
			async () =>
				c8.correlateMessage({
					correlationKey: uuid,
					name: 'rest-message',
					variables: {
						messageReceived: true,
					},
				}),
			1000,
		)
	})
})

test('Correlate message returns expected data', async t => {
	const uuid = v6()
	let processInstanceKey: string
	await new Promise(resolve => {
		void c8.createProcessInstance({
			processDefinitionId: 'rest-message-test',
			variables: {
				correlationId: uuid,
			},
		}).then(result => {
			processInstanceKey = result.processInstanceKey
			setTimeout(
				async () =>
					c8
						.correlateMessage({
							correlationKey: uuid,
							name: 'rest-message',
							variables: {
								messageReceived: true,
							},
						})
						.then(response => {
							t.is(response.processInstanceKey, processInstanceKey)
							resolve(null)
						}),
				1000,
			)
		})
	})
})
