import { OperateApiClient } from '../../operate'
import { ProcessDefinition, Query } from '../../operate/lib/APIObjects'

jest.setTimeout(15000)
describe('Operate Integration', () => {
	xtest('It can get the Incident', async () => {
		const c = new OperateApiClient()

		const res = await c.searchIncidents({
			filter: {
				processInstanceKey: 2251799816400111,
			},
		})
		console.log(JSON.stringify(res, null, 2))
		expect(res.total).toBe(1)
	})
	xtest('It can search process definitions', async () => {
		const c = new OperateApiClient()

		const query: Query<ProcessDefinition> = {
			filter: {},
			size: 50,
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
