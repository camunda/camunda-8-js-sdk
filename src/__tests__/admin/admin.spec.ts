import { AdminApiClient } from '../../admin/index'

test('can construct', async () => {
	const c = new AdminApiClient()
	expect(c).toBeTruthy()
})
