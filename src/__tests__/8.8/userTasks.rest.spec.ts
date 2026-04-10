/**
 * This test works searchUserTasks, assignUserTask, and completeUserTask
 * It starts a process instance, waits for a user task to be available, assigns it to a user, and completes it.
 * It uses a polling mechanism to wait for the user task to be available.
 */
import path from 'node:path'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { PollingOperation } from '../../lib/PollingOperation'
import { matrix } from '../../test-support/testTags'

vi.setConfig({ testTimeout: 30_000 })

const c8 = new CamundaRestClient()
const testProcessId = 'completeUserTask-rest-test-process'
let processDefinitionId, processDefinitionKey

beforeAll(async () => {
	const res = await c8.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `${testProcessId}.bpmn`),
	])
	;({ processDefinitionId, processDefinitionKey } = res.processes[0])
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
)('It can complete a user task', async () => {
	// Start the process but don't await the final result yet
	const instancePromise = c8.createProcessInstanceWithResult({
		processDefinitionKey,
		variables: {},
	})

	const availableTasks = await PollingOperation({
		operation: () =>
			c8.searchUserTasks({
				filter: { processDefinitionId, state: 'CREATED' },
			}),
		interval: 500,
		timeout: 10000,
	})

	await c8.assignUserTask({
		userTaskKey: availableTasks.items[0].userTaskKey,
		assignee: 'demo',
	})
	await c8.completeUserTask({
		userTaskKey: availableTasks.items[0].userTaskKey,
	})

	// Now wait for the process to complete
	const instance = await instancePromise

	expect(instance).toBeDefined()
})
