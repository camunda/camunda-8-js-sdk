/**
 * This test works searchUserTasks, assignUserTask, and completeUserTask
 * It starts a process instance, waits for a user task to be available, assigns it to a user, and completes it.
 * It uses a polling mechanism to wait for the user task to be available.
 */
import path from 'node:path'

import { SearchUserTasksResponse } from 'c8/lib/C8Dto'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

jest.setTimeout(30000)

const c8 = new CamundaRestClient()
const testProcessId = 'completeUserTask-rest-test-process'
let processDefinitionId, processDefinitionKey

beforeAll(async () => {
	const res = await c8.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `${testProcessId}.bpmn`),
	])
	;({ processDefinitionId, processDefinitionKey } = res.processes[0])
})

test('It can complete a user task', async () => {
	// Start the process but don't await the final result yet
	const instancePromise = c8.createProcessInstanceWithResult({
		processDefinitionKey,
		variables: {},
	})

	// Give the process a moment to start and create the task
	// This could be replaced with a more robust polling mechanism
	await new Promise((resolve) => setTimeout(resolve, 500))

	// Poll until we find a task
	let availableTasks: SearchUserTasksResponse = {
		page: { totalItems: 0, lastSortValues: [], firstSortValues: [] },
		items: [],
	}
	const maxAttempts = 200
	let attempts = 0

	while (availableTasks?.items.length === 0 && attempts < maxAttempts) {
		attempts++
		availableTasks = await c8.searchUserTasks({
			filter: { processDefinitionId, state: 'CREATED' },
		})

		if (availableTasks.items.length === 0) {
			// Wait 200ms before trying again
			await new Promise((resolve) => setTimeout(resolve, 200))
		}
	}

	if (availableTasks.items.length === 0) {
		throw new Error('No user tasks became available after polling')
	}

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
