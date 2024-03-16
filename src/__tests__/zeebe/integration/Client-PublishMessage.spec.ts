import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'
import { v4 as uuid } from 'uuid'

import { DeployProcessResponse, ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(45000)
suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()
let deploy: DeployProcessResponse

beforeAll(async () => {
	deploy = await zbc.deployProcess(
		'./src/__tests__/testdata/Client-MessageStart.bpmn'
	)
})

afterAll(async () => {
	await zbc.close()
	restoreZeebeLogging()
	await cancelProcesses(deploy.processes[0].bpmnProcessId)
})

test('Can publish a message', () =>
	new Promise((done) => {
		const randomId = uuid()

		// Wait 1 second to make sure the deployment is complete
		new Promise((res) => setTimeout(() => res(null), 1000)).then(() => {
			zbc.publishMessage({
				name: 'MSG-START_JOB',
				variables: {
					testKey: randomId,
				},
				correlationKey: 'something',
			})

			zbc.createWorker({
				taskType: 'console-log-msg-start',
				taskHandler: async (job) => {
					const res = await job.complete()
					expect(job.variables.testKey).toBe(randomId) // Makes sure the worker isn't responding to another message
					done(null)
					return res
				},
				loglevel: 'NONE',
			})
		})
	}))
