import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

jest.setTimeout(30000)

const c8 = new CamundaRestClient()

beforeAll(async () => {
	await c8.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', `test-drd.dmn`),
	])
})

test('can evaluate a decision', async () => {
	const output = await c8.evaluateDecision({
		decisionDefinitionId: 'test-decision',
		variables: {
			name: 'camunda',
		},
	})
	expect(output.evaluatedDecisions[0].output).toBe('"valid"')
})
