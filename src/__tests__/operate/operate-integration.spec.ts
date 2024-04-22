import { LosslessNumber } from 'lossless-json'

import {
	HTTPError,
	RESTError,
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

jest.setTimeout(15000)
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
	await new Promise((res) => setTimeout(() => res(null), 12000))
	// Make sure that the process instance exists in Operate.
	const process = await c.getProcessInstance(p.processInstanceKey)
	// If this fails, it is probably a timing issue.
	// Operate is eventually consistent, so we need to wait a bit.
	expect(process.key).toBe(p.processInstanceKey)
	const res = await c.getJSONVariablesforProcess(p.processInstanceKey)
	expect(res.foo).toBe('bar')
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
		.catch((e: RESTError) => {
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
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				expect((e as any).statusCode).toBe(404)
			}
			expect(e instanceof HTTPError).toBe(true)
			return false
		})
	expect(res).toBe(false)
})
