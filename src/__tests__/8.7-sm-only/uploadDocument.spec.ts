import fs from 'fs'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'

const c8 = new CamundaRestClient()
jest.setTimeout(30000)

// Disabled because the test is flaky and the issue is not resolved yet.
// See https://github.com/camunda/camunda-8-js-sdk/issues/562
xtest('It can upload a document', async () => {
	const response = await c8.uploadDocument({
		file: fs.createReadStream('README.md'),
		metadata: {
			processDefinitionId: 'process-definition-id',
		},
	})
	expect(response.metadata.processDefinitionId).toBe('process-definition-id')
	expect(response.metadata.contentType).toBe('text/markdown')
})

// Disabled because the test is flaky and the issue is not resolved yet.
// See https://github.com/camunda/camunda-8-js-sdk/issues/562
xtest('It can download a document', async () => {
	const response = await c8.uploadDocument({
		file: fs.createReadStream('README.md'),
		metadata: {
			processDefinitionId: 'process-definition-id',
		},
	})
	expect(response.metadata.processDefinitionId).toBe('process-definition-id')
	expect(response.metadata.contentType).toBe('text/markdown')

	const downloadResponse = await c8.downloadDocument({
		documentId: response.documentId,
		contentHash: response.contentHash,
	})
	expect(downloadResponse).toBeTruthy()
	expect(downloadResponse).toBeInstanceOf(Buffer)
})
