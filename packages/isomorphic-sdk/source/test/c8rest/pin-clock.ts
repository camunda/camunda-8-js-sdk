import test from 'ava'
import {CamundaRestClient} from '../../c8-rest/index.js'

test('We can pin the clock, and reset it', async t => {
	const now = Date.now()
	const c8 = new CamundaRestClient()
	await c8.pinInternalClock(now) // Pin the clock to the present time
	await c8.pinInternalClock(now + 1000) // Move the clock forward 1 second
	await c8.resetClock() // Reset the clock
	t.pass('Clock reset')
})
