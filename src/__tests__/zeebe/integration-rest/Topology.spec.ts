import { ZeebeRESTClient } from '../../../zeebe'

test('it can get the topology', async () => {
	const zbc = new ZeebeRESTClient()
	const topology = await zbc.getTopology()
	expect(topology).toHaveProperty('brokers')
})
