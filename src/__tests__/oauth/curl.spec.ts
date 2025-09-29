import { OAuthProvider } from '../../oauth/lib/OAuthProvider'
import { matrix } from '../../test-support/testTags'

let o: OAuthProvider

beforeAll(() => {
	o = new OAuthProvider()
	o.flushFileCache()
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['multi-tenant', 'single-tenant'],
			security: ['secured'],
		},
	})
)('Can get an Operate token from the environment vars', async () => {
	const token = await o.getHeaders('ZEEBE')
	expect(typeof token).toBe('object')
	// Uncomment to generate curl commands for testing API endpoints
	// 	console.log(`curl -v -L -X POST 'http://localhost:3000/v2/documents' \
	// -F "key1=value1" -F "key2=value2" \
	// -F "file=@README.md" \
	// -H 'Content-Type: multipart/form-data' \
	// -H 'Accept: application/json' -H 'Authorization: ${token}'`)
})
