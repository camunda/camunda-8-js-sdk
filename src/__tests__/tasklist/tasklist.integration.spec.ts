import { join } from 'path'

import { PollingOperation } from '../../lib/PollingOperation'
import { OperateApiClient } from '../../operate'
import { TasklistApiClient } from '../../tasklist/index'
import { ZeebeGrpcClient } from '../../zeebe'
import { DeployResourceResponse, ProcessDeployment } from '../../zeebe/types'

jest.setTimeout(15000) // increase timeout to allow Tasklist application to create tasks

let def: DeployResourceResponse<ProcessDeployment>

const zbc = new ZeebeGrpcClient({
	config: { zeebeGrpcSettings: { ZEEBE_CLIENT_LOG_LEVEL: 'NONE' } },
})

beforeAll(async () => {
	const bpmnFilePath = join(
		process.cwd(),
		'src',
		'__tests__',
		'testdata',
		'TasklistTestProcess.bpmn'
	)
	def = await zbc.deployResource({ processFilename: bpmnFilePath })
})

afterAll(() => zbc.close())

test('Tasklist can request all tasks', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () => tasklist.searchTasks({}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(tasks.length).toBeGreaterThan(0)
})

test('Tasklist can search for a task by process instance key', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
				processInstanceKey: p.processInstanceKey,
			}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(tasks.length).toBeGreaterThan(0)
})

test('Tasklist gets all fields for a task', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
				processInstanceKey: p.processInstanceKey,
			}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(tasks.length).toBeGreaterThan(0)
	expect(tasks[0].name).toBeTruthy()
	expect(tasks[0].processName).toBeTruthy()
})

test('Tasklist can request a specific task', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
				processInstanceKey: p.processInstanceKey,
			}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	const id = tasks[0].id
	const task = await tasklist.getTask(id)
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(task.id).toBe(id)
})

test('Tasklist can retrieve an embedded form', async () => {
	const tasklist = new TasklistApiClient()
	const res = await PollingOperation({
		operation: () =>
			tasklist.getForm(
				'userTaskForm_3r97fja',
				def.deployments[0].process.processDefinitionKey
			),
		predicate: (result) => result.id === 'userTaskForm_3r97fja',
		interval: 500,
		timeout: 13000,
	})
	expect(res.id).toBe('userTaskForm_3r97fja')
})

test('Tasklist can claim a task', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	expect(p).toBeTruthy()
	const operate = new OperateApiClient()
	const res = await PollingOperation({
		operation: () => operate.getProcessInstance(p!.processInstanceKey),
		predicate: (result) => result.key === p!.processInstanceKey,
		interval: 500,
		timeout: 13000,
	})
	expect(res).toBeTruthy()
	const tasks = await PollingOperation({
		operation: () => tasklist.searchTasks({ state: 'CREATED' }),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	const taskid = tasks[0].id
	expect(tasks.length).toBeGreaterThan(0)
	const claimTask = await tasklist.assignTask({
		taskId: taskid,
		assignee: 'jwulf',
	})
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(claimTask.id).toBe(taskid)
})

test('Tasklist will not allow a task to be claimed twice', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()

	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
				processInstanceKey: p.processInstanceKey,
			}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	const task = await tasklist.assignTask({
		taskId: tasks[0].id,
		assignee: 'jwulf',
	})
	expect(task).toBeTruthy()
	let threw = false
	try {
		await tasklist.assignTask({
			taskId: tasks[0].id,
			assignee: 'jwulf0',
			allowOverrideAssignment: false,
		})
	} catch (e) {
		threw = true
	}
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(threw).toBe(true)
})

test('Tasklist can unclaim task', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
				processInstanceKey: p.processInstanceKey,
			}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	const taskId = tasks[0].id
	const task = await tasklist.assignTask({
		taskId: taskId,
		assignee: 'jwulf',
		allowOverrideAssignment: false,
	})

	expect(task).toBeTruthy()
	let threw = false
	try {
		await tasklist.assignTask({
			taskId: taskId,
			assignee: 'jwulf0',
			allowOverrideAssignment: false,
		})
	} catch {
		threw = true
	}
	expect(threw).toBe(true)
	await tasklist.unassignTask(taskId)
	const claimTask = await tasklist.assignTask({
		taskId,
		assignee: 'jwulf0',
		allowOverrideAssignment: false,
	})
	await zbc.cancelProcessInstance(p.processInstanceKey)
	expect(claimTask.id).toEqual(taskId)
})

test('Tasklist can complete a Task', async () => {
	const p = await zbc.createProcessInstance({
		bpmnProcessId: 'TasklistTestProcess',
		variables: {
			name: 'Joe Bloggs',
			age: 42,
			interests: ['golf', 'frisbee'],
		},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
				processInstanceKey: p.processInstanceKey,
			}),
		predicate: (result) => result.length > 0,
		interval: 500,
		timeout: 13000,
	})
	const taskid = tasks[0].id
	expect(tasks.length).toBeGreaterThan(0)
	const completeTask = await tasklist.completeTask(taskid, {
		outcome: 'approved',
		fruits: ['apple', 'orange'],
	})
	await zbc.cancelProcessInstance(p.processInstanceKey).catch((e) => e) // ignore error if process instance already completed
	expect(completeTask.id).toBe(taskid)
	expect(completeTask.taskState).toEqual('COMPLETED')
})
