import { randomUUID as uuid } from 'node:crypto'

import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { DeployResourceResponse, ProcessDeployment } from '../../../zeebe/types'

vi.setConfig({ testTimeout: 45_000 })
let test1: DeployResourceResponse<ProcessDeployment>

const zbc = new ZeebeGrpcClient()

beforeAll(async () => {
	test1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Client-MessageStart.bpmn',
	})
	await cancelProcesses(test1.deployments[0].process.processDefinitionKey)
})

afterAll(async () => {
	await zbc.close()

	await cancelProcesses(test1.deployments[0].process.processDefinitionKey)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Can start a process with a message',
	() =>
		new Promise<void>((done) => {
			const randomId = uuid()

			// Wait 1 second to make sure the deployment is complete
			new Promise((res) => setTimeout(() => res(null), 1000))
				.then(() =>
					zbc.publishStartMessage({
						name: 'MSG-START_JOB',
						timeToLive: 2000,
						variables: {
							testKey: randomId,
						},
					})
				)
				.then(() =>
					zbc.createWorker({
						taskType: 'console-log-msg-start',
						taskHandler: async (job) => {
							const res = await job.complete()
							expect(job.variables.testKey).toBe(randomId) // Makes sure the worker isn't responding to another message
							done()
							return res
						},
						loglevel: 'NONE',
					})
				)
		})
)
