import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(60000)

const zbc = new ZeebeGrpcClient()
let pid: string

beforeAll(async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Signal.bpmn',
	})
	pid = res.deployments[0].process.processDefinitionKey
	await cancelProcesses(pid)
})

afterAll(async () => {
	await zbc.close()
	await cancelProcesses(pid)
})

test('Can start a process with a signal', async () => {
	await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Signal.bpmn',
	})

	const res = await zbc.broadcastSignal({
		signalName: 'test-signal',
		variables: {
			success: true,
		},
	})

	expect(res.key).toBeTruthy()

	await new Promise((resolve) =>
		zbc.createWorker({
			taskType: 'signal-service-task',
			taskHandler: (job) => {
				const ack = job.complete()
				expect(job.variables.success).toBe(true)
				resolve(null)
				return ack
			},
		})
	)
})
