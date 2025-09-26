import path from 'node:path'

import { afterAll, beforeAll, expect, test, vi } from 'vitest'

import { CamundaJobWorker } from '../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../lib'
import { PollingOperation } from '../../lib/PollingOperation'
import { matrix } from '../../test-support/testTags'

let processDefinitionId: string
let worker: CamundaJobWorker<LosslessDto, LosslessDto>
const restClient = new CamundaRestClient()

vi.setConfig({ testTimeout: 30_000 })

afterAll(() => {
	worker && worker.stop()
})

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', 'rest-get-variable.bpmn'),
	])
	processDefinitionId = res.processes[0].processDefinitionId
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can get a variable',
	() =>
		new Promise((done) => {
			restClient.createProcessInstance({
				processDefinitionId,
				variables: {
					someVariableField: 8,
				},
			})
			worker = restClient.createJobWorker({
				type: 'get-variable',
				jobHandler: async (job) => {
					// query variables to get the variable key
					const variables = await PollingOperation({
						operation: () =>
							restClient.searchVariables({
								filter: {
									processInstanceKey: job.processInstanceKey,
								},
							}),
						interval: 500,
						timeout: 5000,
					})

					const { variableKey } = variables.items[0]

					const variable = await PollingOperation({
						operation: () =>
							restClient.getVariable({
								variableKey,
							}),
						predicate: (v) => v.value !== undefined,
					})

					// Validate all fields in the GetVariableResponse DTO
					expect(variable.variableKey).toBe(variableKey)
					expect(variable.value).toBe(8)
					expect(variable.name).toBe('someVariableField')
					expect(variable.processInstanceKey).toBe(job.processInstanceKey)
					expect(variable.scopeKey).toBeDefined()
					expect(typeof variable.scopeKey).toBe('string')
					expect(variable.tenantId).toBeDefined()
					expect(typeof variable.tenantId).toBe('string')

					return job.complete().then((res) => {
						done(void 0)
						return res
					})
				},
				worker: 'get-variable-worker',
				timeout: 30000,
				maxJobsToActivate: 10,
			})
		})
)
