import { LosslessNumber } from 'lossless-json'

import { OperateApiClient } from '../../operate'
import { ProcessDefinition, Query } from '../../operate/lib/OperateDto'
import { ZeebeGrpcClient } from '../../zeebe'

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
	const c = new OperateApiClient({ config: { CAMUNDA_OAUTH_DISABLED: true } })
	const zeebe = new ZeebeGrpcClient({
		config: { CAMUNDA_OAUTH_DISABLED: true },
	})
	await zeebe.deployResource({
		processFilename: 'src/__tests__/testdata/operate-straightthrough.bpmn',
	})
	const p = await zeebe.createProcessInstanceWithResult({
		bpmnProcessId: 'operate-straightthrough',
		variables: {
			foo: 'bar',
		},
	})
	await new Promise((res) => setTimeout(() => res(null), 5000))
	const res = await c.getJSONVariablesforProcess(p.processInstanceKey)
	expect(res.foo).toBe('bar')
})
