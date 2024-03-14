import { OptimizeApiClient } from '../../optimize/lib/OptimizeApiClient'

test('Can get construct a client', () => {
	const client = new OptimizeApiClient()
	expect(client).toBeTruthy()
})
