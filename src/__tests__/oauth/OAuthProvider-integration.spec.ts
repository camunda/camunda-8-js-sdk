import { OAuthProvider } from '../../oauth/lib/OAuthProvider'
import { matrix } from '../../test-support/testTags'

let o: OAuthProvider

beforeAll(() => {
	o = new OAuthProvider()
	o.flushFileCache()
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get an Operate token from the environment vars', async () => {
	const token = await o.getHeaders('OPERATE')
	expect(typeof token).toBe('object')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get Operate token', async () => {
	const token = await o.getHeaders('OPERATE')
	expect(typeof token).toBe('object')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get Optimize token', async () => {
	const token = await o.getHeaders('OPTIMIZE')
	expect(typeof token).toBe('object')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get Tasklist token', async () => {
	const token = await o.getHeaders('TASKLIST')
	expect(typeof token).toBe('object')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get Zeebe token', async () => {
	const token = await o.getHeaders('ZEEBE')
	expect(typeof token).toBe('object')
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get a console token from the environment vars', async () => {
	if (process.env.CAMUNDA_TEST_TYPE === 'local') {
		expect(true).toBe(true)
	} else {
		const token = await o.getHeaders('CONSOLE')
		expect(typeof token).toBe('object')
	}
})
