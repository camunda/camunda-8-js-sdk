import { PollingOperation } from '../../../lib/PollingOperation'
import { OperateApiClient } from '../../../operate'
import { ZeebeGrpcClient } from '../../../zeebe'

jest.setTimeout(15000)

describe('Operate multi-tenancy', () => {
	test('It can get the process instance from green tenant and not the red tenant', async () => {
		const operateGreen = new OperateApiClient({
			config: {
				CAMUNDA_TENANT_ID: 'green',
			},
		})
		const operateRed = new OperateApiClient({
			config: {
				CAMUNDA_TENANT_ID: 'red',
				ZEEBE_CLIENT_ID: 'redzeebe',
				ZEEBE_CLIENT_SECRET: 'redzecret',
			},
		})
		const zbc = new ZeebeGrpcClient()

		// Deploy to green tenant
		await zbc.deployResource({
			processFilename: 'src/__tests__/testdata/OperateMultitenancy.bpmn',
			tenantId: 'green',
		})

		// Start an instance in green tenant
		const p = await zbc.createProcessInstance({
			bpmnProcessId: 'operate-mt',
			tenantId: 'green',
			variables: {},
		})

		// Get the process instance from Operate green tenant
		const greenprocess = await PollingOperation({
			operation: () =>
				operateGreen.searchProcessInstances({
					filter: { key: p.processInstanceKey },
				}),
			interval: 500,
			timeout: 8000,
		})

		expect(greenprocess).toBeDefined()
		expect(greenprocess.items[0].key.toString()).toBe(p.processInstanceKey)

		// Can't find it in red tenant
		const redprocess = await operateRed
			.getProcessInstance(p.processInstanceKey)
			.catch((e) => {
				expect(e.message.includes('404')).toBe(true)
				return false
			})
		expect(redprocess).toBe(false)
		// Cancel the instance in green tenant
		await zbc.cancelProcessInstance(p.processInstanceKey)
	})
})
