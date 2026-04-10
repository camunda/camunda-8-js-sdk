import { randomUUID } from 'crypto'

import { CamundaRestClient, PollingOperation } from '../../'
import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()
vi.setConfig({ testTimeout: 30_000 })

let wfi: CreateProcessInstanceResponse<unknown>

afterAll(async () => {
	if (wfi) {
		await c8.cancelProcessInstance({
			processInstanceKey: wfi.processInstanceKey,
		})
	}
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can retrieve the variables for a user task', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/test-tasks-query.bpmn',
		'./src/__tests__/testdata/form/test-basic-form.form',
	])
	const key = res.processes[0].processDefinitionKey
	const id = res.processes[0].processDefinitionId
	const uuid = randomUUID()
	wfi = await c8.createProcessInstance({
		processDefinitionId: id,
		variables: {
			queryTag: uuid,
		},
	})
	expect(wfi.processDefinitionKey).toBe(key)

	// Search user tasks
	const tasks = await PollingOperation({
		operation: () =>
			c8.searchUserTasks({
				page: {
					from: 0,
					limit: 10,
				},
				filter: {
					state: 'CREATED',
					processInstanceKey: wfi.processInstanceKey,
				},
				sort: [
					{
						field: 'creationDate',
					},
				],
			}),
		interval: 500,
		timeout: 7000,
	})
	expect(tasks.items[0].processInstanceKey).toBe(wfi.processInstanceKey)
	const task = await PollingOperation({
		operation: () => c8.getUserTask(tasks.items[0].userTaskKey),
		predicate: (res) => res.processInstanceKey === wfi.processInstanceKey,
	})
	expect(task.processInstanceKey).toBe(wfi.processInstanceKey)
	const variables = await PollingOperation({
		operation: () =>
			c8.searchUserTaskVariables({
				userTaskKey: tasks.items[0].userTaskKey,
				sort: [{ field: 'name', order: 'ASC' }],
			}),
	})
	expect(variables.items[0].value).toBe(`"${uuid}"`)
})
