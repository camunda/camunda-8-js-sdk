import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe/index'

beforeAll(() => suppressZeebeLogging())
afterAll(() => restoreZeebeLogging())

test('EvaluateDecision', async () => {
	const zbc = new ZeebeGrpcClient()
	const res = await zbc.deployResource({
		decisionFilename: './src/__tests__/testdata/decision.dmn',
	})

	const dmnDecisionName = 'My Decision'
	expect(res.deployments[0].decision.dmnDecisionName).toBe(dmnDecisionName)

	const dmnDecisionId = 'Decision_13dmfgp'
	const r = await zbc.evaluateDecision({
		decisionId: dmnDecisionId,
		variables: { season: 'fall' },
	})
	expect(r.evaluatedDecisions.length).toBe(1)

	await zbc.close()
})
