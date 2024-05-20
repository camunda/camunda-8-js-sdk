import { ZeebeRestClient } from '../../../zeebe'

test('it can get the topology', async () => {
	const zbc = new ZeebeRestClient()
	const topology = await zbc.getTopology()
	expect(topology).toHaveProperty('brokers')
})
