import { LosslessNumber } from 'lossless-json'
import { describe, expect, test, vi } from 'vitest'

import { HTTPError } from '../../lib'
import { PollingOperation } from '../../lib/PollingOperation'
import { OperateApiClient } from '../../operate'
import { ProcessDefinition, Query } from '../../operate/lib/OperateDto'
import { matrix } from '../../test-support/testTags'
import { ZeebeGrpcClient } from '../../zeebe'

vi.setConfig({ testTimeout: 20_000 })
describe('Operate Integration', () => {
	test.skip('It can get the Incident', async () => {
		const c = new OperateApiClient()

		const res = await c.searchIncidents({
			filter: {
				processInstanceKey: new LosslessNumber('2251799816400111'),
			},
		})
		expect(res.total).toBe(1)
	})
	test.skip('It can search process definitions', async () => {
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

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured', 'unsecured'],
		},
		exclude: [{ version: '8.8', deployment: 'self-managed' }],
	})
)('getJSONVariablesforProcess works', async () => {
	const c = new OperateApiClient()
	const zeebe = new ZeebeGrpcClient()
	const _res = await zeebe.deployResource({
		processFilename: 'src/__tests__/testdata/Operate-StraightThrough.bpmn',
	})
	const p = await zeebe.createProcessInstanceWithResult({
		bpmnProcessId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
		},
	})

	const process = await PollingOperation({
		operation: () => c.getProcessInstance(p.processInstanceKey),
		predicate: (res) => res.key === p.processInstanceKey,
		interval: 500,
		timeout: 15000,
	})

	expect(process.key).toBe(p.processInstanceKey)
	// We need to wait further for the variables to be populated in Operate
	const res = await PollingOperation({
		operation: () => c.getJSONVariablesforProcess(p.processInstanceKey),
		predicate: (r) => !!r.foo,
		interval: 500,
		timeout: 5000,
	})

	expect(res.foo).toBe('bar')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured', 'unsecured'],
		},
		exclude: [{ version: '8.8', deployment: 'self-managed' }],
	})
)('getVariablesforProcess paging works', async () => {
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
	const process = await PollingOperation({
		operation: () => c.getProcessInstance(p.processInstanceKey),
		predicate: (res) => res.key === p.processInstanceKey,
		interval: 500,
		timeout: 15000,
	})

	expect(process.key).toBe(p.processInstanceKey)
	// We need to wait further for the variables to be populated in Operate
	const res = await PollingOperation({
		operation: () =>
			c.getVariablesforProcess(p.processInstanceKey, { size: 5 }),
		interval: 500,
		timeout: 5000,
	})
	expect(res.items[0].name).toBe('foo')
	const nextPage = await PollingOperation({
		operation: () =>
			c.getVariablesforProcess(p.processInstanceKey, {
				size: 5,
				searchAfter: res.sortValues,
			}),
	})
	expect(nextPage.items[0].name).toBe('foo4')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured', 'unsecured'],
		},
		exclude: [{ version: '8.8', deployment: 'self-managed' }],
	})
)('test error type', async () => {
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
	 * This should throw a 404 error.
	 */
	const res = await c
		.getProcessInstance(`${p.processInstanceKey}1`)
		.catch((e) => {
			expect((e.response?.body as string).includes('404')).toBe(true)
			if (e instanceof HTTPError) {
				expect(e.statusCode).toBe(404)
			}
			expect(e instanceof HTTPError).toBe(true)
			return false
		})
	await zeebe.cancelProcessInstance(p.processInstanceKey).catch((e) => e) // Cleanup the process instance, but it should not exist anymore.
	expect(res).toBe(false)
})
