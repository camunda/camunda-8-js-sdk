import { CamundaRestClient } from '../../../c8rest/CamundaRestClient'
import { OperateApiClient } from '../../../operate'

jest.setTimeout(15000)

describe('Operate multi-tenancy', () => {
	test('It can get the process instance from green tenant and not the red tenant', async () => {
		/**
		 * This Operate client accesses the green tenant, but not the red tenant.
		 */
		const operateGreen = new OperateApiClient({
			config: {
				CAMUNDA_TENANT_ID: 'green',
			},
		})
		/**
		 * This Operate client accesses the red tenant, but not the green tenant.
		 */
		const operateRed = new OperateApiClient({
			config: {
				CAMUNDA_TENANT_ID: 'red',
				ZEEBE_CLIENT_ID: 'redzeebe',
				ZEEBE_CLIENT_SECRET: 'redzecret',
			},
		})
		const zbc = new CamundaRestClient()

		// Deploy to green tenant
		await zbc.deployResourcesFromFiles({
			files: ['src/__tests__/testdata/OperateMultitenancy.bpmn'],
			tenantId: 'green',
		})

		// Start an instance in green tenant
		const p = await zbc.createProcessInstance({
			processDefinitionId: 'operate-mt',
			tenantId: 'green',
			variables: {},
		})

		// Wait for 8 seconds
		await new Promise((res) => setTimeout(() => res(null), 8000))
		// Get the process instance from Operate green tenant
		const greenprocess = await operateGreen.searchProcessInstances({
			filter: { key: p.processInstanceKey },
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
		await zbc.cancelProcessInstance({
			processInstanceKey: p.processInstanceKey,
		})
	})
})
