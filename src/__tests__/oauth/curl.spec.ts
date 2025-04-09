import { OAuthProvider } from '../../oauth/lib/OAuthProvider'

let o: OAuthProvider

beforeAll(() => {
	o = new OAuthProvider()
	o.flushFileCache()
})

test('Can get an Operate token from the environment vars', async () => {
	const token = await o.getToken('ZEEBE')
	expect(typeof token).toBe('string')
	// Uncomment to generate curl commands for testing API endpoints
	// 	console.log(`curl -v -L -X POST 'http://localhost:3000/v2/documents' \
	// -F "key1=value1" -F "key2=value2" \
	// -F "file=@README.md" \
	// -H 'Content-Type: multipart/form-data' \
	// -H 'Accept: application/json' -H 'Authorization: ${token}'`)
})
