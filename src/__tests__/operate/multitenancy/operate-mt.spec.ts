import { delay, restoreZeebeLogging, suppressZeebeLogging } from 'lib'
import { ZeebeGrpcClient } from 'zeebe'

import { OperateApiClient } from '../../../operate'

jest.setTimeout(15000)
suppressZeebeLogging()

afterAll(() => restoreZeebeLogging())

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

		await delay(8000)
		// Get the process instance from Operate green tenant

		const greenprocess = await operateGreen.searchProcessInstances({
			filter: { key: p.processInstanceKey },
		})

		// getProcessInstance(
		// 	p.processInstanceKey
		// )

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
