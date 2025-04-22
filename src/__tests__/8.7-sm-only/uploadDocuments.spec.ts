import fs from 'fs'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()
jest.setTimeout(30000)

test('It can upload a document', async () => {
	const response = await c8.uploadDocuments({
		files: [
			fs.createReadStream('README.md'),
			fs.createReadStream('CHANGELOG.md'),
		],
	})
	expect(response.createdDocuments.length).toBe(2)
})
