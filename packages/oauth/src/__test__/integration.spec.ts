import { getConsoleToken } from '../lib/Console'
import { OAuthProvider } from '../lib/OAuthProvider'
import { getOperateToken } from '../lib/Operate'
import { getOptimizeToken } from '../lib/Optimize'
import { getTasklistToken } from '../lib/Tasklist'
import { getZeebeToken } from '../lib/Zeebe'

let o: OAuthProvider

beforeAll(() => (o = new OAuthProvider('client-nodejs testing')))

test('Can get an Operate token from the environment vars', async () => {
	const token = await o.getToken('OPERATE')
	// console.log(token)
	expect(typeof token).toBe('string')
})

test('Can get Operate token', async () => {
	const token = await getOperateToken('client-nodejs testing')
	// console.log('Operate token', token)
	expect(typeof token).toBe('string')
})

test('Can get Optimize token', async () => {
	const token = await getOptimizeToken('client-nodejs testing')
	// console.log('Optimize token', token)
	expect(typeof token).toBe('string')
})

test('Can get Tasklist token', async () => {
	const token = await getTasklistToken('client-nodejs testing')
	// console.log('Tasklist token', token)
	expect(typeof token).toBe('string')
})

test('Can get Zeebe token', async () => {
	const token = await getZeebeToken('client-nodejs testing')
	// console.log('Zeebe token', token)
	expect(typeof token).toBe('string')
})

test('Can get a console token from the environment vars', async () => {
	if (process.env.CAMUNDA_TEST_TYPE === 'local') {
		expect(true).toBe(true)
	} else {
		const token = await getConsoleToken('client-nodejs testing')
		// console.log(token)
		expect(typeof token).toBe('string')
	}
})
