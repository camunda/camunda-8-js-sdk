import { expect, test } from 'vitest'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { matrix } from '../../test-support/testTags'

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('We can pin the clock, and reset it', async () => {
	const now = Date.now()
	const c8 = new CamundaRestClient()
	await c8.pinInternalClock(now) // Pin the clock to the present time
	await c8.pinInternalClock(now + 1000) // Move the clock forward 1 second
	await c8.resetClock() // Reset the clock
	expect(now).toEqual(now)
})
