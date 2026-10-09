import fs from 'fs'

import { expect, test, vi } from 'vitest'

import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()
vi.setConfig({ testTimeout: 30_000 })

const FILES = ['README.md', 'CHANGELOG.md']

// Flaky against SaaS: the cluster occasionally reports one created document
// instead of two, with both the old got/form-data client and undici (see
// https://github.com/camunda/camunda-8-js-sdk/issues/562). Until it is
// root-caused, a failure prints everything we know about the request and
// response, starting with the cluster's own failedDocuments[].detail.
test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can upload a document', async () => {
	const sent = FILES.map((name) => ({ name, bytes: fs.statSync(name).size }))
	const startedAt = new Date().toISOString()
	const response = await c8.uploadDocuments({
		files: FILES.map((name) => fs.createReadStream(name)),
	})

	if (response.createdDocuments?.length !== FILES.length) {
		const created = (response.createdDocuments ?? []).map((d) => ({
			documentId: d.documentId,
			storeId: d.storeId,
			fileName: d.metadata?.fileName,
			size: d.metadata?.size,
			contentType: d.metadata?.contentType,
		}))
		const missing = FILES.filter(
			(name) => !created.some((d) => d.fileName === name)
		)
		console.error(
			'[uploadDocuments diagnostics] ' +
				JSON.stringify(
					{
						startedAt,
						finishedAt: new Date().toISOString(),
						endpoint: 'POST documents/batch',
						sent,
						missing,
						created,
						failedDocuments: response.failedDocuments,
						rawResponse: response,
					},
					null,
					2
				)
		)
	}

	expect(
		response.createdDocuments?.length,
		`expected ${
			FILES.length
		} created documents; failedDocuments: ${JSON.stringify(
			response.failedDocuments
		)} (full diagnostics logged above)`
	).toBe(FILES.length)
})
