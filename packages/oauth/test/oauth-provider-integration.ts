import process from 'node:process'
import test from 'ava'
import {OAuthProvider} from '../source/index.js'

let o: OAuthProvider

test.before(() => {
	o = new OAuthProvider()
	o.flushFileCache()
})

test('Can get an Operate token from the environment vars', async t => {
	const token = await o.getToken('OPERATE')
	t.is(typeof token, 'string')
})

test('Can get Operate token', async t => {
	const token = await o.getToken('OPERATE')
	t.is(typeof token, 'string')
})

test('Can get Optimize token', async t => {
	const token = await o.getToken('OPTIMIZE')
	t.is(typeof token, 'string')
})

test('Can get Tasklist token', async t => {
	const token = await o.getToken('TASKLIST')
	t.is(typeof token, 'string')
})

test('Can get Zeebe token', async t => {
	const token = await o.getToken('ZEEBE')
	t.is(typeof token, 'string')
})

test('Can get a console token from the environment vars', async t => {
	if (process.env.CAMUNDA_TEST_TYPE === 'local') {
		t.pass()
	} else {
		const token = await o.getToken('CONSOLE')
		t.is(typeof token, 'string')
	}
})
