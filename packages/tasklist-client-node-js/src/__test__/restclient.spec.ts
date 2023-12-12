import { TaskState } from '../lib/Types'
import { TasklistRESTClient } from './../index'
import { join } from 'path'
import { CreateProcessInstanceResponse, DeployProcessResponse, ZBClient } from 'zeebe-node'
import 'dotenv/config'

jest.setTimeout(25000) // increase timeout to allow Tasklist application to create tasks

let p: CreateProcessInstanceResponse
let def: DeployProcessResponse

const delay = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(null), ms))
describe('TasklistRESTClient', () => {
    const zbc = new ZBClient({
        loglevel: 'NONE',
    })

    beforeAll(async () => {
        const bpmnFilePath = join(process.cwd(), 'src', '__test__', 'resources', 'TasklistTestProcess.bpmn')
        console.log(`Deploying ${bpmnFilePath}...`)
        def = await zbc.deployProcess(bpmnFilePath)
        console.log(`Deployed ${def.processes[0].bpmnProcessId}`)
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
        console.log(`Created instance ${p.processInstanceKey}`)
        console.log(`Waiting for 10s for Tasklist to do its thing`)
        await delay(10000) // we wait here to allow Tasklist to do its thing
    })

    afterEach(async () => {
        if (p && p.processInstanceKey) {
            await zbc.cancelProcessInstance(p.processInstanceKey)
        }
    })

    afterAll(() => zbc.close())

    it('can request all tasks', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getAllTasks()
        console.log('tasks', tasks)
        expect(tasks.length).toBeGreaterThan(0)
    })

    it('can request a task with parameters', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({
            state: TaskState.CREATED,
        })
        expect(tasks.length).toBeGreaterThan(0)
    })

    it('can request tasks with fields', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({
            state: TaskState.CREATED,
        })
        expect(tasks.length).toBeGreaterThan(0)
        expect(tasks[0].name).not.toBeDefined()
        expect(tasks[0].processName).toBeTruthy()
    })

    it('can request tasks with all fields', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({
            state: TaskState.CREATED,
        })
        expect(tasks.length).toBeGreaterThan(0)
        expect(tasks[0].processName).toBeTruthy()
    })

    it('can request a specific task', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({
            state: TaskState.CREATED,
        })
        const id = tasks[0].id
        const task = await tasklist.getTask(id)
        expect(task.id).toBe(id)
    })

    it('can retrieve an embedded form', async () => {
        const tasklist = new TasklistRESTClient()
        const res = await tasklist.getForm('userTaskForm_3r97fja', def.processes[0].processDefinitionKey)
        expect(res.form.id).toBe('userTaskForm_3r97fja')
    })

    it('can claim a task', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({ state: TaskState.CREATED })
        const taskid = tasks[0].id
        expect(tasks.length).toBeGreaterThan(0)
        const claimTask = await tasklist.assignTask({ taskId: taskid, assignee: 'jwulf' })
        expect(claimTask.id).toBe(taskid)
    })

    it('will not allow a task to be claimed twice', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({ state: TaskState.CREATED })
        const task = await tasklist.assignTask({ taskId: tasks[0].id, assignee: 'jwulf' })
        expect(task).toBeTruthy()
        let threw = false
        try {
            await tasklist.assignTask({ taskId: tasks[0].id, assignee: 'jwulf0', allowOverrideAssignment: false })
        } catch (e) {
            threw = true
        }
        expect(threw).toBe(true)
    })

    it('can unclaim task', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({ state: TaskState.CREATED })
        const taskId = tasks[0].id
        const task = await tasklist.assignTask({ taskId: taskId, assignee: 'jwulf' })
        expect(task).toBeTruthy()
        let threw = false
        try {
            await tasklist.assignTask({ taskId: taskId, assignee: 'jwulf0', allowOverrideAssignment: false })
        } catch {
            threw = true
        }
        expect(threw).toBe(true)
        await tasklist.unassignTask(taskId)
        const claimTask = await tasklist.assignTask({ taskId, assignee: 'jwulf0', allowOverrideAssignment: false })
        expect(claimTask.id).toEqual(taskId)
    })

    it('can complete a Task', async () => {
        const tasklist = new TasklistRESTClient()
        const tasks = await tasklist.getTasks({ state: TaskState.CREATED })
        const taskid = tasks[0].id
        expect(tasks.length).toBeGreaterThan(0)
        const completeTask = await tasklist.completeTask(taskid, { outcome: 'approved', fruits: ['apple', 'orange'] })
        expect(completeTask.id).toBe(taskid)
        p = null as any
    })

    it('can complete a task with variables', (done) => {
        const tasklist = new TasklistRESTClient()
        zbc.createProcessInstanceWithResult({
            bpmnProcessId: 'TasklistTestProcess',
            variables: {
                name: 'Joe Bloggs',
                age: 42,
                interests: ['golf', 'frisbee'],
            },
        }).then((res) => {
            console.log(res)
            p = null as any
            done()
        })
        delay(10000)
            .then(() => tasklist.getTasks({ state: TaskState.CREATED }))
            .then((tasks) =>
                tasks.forEach((task) =>
                    tasklist.completeTask(task.id, {
                        outcome: 'approved',
                        fruits: ['apple', 'orange'],
                    })
                )
            )
    })
})
