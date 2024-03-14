import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe/index'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(30000)

let zbc: ZeebeGrpcClient
let processId: string

beforeAll(async () => {
	suppressZeebeLogging()
	const client = new ZeebeGrpcClient()
	const res = await client.deployProcess(
		'./src/__tests__/testdata/hello-world.bpmn'
	)
	processId = res.processes[0].bpmnProcessId
	await cancelProcesses(processId)
	await client.close()
})

beforeEach(() => {
	zbc = new ZeebeGrpcClient()
})

afterEach(async () => {
	await zbc.close()
	await cancelProcesses(processId)
})

afterAll(async () => {
	restoreZeebeLogging()
	await cancelProcesses(processId)
})

test('Can get the broker topology', async () => {
	const res = await zbc.topology()
	expect(res?.brokers).toBeTruthy()
})

test('Can create a worker', async () => {
	const worker = zbc.createWorker({
		taskType: 'TASK_TYPE',
		taskHandler: (job) => job.complete(),
		loglevel: 'NONE',
	})
	expect(worker).toBeTruthy()
	await worker.close()
})

test('Can cancel a process', async () => {
	const client = new ZeebeGrpcClient()
	const process = await client.createProcessInstance({
		bpmnProcessId: processId,
		variables: {},
	})
	const key = process.processInstanceKey
	expect(key).toBeTruthy()
	await client.cancelProcessInstance(key)
	try {
		await client.cancelProcessInstance(key) // A call to cancel a process that doesn't exist should throw
	} catch (e: unknown) {
		expect(1).toBe(1)
	}
	await client.close()
})

test("does not retry to cancel a process instance that doesn't exist", async () => {
	// See: https://github.com/zeebe-io/zeebe/issues/2680
	// await zbc.cancelProcessInstance('123LoL')
	try {
		await zbc.cancelProcessInstance(2251799813686202)
	} catch (e: unknown) {
		expect((e as Error).message.indexOf('5 NOT_FOUND:')).toBe(0)
	}
	expect.assertions(1)
})
