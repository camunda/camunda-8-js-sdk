/* eslint-disable @typescript-eslint/naming-convention */
import test from 'ava'
import delay from 'delay'
import {type HTTPError} from 'ky'
import {CamundaRestClient} from '../../../c8-rest/camunda-rest-client.js'
import {OperateApiClient} from '../../../operate/index.js'
import {loadResourcesFromFiles} from '../../helpers/_load-resources.js'

test('It can get the process instance from green tenant and not the red tenant', async t => {
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
	await zbc.deployResources({
		resources: loadResourcesFromFiles(['./test/resources/OperateMultitenancy.bpmn']),
		tenantId: 'green',
	})

	// Start an instance in green tenant
	const p = await zbc.createProcessInstance({
		processDefinitionId: 'operate-mt',
		tenantId: 'green',
		variables: {},
	})

	// Wait for 8 seconds
	await delay(8000)
	// Get the process instance from Operate green tenant
	const greenprocess = await operateGreen.searchProcessInstances({
		filter: {key: p.processInstanceKey},
	})

	t.is(Boolean(greenprocess), true)
	t.is(greenprocess.items[0].key.toString(), p.processInstanceKey)

	// Can't find it in red tenant
	const redprocess = await operateRed
		.getProcessInstance(p.processInstanceKey)
		.catch((error: unknown) => {
			t.is((error as HTTPError).message.includes('404'), true)
			return false
		})
	t.is(redprocess, false)
	// Cancel the instance in green tenant
	await zbc.cancelProcessInstance({
		processInstanceKey: p.processInstanceKey,
	})
})

