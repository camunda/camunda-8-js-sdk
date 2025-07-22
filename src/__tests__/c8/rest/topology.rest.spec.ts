import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

test('The REST client can get the topology', async () => {
	const c8 = new CamundaRestClient()
	const topology = await c8.getTopology()

	// Validate the complete TopologyResponse DTO

	// Validate top-level properties
	expect(topology).toBeDefined()
	expect(topology.gatewayVersion).toBeDefined()
	expect(typeof topology.gatewayVersion).toBe('string')

	expect(topology.clusterSize).toBeDefined()
	expect(typeof topology.clusterSize).toBe('number')
	expect(topology.clusterSize).toBeGreaterThan(0)

	expect(topology.partitionsCount).toBeDefined()
	expect(typeof topology.partitionsCount).toBe('number')
	expect(topology.partitionsCount).toBeGreaterThan(0)

	expect(topology.replicationFactor).toBeDefined()
	expect(typeof topology.replicationFactor).toBe('number')
	expect(topology.replicationFactor).toBeGreaterThan(0)

	// Validate brokers array
	expect(topology.brokers).toBeDefined()
	expect(Array.isArray(topology.brokers)).toBe(true)
	expect(topology.brokers.length).toBeGreaterThan(0)

	// Validate first broker in the array
	const firstBroker = topology.brokers[0]
	expect(firstBroker).toBeDefined()
	expect(firstBroker.nodeId).toBeDefined()
	expect(typeof firstBroker.nodeId).toBe('number')

	expect(firstBroker.host).toBeDefined()
	expect(typeof firstBroker.host).toBe('string')

	expect(firstBroker.port).toBeDefined()
	expect(typeof firstBroker.port).toBe('number')

	// Validate partitions within the broker
	expect(firstBroker.partitions).toBeDefined()
	expect(Array.isArray(firstBroker.partitions)).toBe(true)

	if (firstBroker.partitions.length > 0) {
		const firstPartition = firstBroker.partitions[0]
		expect(firstPartition).toBeDefined()
		expect(firstPartition.partitionId).toBeDefined()
		expect(typeof firstPartition.partitionId).toBe('number')

		expect(firstPartition.role).toBeDefined()

		expect(typeof firstPartition.role).toBe('string')

		expect(firstPartition.health).toBeDefined()

		expect(typeof firstPartition.health).toBe('string')
	}
})
