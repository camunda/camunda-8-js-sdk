import test from 'ava'
import {CamundaRestClient} from '../../c8-rest/camunda-rest-client.js'

test('The client can get the topology', async t => {
	const client = new CamundaRestClient()
	const topology = await client.getTopology()
	t.true(Array.isArray(topology.brokers))
})
