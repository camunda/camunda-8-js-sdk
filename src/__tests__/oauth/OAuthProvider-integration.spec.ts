import { OAuthProvider } from '../../oauth/lib/OAuthProvider'

let o: OAuthProvider

beforeAll(() => {
	o = new OAuthProvider()
	o.flushFileCache()
})

test('Can get an Operate token from the environment vars', async () => {
	const token = await o.getHeaders('OPERATE')
	expect(typeof token).toBe('object')
})

test('Can get Operate token', async () => {
	const token = await o.getHeaders('OPERATE')
	expect(typeof token).toBe('object')
})

test('Can get Optimize token', async () => {
	const token = await o.getHeaders('OPTIMIZE')
	expect(typeof token).toBe('object')
})

test('Can get Tasklist token', async () => {
	const token = await o.getHeaders('TASKLIST')
	expect(typeof token).toBe('object')
})

test('Can get Zeebe token', async () => {
	const token = await o.getHeaders('ZEEBE')
	expect(typeof token).toBe('object')
})

test('Can get a console token from the environment vars', async () => {
	if (process.env.CAMUNDA_TEST_TYPE === 'local') {
		expect(true).toBe(true)
	} else {
		const token = await o.getHeaders('CONSOLE')
		expect(typeof token).toBe('object')
	}
})
