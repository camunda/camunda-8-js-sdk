import { v4 } from 'uuid'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'

const c8 = new CamundaRestClient()

beforeAll(async () => {
	await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-message-test.bpmn',
	])
})

test('Can publish a message', (done) => {
	const uuid = v4()
	const outputVariablesDto = class extends LosslessDto {
		messageReceived!: boolean
	}
	c8.createProcessInstanceWithResult({
		bpmnProcessId: 'rest-message-test',
		variables: {
			correlationId: uuid,
		},
		outputVariablesDto,
	}).then((result) => {
		expect(result.variables.messageReceived).toBe(true)
		done()
	})
	c8.publishMessage({
		correlationKey: uuid,
		messageId: uuid,
		name: 'rest-message',
		variables: {
			messageReceived: true,
		},
		timeToLive: 10000,
	})
})

test('Can correlate a message', (done) => {
	const uuid = v4()
	const outputVariablesDto = class extends LosslessDto {
		messageReceived!: boolean
	}
	c8.createProcessInstanceWithResult({
		bpmnProcessId: 'rest-message-test',
		variables: {
			correlationId: uuid,
		},
		outputVariablesDto,
	}).then((result) => {
		expect(result.variables.messageReceived).toBe(true)
		done()
	})
	setTimeout(
		() =>
			c8.correlateMessage({
				correlationKey: uuid,
				name: 'rest-message',
				variables: {
					messageReceived: true,
				},
			}),
		1000
	)
})

test('Correlate message returns expected data', (done) => {
	const uuid = v4()
	let processInstanceKey: string
	c8.createProcessInstance({
		bpmnProcessId: 'rest-message-test',
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
