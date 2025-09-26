import { randomUUID } from 'crypto'

import { CamundaRestClient, PollingOperation } from '../..'
import { CreateProcessInstanceResponse } from '../../c8/lib/C8Dto'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()
vi.setConfig({ testTimeout: 30_000 })

let wfi: CreateProcessInstanceResponse<unknown>

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can search process instances', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/searchIncidentsTest.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const id = res.processes[0].processDefinitionId
	const uuid = randomUUID()
	const worker = c8.createJobWorker({
		type: 'fail-service-task',
		jobHandler: (job) =>
			job.error({
				errorCode: 'fail',
				variables: {},
			}),
		maxJobsToActivate: 1,
		timeout: 1000,
		worker: 'test-worker',
	})
	wfi = await c8.createProcessInstance({
		processDefinitionId: id,
		variables: {
			queryTag: uuid,
		},
	})
	expect(wfi.processDefinitionKey).toBe(key)
	const incidents = await PollingOperation({
		operation: () =>
			c8.searchIncidents({
				sort: [{ field: 'state' }],
				filter: { processInstanceKey: wfi.processInstanceKey },
			}),
		interval: 500,
		timeout: 10000,
	})
	const result = incidents.items.filter(
		(i) => i.processInstanceKey === wfi.processInstanceKey
	)
	await worker.stop()
	expect(result.length).toBeGreaterThan(0)
	await c8.resolveIncident(result[0].incidentKey)
	await c8.cancelProcessInstance({
		processInstanceKey: wfi.processInstanceKey,
	})
})
