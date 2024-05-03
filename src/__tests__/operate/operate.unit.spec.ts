import { EnvironmentSetup } from '../../lib'
import { OperateApiClient } from '../../operate'
import { TestableOperateApiClient } from '../../operate/lib/TestableOperateApiClient'

beforeAll(() => {
	EnvironmentSetup.storeEnv()
	EnvironmentSetup.wipeEnv()
})
afterAll(() => EnvironmentSetup.restoreEnv())

test('Censtructor throws without base url', () => {
	try {
		new OperateApiClient({
			config: {
				CAMUNDA_OAUTH_DISABLED: true,
			},
		})
	} catch (e) {
		expect((e as Error).message.includes('Missing')).toBe(true)
	}
})

test('Can get construct a client', () => {
	const client = new OperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	expect(client).toBeTruthy()
})

test('Can add tenant id to filter', () => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	const query = client.addTenantIdToFilter({ filter: {} }, 'tenantId')
	expect(query.filter?.tenantId).toBe('tenantId')
})

test('Adds tenant id if no filter', () => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
		},
	})
	const query = client.addTenantIdToFilter({}, 'tenantId2')
	expect(query.filter?.tenantId).toBe('tenantId2')
})

test('Does not add a tenantId if none given', async () => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
			CAMUNDA_TENANT_ID: '', // best we can do to erase the tenant id from env
		},
	})
	const query = client.addTenantIdToFilter({ filter: { id: 3 } })
	expect(query.filter?.tenantId).toBe('')
})

test('Adds tenant id from environment', () => {
	const client = new TestableOperateApiClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			CAMUNDA_OPERATE_BASE_URL: 'http://localhost',
			CAMUNDA_TENANT_ID: 'red5', // best we can do to erase the tenant id from env
		},
	})
	const query = client.addTenantIdToFilter({ filter: { id: 3 } })
	expect(query.filter?.tenantId).toBe('red5')
	expect(query.filter?.id).toBe(3)
})
