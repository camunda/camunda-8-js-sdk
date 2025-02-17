import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

test('The REST client can get the topology', async () => {
	const c8 = new CamundaRestClient()
	const topology = await c8.getTopology()
	expect(topology).toHaveProperty('gatewayVersion')
})
