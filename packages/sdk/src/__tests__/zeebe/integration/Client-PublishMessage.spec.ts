import { v4 } from 'uuid'

import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(45000)
suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let processDefinitionKey: string

beforeAll(
	async () =>
		({ processDefinitionKey } = (
			await zbc.deployResource({
				processFilename:
					'./src/__tests__/testdata/message-correlation-test.bpmn',
			})
		).deployments[0].process)
)

afterAll(async () => {
	await zbc.close()
	restoreZeebeLogging()
	await cancelProcesses(processDefinitionKey)
})

test('Can correlate a message with a running process instance', async () => {
	// Wait 1 second to make sure the deployment is complete, and distribute to all brokers
	await new Promise((res) => setTimeout(() => res(null), 1000))

	// eslint-disable-next-line no-async-promise-executor
	await new Promise(async (resolve) => {
		// Generate a random uuid for the process "orderId" variable
		const thisOrderIdValue = v4()
		// Start a new process instance, and wait for the result - but asynchronously
		zbc
			.createProcessInstanceWithResult({
				bpmnProcessId: 'message-correlation-test',
				variables: {
					orderId: thisOrderIdValue,
				},
			})
			.then((res) => {
				// This code will run after the process instance has completed
				expect(res.variables.orderId).toBe(thisOrderIdValue)
				resolve(null)
			})
		// Execution continues WITHOUT waiting for the process instance to complete
		// Publish the message to the process instance. Set the TTL to 5 seconds, because this will execute
		// milliseconds after calling createPostInstanceWithResult, and the process will probably not have
		// started yet.
		const messageResponse = await zbc.publishMessage({
			// Although this field is called 'correlationKey', it is actually the *value* of the variable
			// specified in the process model. The correlationKey in the BPMN message definition is the *name* of the variable.
			correlationKey: thisOrderIdValue,
			name: 'MESSAGE_CORRELATION_TEST_CATCH',
			timeToLive: 5000,
		})
		expect(messageResponse.key).toBeDefined()
	})
})
