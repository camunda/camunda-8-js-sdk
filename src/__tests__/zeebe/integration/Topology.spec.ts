import { ZeebeGrpcClient } from '../../../zeebe'
import {
	PartitionBrokerHealth,
	PartitionBrokerRole,
} from '../../../zeebe/lib/interfaces-grpc-1.0'

const zbc = new ZeebeGrpcClient()

test('it can get the topology', async () => {
	const res = await zbc.topology()

	// Validate the complete TopologyResponse DTO

	// Validate top-level properties
	expect(res).toBeDefined()
	expect(res.gatewayVersion).toBeDefined()
	expect(typeof res.gatewayVersion).toBe('string')

	expect(res.clusterSize).toBeDefined()
	expect(typeof res.clusterSize).toBe('number')
	expect(res.clusterSize).toBeGreaterThan(0)

	expect(res.partitionsCount).toBeDefined()
	expect(typeof res.partitionsCount).toBe('number')
	expect(res.partitionsCount).toBeGreaterThan(0)

	expect(res.replicationFactor).toBeDefined()
	expect(typeof res.replicationFactor).toBe('number')
	expect(res.replicationFactor).toBeGreaterThan(0)

	// Validate brokers array
	expect(res.brokers).toBeDefined()
	expect(Array.isArray(res.brokers)).toBe(true)
	expect(res.brokers.length).toBeGreaterThan(0)

	// Validate first broker in the array
	const firstBroker = res.brokers[0]
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

		// Validate role - should be one of the enum values
		expect(firstPartition.role).toBeDefined()
		expect(Object.values(PartitionBrokerRole)).toContain(firstPartition.role)

		// Validate health - should be one of the enum values
		expect(firstPartition.health).toBeDefined()
		expect(Object.values(PartitionBrokerHealth)).toContain(
			firstPartition.health
		)
	}

	await zbc.close()
})
