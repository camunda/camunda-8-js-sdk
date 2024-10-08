import { LosslessDto } from '@camunda8/lossless-json'

import { CamundaRestClient } from '../..'
// import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(60000)

const c8 = new CamundaRestClient()
// let pid: string

beforeAll(async () => {
	await c8.deployResourcesFromFiles({
		files: ['./src/__tests__/testdata/Signal.bpmn'],
	})
	// const res = await c8.deployResourcesFromFiles([
	// 	'./src/__tests__/testdata/Signal.bpmn',
	// ])
	// pid = res.processes[0].processDefinitionKey
	// await cancelProcesses(pid)
})

afterAll(async () => {
	// await cancelProcesses(pid)
})

test('Can start a process with a signal', async () => {
	await c8.deployResourcesFromFiles({
		files: ['./src/__tests__/testdata/Signal.bpmn'],
	})

	const res = await c8.broadcastSignal({
		signalName: 'test-signal',
		variables: {
			success: true,
		},
	})

	expect(res.signalKey).toBeTruthy()

	await new Promise((resolve) => {
		const w = c8.createJobWorker({
			type: 'signal-service-task',
			worker: 'signal-worker',
			timeout: 10000,
			pollIntervalMs: 1000,
			maxJobsToActivate: 10,
			inputVariableDto: class extends LosslessDto {
				success!: boolean
			},
			jobHandler: (job) => {
				const ack = job.complete()
				expect(job.variables.success).toBe(true)
				w.stop().then(() => resolve(null))
				return ack
			},
		})
	})
})
