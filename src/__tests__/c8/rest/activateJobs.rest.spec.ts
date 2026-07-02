import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { delay } from '../../../lib'
import { matrix } from '../../../test-support/testTags'

let processDefinitionId: string
const restClient = new CamundaRestClient()

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join(
			'.',
			'src',
			'__tests__',
			'testdata',
			'hello-world-complete-rest.bpmn'
		),
	])
	processDefinitionId = res.processes[0].processDefinitionId
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can service a job',
	() =>
		new Promise((done) => {
			restClient
				.createProcessInstance({
					processDefinitionId,
					variables: {
						someNumberField: 8,
					},
				})
				.then(() => {
					restClient
						.activateJobs({
							maxJobsToActivate: 2,
							requestTimeout: 5000,
							timeout: 5000,
							type: 'console-log-complete-rest',
							worker: 'test',
						})
						.then((jobs) => {
							expect(jobs.length).toBe(1)

							// Validate all fields in the RestJob DTO
							const job = jobs[0]

							// Required properties from RestJob interface
							expect(job.jobKey).toBeDefined()
							expect(typeof job.jobKey).toBe('string')
							expect(job.type).toBe('console-log-complete-rest')
							expect(job.processInstanceKey).toBeDefined()
							expect(typeof job.processInstanceKey).toBe('string')
							expect(job.elementId).toBeDefined()
							expect(job.elementInstanceKey).toBeDefined()
							expect(typeof job.elementInstanceKey).toBe('string')
							expect(job.worker).toBe('test') // Worker name from our request
							expect(job.retries).toBeGreaterThan(0)
							expect(job.deadline).toBeDefined()
							expect(job.variables).toBeDefined()
							expect(job.variables['someNumberField']).toBe(8)
							expect(job.customHeaders).toBeDefined()
							expect(job.tenantId).toBeDefined()

							// Check for methods from JobCompletionInterfaceRest
							expect(typeof job.complete).toBe('function')
							expect(typeof job.fail).toBe('function')
							expect(typeof job.forward).toBe('function')
							expect(typeof job.cancelWorkflow).toBe('function')

							// Complete the job and finish the test
							jobs[0].complete().then(() => done(void 0))
						})
				})
		}),
	30000
)

// https://github.com/camunda/camunda-8-js-sdk/issues/424
test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'Can cancel an in-flight REST job activation call',
	async () => {
		const res = restClient.activateJobs({
			maxJobsToActivate: 2,
			requestTimeout: 5000,
			timeout: 5000,
			type: 'console-log-complete-rest',
			worker: 'test',
		})

		res.then(() => {
			throw new Error('Should not have received jobs')
		})
		res.cancel(`Activate jobs call cancelled from test`)
		const process = await restClient.createProcessInstance({
			processDefinitionId,
			variables: {
				someNumberField: 8,
			},
		})
		// Wait for a couple of seconds to ensure that we do not receive any jobs
		await delay(3000)
		try {
			await restClient.cancelProcessInstance({
				processInstanceKey: process.processInstanceKey,
			})
		} catch (e: unknown) {
			// The process may have already completed (e.g. a background activateJobs
			// from a prior test picked up and completed the job). Treat NOT_FOUND as
			// an acceptable outcome here since the goal of the test is to verify that
			// the cancellation of the activateJobs call prevented job delivery.
			if ((e as { statusCode?: number })?.statusCode !== 404) throw e
		}
	},
	15000
)
