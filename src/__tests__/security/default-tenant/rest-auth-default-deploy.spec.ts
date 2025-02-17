/**
 * In this scenario, we authenticate the REST client with a valid id and secret to get a bearer token.
 *
 * We expect this case to succeed.
 */
import path from 'node:path'

import { Camunda8 } from '../../../c8/index'

jest.setTimeout(15000)

const c8 = new Camunda8({
	CAMUNDA_TENANT_ID: '<default>',
	CAMUNDA_TOKEN_DISK_CACHE_DISABLE: true,
})

const restClientAuthed = c8.getCamundaRestClient()

describe('Authenticated REST client (default tenant)', () => {
	test('can deploy process', async () => {
		const res = await restClientAuthed.deployResourcesFromFiles([
			path.join(
				'.',
				'src',
				'__tests__',
				'testdata',
				'create-process-rest.bpmn'
			),
		])
		expect(res.processes).toHaveLength(1)
	})
})
