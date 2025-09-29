import { CamundaJobWorker, CamundaRestClient, PollingOperation } from '../..'
import { LosslessDto } from '../../lib'
import { matrix } from '../../test-support/testTags'

const c8 = new CamundaRestClient()

vi.setConfig({ testTimeout: 15_000 })

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It can update the variables of an Element Instance', async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/rest-search-element-instances-test.bpmn',
	])
	const key = res.processes[0].processDefinitionKey
	const processInstance = await c8.createProcessInstance({
		processDefinitionKey: key,
		variables: {
			queryTag: 'search-element-instances-test',
			variableToUpdate: 'initialValue',
		},
	})
	const elementInstances = await PollingOperation({
		operation: () =>
			c8.searchElementInstances({
				sort: [{ field: 'processInstanceKey' }],
				filter: {
					processInstanceKey: processInstance.processInstanceKey,
					type: 'SERVICE_TASK',
				},
			}),
		interval: 500,
		timeout: 10000,
	})
	expect(elementInstances.items.length).toBe(1)

	const { elementInstanceKey } = elementInstances.items[0]
	await c8.updateElementInstanceVariables({
		elementInstanceKey: elementInstanceKey,
		variables: {
			variableToUpdate: 'updatedValue',
		},
	})
	let worker: CamundaJobWorker<{ variableToUpdate: string }, LosslessDto>
	// Create a worker and service the task to ensure that the variables are updated
	await new Promise((resolve) => {
		worker = c8.createJobWorker({
			type: 'search-element-instances',
			worker: 'test-worker',
			maxJobsToActivate: 1,
			timeout: 10000,
			jobHandler: (job) => {
				expect(job.variables.variableToUpdate).toBe('updatedValue')
				resolve(true)
				return job.complete()
			},
		})
	})
	worker!.stop()
})
