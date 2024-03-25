import { join } from 'path'

import { OperateApiClient } from 'operate'
import {
	CreateProcessInstanceResponse,
	DeployResourceResponse,
	ProcessDeployment,
} from 'zeebe/types'

import { TasklistApiClient } from '../../tasklist/index'
import { ZeebeGrpcClient } from '../../zeebe'

jest.setTimeout(25000) // increase timeout to allow Tasklist application to create tasks

let p: CreateProcessInstanceResponse | null
let def: DeployResourceResponse<ProcessDeployment>

const delay = (ms: number) =>
	new Promise((resolve) => setTimeout(() => resolve(null), ms))

describe('TasklistApiClient', () => {
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

	beforeEach(async () => {
		p = await zbc.createProcessInstance({
			bpmnProcessId: 'TasklistTestProcess',
			variables: {
				name: 'Joe Bloggs',
				age: 42,
				interests: ['golf', 'frisbee'],
			},
		})
		await delay(13000) // we wait here to allow Tasklist to do its thing
	})

	afterEach(async () => {
		if (p && p.processInstanceKey) {
			await zbc.cancelProcessInstance(p.processInstanceKey)
		}
	})

	afterAll(() => zbc.close())

	describe('Read operations', () => {
		it('can request all tasks', async () => {
			const tasklist = new TasklistApiClient()
			const tasks = await tasklist.searchTasks({})
			expect(tasks.length).toBeGreaterThan(0)
		})

		it('can request a task with parameters', async () => {
			const tasklist = new TasklistApiClient()
			const tasks = await tasklist.searchTasks({
				state: 'CREATED',
			})
			expect(tasks.length).toBeGreaterThan(0)
		})

		it('gets all fields for a task', async () => {
			const tasklist = new TasklistApiClient()
			const tasks = await tasklist.searchTasks({
				state: 'CREATED',
			})
			expect(tasks.length).toBeGreaterThan(0)
			expect(tasks[0].name).toBeTruthy()
			expect(tasks[0].processName).toBeTruthy()
		})

		it('can request a specific task', async () => {
			const tasklist = new TasklistApiClient()
			const tasks = await tasklist.searchTasks({
				state: 'CREATED',
			})
			const id = tasks[0].id
			const task = await tasklist.getTask(id)
			expect(task.id).toBe(id)
		})

		it('can retrieve an embedded form', async () => {
			const tasklist = new TasklistApiClient()
			const res = await tasklist.getForm(
				'userTaskForm_3r97fja',
				def.deployments[0].process.processDefinitionKey
			)
			expect(res.id).toBe('userTaskForm_3r97fja')
		})
	})

	describe('Write operations', () => {
		it('can claim a task', async () => {
			const tasklist = new TasklistApiClient()
			expect(p).toBeTruthy()
			const operate = new OperateApiClient()
			const res = await operate
				.getProcessInstance(p!.processInstanceKey)
				.catch((e) => {
					console.log('Error getting process instance', e)
				})
			expect(res).toBeTruthy()
			const tasks = await tasklist.searchTasks({ state: 'CREATED' })
			const taskid = tasks[0].id
			expect(tasks.length).toBeGreaterThan(0)
			const claimTask = await tasklist.assignTask({
				taskId: taskid,
				assignee: 'jwulf',
			})
			expect(claimTask.id).toBe(taskid)
		})

		it('will not allow a task to be claimed twice', async () => {
			const tasklist = new TasklistApiClient()

			const tasks = await tasklist.searchTasks({ state: 'CREATED' })
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
			expect(threw).toBe(true)
		})

		it('can unclaim task', async () => {
			const tasklist = new TasklistApiClient(/*{ oauthProvider: oAuth }*/)
			const tasks = await tasklist.searchTasks({ state: 'CREATED' })
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
			expect(claimTask.id).toEqual(taskId)
		})

		it('can complete a Task', async () => {
			const tasklist = new TasklistApiClient(/*{ oauthProvider: oAuth }*/)
			const tasks = await tasklist.searchTasks({ state: 'CREATED' })
			const taskid = tasks[0].id
			expect(tasks.length).toBeGreaterThan(0)
			const completeTask = await tasklist.completeTask(taskid, {
				outcome: 'approved',
				fruits: ['apple', 'orange'],
			})
			expect(completeTask.id).toBe(taskid)
			expect(completeTask.taskState).toEqual('COMPLETED')
			p = null
		})
	})
})
