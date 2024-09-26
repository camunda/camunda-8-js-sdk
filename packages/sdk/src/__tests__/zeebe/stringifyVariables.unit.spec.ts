import {
	parseVariables,
	stringifyVariables,
} from '../../zeebe/lib/stringifyVariables'

// tslint:disable:object-literal-sort-keys
const jobObject = {
	key: '37274',
	jobHeaders: {
		bpmnProcessId: 'parallel-subtasks',
		elementId: 'ServiceTask_0i7cog1',
		elementInstanceKey: '37270',
		workflowDefinitionVersion: 1,
		workflowInstanceKey: '34027',
		workflowKey: '1',
	},
	customHeaders: {},
	worker: '26fe8907-f518-4f8d-bd75-06acaec3c154',
	retries: 3,
	deadline: '1547595187455',
	variables: {
		jobId: '7ead71d8-30c9-4eda-81e7-f2ada6d7d0da',
		subtaskCount: 200,
		tasksCompleted: null,
	},
	type: 'sub-task',
}

const expectedStringifiedVariables =
	'{"jobId":"7ead71d8-30c9-4eda-81e7-f2ada6d7d0da","subtaskCount":200,"tasksCompleted":null}'

const jobDictionary = {
	key: '37274',
	customHeaders: {},
	worker: '26fe8907-f518-4f8d-bd75-06acaec3c154',
	retries: 3,
	deadline: '1547595187455',
	variables:
		'{"jobId":"7ead71d8-30c9-4eda-81e7-f2ada6d7d0da","subtaskCount":200,"tasksCompleted":null}',
	type: 'sub-task',
}

test('stringifyVariables returns a new object', () => {
	expect(stringifyVariables(jobObject)).not.toEqual(jobObject)
})

test('stringifyVariables stringifies the variables key of a job object', () => {
	const stringified = stringifyVariables(jobObject)
	expect(typeof stringified.variables).toBe('string')
	expect(stringified.variables).toBe(expectedStringifiedVariables)
})

test('stringifyVariables throws an error when passed an array', () => {
	const arrayInput = { variables: ['something'] }
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expect(() => stringifyVariables(arrayInput as any)).toThrow(Error)
})

test('parseVariables returns a new object', () => {
	expect(parseVariables(jobDictionary)).not.toEqual(jobDictionary)
})

test('parseVariables parses the payload key of a job object to JSON', () => {
	expect(typeof parseVariables(jobDictionary).variables).toBe('object')
})

test('parseVariables correctly parses the payload string', () => {
	const parsed = parseVariables(jobDictionary)
	expect(parsed.variables.jobId).toEqual('7ead71d8-30c9-4eda-81e7-f2ada6d7d0da')
	expect(parsed.variables.subtaskCount).toEqual(200)
	expect(parsed.variables.tasksCompleted).toBeNull()
	expect(Object.keys(parsed.variables).length).toBe(3)
})

test('parseVariables returns an object with all the keys of the original', () => {
	const parsed = parseVariables(jobDictionary)
	expect(Object.keys(parsed).length).toBe(7)
	expect(parsed.key).toBe('37274')
	expect(parsed.worker).toBe('26fe8907-f518-4f8d-bd75-06acaec3c154')
})
