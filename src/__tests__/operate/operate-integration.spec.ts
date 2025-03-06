import { LosslessNumber } from 'lossless-json'

import {
	HTTPError,
	RestError,
	restoreZeebeLogging,
	suppressZeebeLogging,
} from '../../lib'
import { OperateApiClient } from '../../operate'
import { ProcessDefinition, Query } from '../../operate/lib/OperateDto'
import { ZeebeGrpcClient } from '../../zeebe'

suppressZeebeLogging()

afterAll(async () => {
	restoreZeebeLogging()
})

jest.setTimeout(20000)
describe('Operate Integration', () => {
	xtest('It can get the Incident', async () => {
		const c = new OperateApiClient()

		const res = await c.searchIncidents({
			filter: {
				processInstanceKey: new LosslessNumber('2251799816400111'),
			},
		})
		console.log(JSON.stringify(res, null, 2))
		expect(res.total).toBe(1)
	})
	xtest('It can search process definitions', async () => {
		const c = new OperateApiClient()

		const query: Query<ProcessDefinition> = {
			filter: {},
			size: 5,
			sort: [
				{
					field: 'bpmnProcessId',
					order: 'ASC',
				},
			],
		}
		const defs = await c.searchProcessDefinitions(query)
		expect(defs.total).toBeGreaterThanOrEqual(0)
	})
})

test('getJSONVariablesforProcess works', async () => {
	const c = new OperateApiClient()
	const zeebe = new ZeebeGrpcClient()
	await zeebe.deployResource({
		processFilename: 'src/__tests__/testdata/Operate-StraightThrough.bpmn',
	})
	const p = await zeebe.createProcessInstanceWithResult({
		bpmnProcessId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
		},
	})

	// Wait for Operate to catch up.
	// Make sure that the process instance exists in Operate.
	// Operate is eventually consistent, so we need to wait a bit.
	const maxRetries = 15
	const delay = 1000
	let process

	for (let i = 0; i < maxRetries; i++) {
		process = await c.getProcessInstance(p.processInstanceKey).catch(() => null)
		if (process) break
		await new Promise((res) => setTimeout(res, delay))
	}
	if (!process) {
		throw new Error('Process instance not found within the timeout period')
	}

	// If this fails, it is probably a timing issue.
	expect(process.key).toBe(p.processInstanceKey)
	const res = await c.getJSONVariablesforProcess(p.processInstanceKey)
	expect(res.foo).toBe('bar')
})

test('getVariablesforProcess paging works', async () => {
	const c = new OperateApiClient()
	const zeebe = new ZeebeGrpcClient()
	await zeebe.deployResource({
		processFilename: 'src/__tests__/testdata/Operate-StraightThrough.bpmn',
	})
	const p = await zeebe.createProcessInstanceWithResult({
		bpmnProcessId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
			foo1: 'bar1',
			foo2: 'bar2',
			foo3: 'bar3',
			foo4: 'bar4',
			foo5: 'bar5',
			foo6: 'bar6',
			foo7: 'bar7',
			foo8: 'bar8',
			foo9: 'bar9',
			foo10: 'bar10',
		},
	})

	// Wait for Operate to catch up.
	// Make sure that the process instance exists in Operate.
	// Operate is eventually consistent, so we need to wait a bit.
	const maxRetries = 15
	const delay = 1000
	let process

	for (let i = 0; i < maxRetries; i++) {
		process = await c.getProcessInstance(p.processInstanceKey).catch(() => null)
		if (process) break
		await new Promise((res) => setTimeout(res, delay))
	}
	if (!process) {
		throw new Error('Process instance not found within the timeout period')
	}

	expect(process.key).toBe(p.processInstanceKey)
	const res = await c.getVariablesforProcess(p.processInstanceKey, { size: 5 })
	expect(res.items[0].name).toBe('foo')
	const nextPage = await c.getVariablesforProcess(p.processInstanceKey, {
		size: 5,
		searchAfter: res.sortValues,
	})
	expect(nextPage.items[0].name).toBe('foo4')
})

test('test error type', async () => {
	const c = new OperateApiClient()
	const zeebe = new ZeebeGrpcClient()
	await zeebe.deployResource({
		processFilename: 'src/__tests__/testdata/Operate-StraightThrough.bpmn',
	})
	const p = await zeebe.createProcessInstanceWithResult({
		bpmnProcessId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
		},
	})
	await new Promise((res) => setTimeout(() => res(null), 5000))
	/**
	 * Here we request a process instance that doesn't exist.
	 * Understanding that this is the issue requires a bit of gymnastics by the consumer.
	 * This call may fail due to lack of permissions, a network error (including misconfiguration), or the process instance not existing.
	 * To rule out the other issues and focus on the process instance not existing, we need to catch the error and check the response body.
	 * (e.response?.body as string).includes('404') will return true if the response body contains the string '404'.
	 * This is a bit of a hack, but it's the best we can do without a more specific error type.
	 * Do we really want to expose consumers to this?
	 */
	const res = await c
		.getProcessInstance(`${p.processInstanceKey}1`)
		.catch((e: RestError) => {
			// console.log(e.code)
			// `ERR_NON_2XX_3XX_RESPONSE`

			// console.log(e.message)
			// `Response code 404 (Not Found) (request to http://localhost:8081/v1/process-instances/22517998149629301)`
			// Note: The request url has been enhanced into the message by a hook.

			// console.log(e.response?.body)
			// `{"status":404,"message":"No process instances found for key 22517998149629301 ","instance":"76807bf1-d877-4f8e-bd0d-6d953b1799e5","type":"Requested resource not found"}`

			// console.log(typeof e.response?.body)
			// `string`
			expect((e.response?.body as string).includes('404')).toBe(true)
			if (e instanceof HTTPError) {
				expect(e.statusCode).toBe(404)
			}
			expect(e instanceof HTTPError).toBe(true)
			return false
		})
	expect(res).toBe(false)
})
