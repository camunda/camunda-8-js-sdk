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
)('It can upload a document', async () => {
	const response = await c8.uploadDocuments({
		files: [
			fs.createReadStream('README.md'),
			fs.createReadStream('CHANGELOG.md'),
		],
	})
	expect(response.createdDocuments.length).toBe(2)
})
