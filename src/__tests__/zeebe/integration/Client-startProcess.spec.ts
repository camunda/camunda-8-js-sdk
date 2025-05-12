import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { CreateProcessInstanceResponse } from '../../../zeebe/lib/interfaces-grpc-1.0'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
jest.setTimeout(30000)

let zbc = new ZeebeGrpcClient()
let wf: CreateProcessInstanceResponse
let id: string | null
let bpmnProcessId: string
let bpmnProcessId2: string
let processKey: string
let processKey2: string

beforeAll(async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/hello-world.bpmn',
	})
	processKey = res.deployments[0].process.processDefinitionKey
	bpmnProcessId = res.deployments[0].process.bpmnProcessId
	const res2 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Client-SkipFirstTask.bpmn',
	})
	processKey2 = res2.deployments[0].process.processDefinitionKey
	bpmnProcessId2 = res2.deployments[0].process.bpmnProcessId
	await cancelProcesses(processKey)
	await cancelProcesses(processKey2)
	await zbc.close()
})

beforeEach(() => {
	zbc = new ZeebeGrpcClient()
})

afterEach(async () => {
	if (id) {
		await zbc.cancelProcessInstance(id).catch((_) => _)
		id = null
	}
	await zbc.close()
})

afterAll(async () => {
	if (id) {
		zbc.cancelProcessInstance(id).catch((_) => _)
		id = null
	}
	await zbc.close() // Makes sure we don't forget to close connection

	await cancelProcesses(processKey)
	await cancelProcesses(processKey2)
})

test('Can start a process', async () => {
	wf = await zbc.createProcessInstance({
		bpmnProcessId,
		variables: {},
	})
	await zbc.cancelProcessInstance(wf.processInstanceKey)
	expect(wf.bpmnProcessId).toBe(bpmnProcessId)
	expect(wf.processInstanceKey).toBeTruthy()
})

test('Can start a process at an arbitrary point', (done) => {
	const random = Math.random()
	const worker = zbc.createWorker({
		taskType: 'second_service_task',
		taskHandler: (job) => {
			expect(job.variables.id).toBe(random)
			return job.complete().then(finish)
		},
	})
	const finish = () => worker.close().then(() => done())
	zbc
		.createProcessInstance({
			bpmnProcessId: bpmnProcessId2,
			variables: { id: random },
			startInstructions: [{ elementId: 'second_service_task' }],
		})
		.then((res) => (id = res.processInstanceKey))
})
