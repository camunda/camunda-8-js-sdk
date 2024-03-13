import { ConsoleApiClient } from '../index'

test('can construct', async () => {
	const c = new ConsoleApiClient()
	expect(c).toBeTruthy()
})
