import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe'

suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()

test('it can get the topology', async () => {
	const res = await zbc.topology()
	expect(Array.isArray(res?.brokers)).toBe(true)
	await zbc.close()
	restoreZeebeLogging()
})
