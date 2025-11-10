import path from 'node:path'

import { Camunda8, OrchestrationLifters } from '../../index'
import { matrix } from '../../test-support/testTags'

let processDefinitionId: OrchestrationLifters.ProcessDefinitionId
const camunda = new Camunda8()
const ocaClient = camunda.getOrchestrationClusterApiClient()

beforeAll(async () => {
	const res = await ocaClient.deployResourcesFromFiles([
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
			versions: ['8.8'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('Can service a job via OCA', async () => {
	await ocaClient.createProcessInstance({
		processDefinitionId:
			OrchestrationLifters.ProcessDefinitionId.assumeExists(
				processDefinitionId
			),
		variables: {
			someNumberField: 8,
		},
	})
	const jobs = await ocaClient.activateJobs({
		maxJobsToActivate: 2,
		requestTimeout: 5000,
		timeout: 5000,
		type: 'console-log-complete-rest',
		worker: 'test',
	})
	expect(jobs.jobs.length).toBeGreaterThanOrEqual(1)

	// Validate all fields in the RestJob DTO
	const job = jobs.jobs[0]

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
	expect(typeof job.ignore).toBe('function')
	expect(typeof job.cancelWorkflow).toBe('function')

	// Complete the job and finish the test
	await job.complete()
})

// https://github.com/camunda/camunda-8-js-sdk/issues/424
test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('Can cancel an in-flight REST job activation call', async () => {
	const res = ocaClient.activateJobs({
		maxJobsToActivate: 2,
		requestTimeout: 5000,
		timeout: 5000,
		type: 'non-existent-type-' + Date.now().toString(),
		worker: 'test',
	})

	res.cancel()
	await expect(res).rejects.toMatchObject({ name: 'CancelSdkError' })
})

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('Can service a job via a job worker', async () => {
	const worker = ocaClient.createJobWorker({
		jobType: 'console-log-complete-rest',
		workerName: 'test-worker',
		maxParallelJobs: 20,
		pollIntervalMs: 1000,
		pollTimeoutMs: 5000,
		jobTimeoutMs: 5000,
		jobHandler: (job) => {
			// Validate job fields
			expect(job.jobKey).toBeDefined()
			expect(job.type).toBe('console-log-complete-rest')
			expect(job.variables['someNumberField']).toBe(8)
			// Complete the job
			return job.complete({
				someNumberField: -1,
			})
		},
	})
	const result = await ocaClient.createProcessInstance({
		processDefinitionId,
		variables: {
			someNumberField: 8,
		},
		awaitCompletion: true,
	})
	expect(result.variables.someNumberField).toBe(-1)
	worker.stop()
})
