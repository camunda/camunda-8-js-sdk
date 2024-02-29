import { ZBClient } from '../..'
import { cancelProcesses } from '../../lib/cancelProcesses'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(60000)

const zbc = new ZBClient()
let pid: string

beforeAll(async () => {
	const res = await zbc.deployResource({
		processFilename: './src/zeebe/__tests__/testdata/Signal.bpmn',
	})
	pid = res.deployments[0].process.bpmnProcessId
	await cancelProcesses(pid)
})

afterAll(async () => {
	await zbc.close()
	await cancelProcesses(pid)
})

test('Can start a process with a signal', async () => {
	await zbc.deployResource({
		processFilename: './src/zeebe/__tests__/testdata/Signal.bpmn',
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
