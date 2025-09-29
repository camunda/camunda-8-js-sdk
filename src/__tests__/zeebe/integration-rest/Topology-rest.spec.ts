import { allowAny } from '../../../test-support/testTags'
import { ZeebeRestClient } from '../../../zeebe'

describe('ZeebeRestClient', () => {
	test.runIf(
		allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }])
	)('can get the topology', async () => {
		const zbc = new ZeebeRestClient()
		const topology = await zbc.getTopology()
		expect(topology).toHaveProperty('brokers')
	})
})
