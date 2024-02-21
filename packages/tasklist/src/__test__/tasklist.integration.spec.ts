import { join } from 'path'

import { CreateProcessInstanceResponse, DeployProcessResponse, ZBClient } from '@camunda8/zeebe'

import 'dotenv/config'
import { TasklistApiClient } from '../index'

jest.setTimeout(25000) // increase timeout to allow Tasklist application to create tasks

let p: CreateProcessInstanceResponse | null
let def: DeployProcessResponse

const delay = (ms: number) => new Promise((resolve) => setTimeout(() => resolve(null), ms))

process.env.DEBUG = 'camunda:token' // @DEBUG

describe('TasklistApiClient', () => {
    const zbc = new ZBClient({
        loglevel: 'NONE',
    })

    beforeAll(async () => {
        const bpmnFilePath = join(process.cwd(), 'src', '__test__', 'resources', 'TasklistTestProcess.bpmn')
        def = await zbc.deployProcess(bpmnFilePath)
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
        await delay(10000) // we wait here to allow Tasklist to do its thing
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
            const tasks = await tasklist.getAllTasks()
            expect(tasks.length).toBeGreaterThan(0)
        })

        it('can request a task with parameters', async () => {
            const tasklist = new TasklistApiClient()
            const tasks = await tasklist.getTasks({
                state: 'CREATED',
            })
            expect(tasks.length).toBeGreaterThan(0)
        })

        it('gets all fields for a task', async () => {
            const tasklist = new TasklistApiClient()
            const tasks = await tasklist.getTasks({
                state: 'CREATED',
            })
            expect(tasks.length).toBeGreaterThan(0)
            expect(tasks[0].name).toBeTruthy()
            expect(tasks[0].processName).toBeTruthy()
        })

        it('can request a specific task', async () => {
            const tasklist = new TasklistApiClient()
            const tasks = await tasklist.getTasks({
                state: 'CREATED',
            })
            const id = tasks[0].id
            const task = await tasklist.getTask(id)
            expect(task.id).toBe(id)
        })

        it('can retrieve an embedded form', async () => {
            const tasklist = new TasklistApiClient()
            const res = await tasklist.getForm('userTaskForm_3r97fja', def.processes[0].processDefinitionKey)
            expect(res.id).toBe('userTaskForm_3r97fja')
        })
    })

    describe('Write operations', () => {
        it('can claim a task', async () => {
            const tasklist = new TasklistApiClient()
            const tasks = await tasklist.getTasks({ state: 'CREATED' })
            const taskid = tasks[0].id
            expect(tasks.length).toBeGreaterThan(0)
            const claimTask = await tasklist.assignTask({ taskId: taskid, assignee: 'jwulf' })
            expect(claimTask.id).toBe(taskid)
        })

        it('will not allow a task to be claimed twice', async () => {
            const tasklist = new TasklistApiClient()
            console.log('Zeebe Client ID', process.env.ZEEBE_CLIENT_ID)
            console.log('Zeebe Client Secret', process.env.ZEEBE_CLIENT_SECRET)

            const tasks = await tasklist.getTasks({ state: 'CREATED' })
            console.log('Tasks', JSON.stringify(tasks, null, 2))
            const task = await tasklist.assignTask({ taskId: tasks[0].id, assignee: 'jwulf' })
            console.log('Task', JSON.stringify(task, null, 2))
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
            // const creds = {
            //     authServerUrl: process.env.CAMUNDA_OAUTH_URL!,
            //     clientId: process.env.ZEEBE_CLIENT_ID!,
            //     clientSecret: process.env.ZEEBE_CLIENT_SECRET!,
            //     audience: process.env.ZEEBE_TOKEN_AUDIENCE!,
            //     scopes: process.env.CAMUNDA_CREDENTIALS_SCOPES!,
            //     tokenUrl: process.env.CAMUNDA_OAUTH_TOKEN_URL!,
            // }
            // const oAuth = new OAuthProviderImpl({ ...creds, userAgentString: 'test' })
            const tasklist = new TasklistApiClient(/*{ oauthProvider: oAuth }*/)
            const tasks = await tasklist.getTasks({ state: 'CREATED' })
            const taskId = tasks[0].id
            const task = await tasklist.assignTask({ taskId: taskId, assignee: 'jwulf', allowOverrideAssignment: false })

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
            // const creds = {
            //     authServerUrl: process.env.CAMUNDA_OAUTH_URL!,
            //     clientId: process.env.ZEEBE_CLIENT_ID!,
            //     clientSecret: process.env.ZEEBE_CLIENT_SECRET!,
            //     audience: process.env.ZEEBE_TOKEN_AUDIENCE!,
            //     scopes: process.env.CAMUNDA_CREDENTIALS_SCOPES!,
            //     tokenUrl: process.env.CAMUNDA_OAUTH_TOKEN_URL!,
            // }
            // const oAuth = new OAuthProviderImpl({ ...creds, userAgentString: 'test' })
            const tasklist = new TasklistApiClient(/*{ oauthProvider: oAuth }*/)
            console.log('Can complete a Task')
            // console.log(creds)
            const tasks = await tasklist.getTasks({ state: 'CREATED' })
            const taskid = tasks[0].id
            expect(tasks.length).toBeGreaterThan(0)
            const completeTask = await tasklist.completeTask(taskid, { outcome: 'approved', fruits: ['apple', 'orange'] })
            expect(completeTask.id).toBe(taskid)
            expect(completeTask.taskState).toEqual('COMPLETED')
            p = null
        })
    })
})
