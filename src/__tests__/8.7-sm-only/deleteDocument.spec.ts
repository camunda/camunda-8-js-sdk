import fs from 'fs'

import { expect, test, vi } from 'vitest'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()
vi.setConfig({ testTimeout: 30_000 })

// Disabled because the test is flaky and the issue is not resolved yet.
// See https://github.com/camunda/camunda-8-js-sdk/issues/562
test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can delete a document', async () => {
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

	await c8.deleteDocument({
		documentId: response.documentId,
	})
	// expect this to throw 404
	await expect(async () => {
		await c8.downloadDocument({
			documentId: response.documentId,
			contentHash: response.contentHash,
		})
	}).rejects.toThrow(/404/)
})
