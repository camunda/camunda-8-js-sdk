/* eslint-disable @typescript-eslint/naming-convention */
import test from 'ava'
import {environmentSetup} from '../helpers/_environment-setup.js'
import {OperateApiClient} from '../../operate/index.js'
import {TestableOperateApiClient} from '../../operate/lib/testable-operate-api-client.js'

test.before(() => {
	environmentSetup.storeEnv()
	environmentSetup.wipeEnv()
})
test.after(() => {
	environmentSetup.restoreEnv();
})

test('Constructor throws without base url', t => {
	try {
		// eslint-disable-next-line no-new
		new OperateApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
		t.fail('Constructor should throw without base url')
	} catch (error) {
		t.is((error as Error).message.includes('Missing'), true)
		t.pass('Constructor throws without base url')
	}
})

test('Can get construct a client', t => {
	const client = new OperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	t.is(Boolean(client), true)
})

test('Can add tenant id to filter', t => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	const query = client.addTenantIdToFilter({filter: {}}, 'tenantId')
	t.is(query.filter?.tenantId, 'tenantId')
})

test('Adds tenant id if no filter', t => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	const query = client.addTenantIdToFilter({}, 'tenantId2')
	t.is(query.filter?.tenantId, 'tenantId2')
})

test('Does not add a tenantId if none given', t => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
			CAMUNDA_TENANT_ID: '', // Best we can do to erase the tenant id from env
		},
	})
	const query = client.addTenantIdToFilter({filter: {id: 3}})
	t.is(query.filter?.tenantId, '')
})

test('Adds tenant id from environment', t => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
			CAMUNDA_TENANT_ID: 'red5', // Best we can do to erase the tenant id from env
		},
	})
	const query = client.addTenantIdToFilter({filter: {id: 3}})
	t.is(query.filter?.tenantId, 'red5')
	t.is(query.filter?.id, 3)
})
