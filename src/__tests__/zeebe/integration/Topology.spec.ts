import { ZeebeGrpcClient } from '../../../zeebe'

const zbc = new ZeebeGrpcClient()

test('it can get the topology', async () => {
	const res = await zbc.topology()
	expect(Array.isArray(res?.brokers)).toBe(true)
	await zbc.close()
})
