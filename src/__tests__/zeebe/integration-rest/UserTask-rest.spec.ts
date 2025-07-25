import { PollingOperation } from '../../../'
import { TasklistApiClient } from '../../../tasklist'
import { ZeebeGrpcClient, ZeebeRestClient } from '../../../zeebe'

jest.setTimeout(30000)

test('can update a task', async () => {
	const grpc = new ZeebeGrpcClient()

	await grpc.deployResource({
		processFilename: './src/__tests__/testdata/zeebe-user-task.bpmn',
	})
	await grpc.createProcessInstance({
		bpmnProcessId: 'zeebe-user-task-test',
		variables: {},
	})
	const tasklist = new TasklistApiClient()
	const tasks = await PollingOperation({
		operation: () =>
			tasklist.searchTasks({
				state: 'CREATED',
			}),
		predicate: (tasks) => tasks.length > 0,
		interval: 100,
		timeout: 10000,
	})
	const zbc = new ZeebeRestClient()
	const res = await zbc.completeUserTask({
		userTaskKey: tasks[0].id,
	})
	expect(res.statusCode).toBe(204)
	const res2 = await zbc
		.completeUserTask({
			userTaskKey: '2251799814261421',
		})
		.catch((e) => {
			return e
		})
	expect(res2.statusCode).toBe(404)
})
