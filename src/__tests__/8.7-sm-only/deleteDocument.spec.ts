import fs from 'fs'

import { expect, test, vi } from 'vitest'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { createSocketTap, isHttpParseError } from '../../test-support/socketTap'
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
	// Intermittent HPE_INVALID_HEADER_TOKEN on download (#562): record the wire
	// bytes so the next failure shows what the gateway actually sent.
	const tap = createSocketTap((port) => port !== 18080) // skip the OAuth server
	try {
		await uploadDownloadDelete()
	} catch (e) {
		if (isHttpParseError(e)) {
			console.error(
				`HTTP parse error ${
					(e as { code?: string }).code
				}; wire transcript:\n${tap.describe()}`
			)
		}
		throw e
	} finally {
		tap.stop()
	}
})

async function uploadDownloadDelete() {
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
}
