import { C8RestClient } from '../../../c8/lib/C8RestClient'

test('We can pin the clock, and reset it', async () => {
	const now = Date.now()
	const c8 = new C8RestClient()
	await c8.pinInternalClock(now) // Pin the clock to the present time
	await c8.pinInternalClock(now + 1000) // Move the clock forward 1 second
	await c8.resetClock() // Reset the clock
	expect(now).toEqual(now)
})
