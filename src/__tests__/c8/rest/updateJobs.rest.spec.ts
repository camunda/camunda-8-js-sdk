import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { matrix } from '../../../test-support/testTags'

const TEST_BPMN_FILENAME = 'update-job-test.bpmn'
// TEST_PROCESS_ID = 'UpdateJobTestProcess'
const TEST_TASK_TYPE = 'update-job-type'

let processDefinitionId: string
const restClient = new CamundaRestClient()

vi.setConfig({ testTimeout: 60_000 })

/**
 * Some clusters intermittently return a 500 with detail containing RESOURCE_EXHAUSTED when the broker
 * hasn't yet re-scheduled the timed-out job. We treat this as a transient condition and backoff + retry.
 * This helper retries only on that specific condition (or matching detail text) with exponential backoff.
 */
async function activateJobsWithRetry<
	TArgs extends Parameters<typeof restClient.activateJobs>[0],
>(req: TArgs, options?: { maxAttempts?: number; initialDelayMs?: number }) {
	const maxAttempts = options?.maxAttempts ?? 6
	let delay = options?.initialDelayMs ?? 100
	let attempt = 0
	// We capture the start time outside so elapsed in the test includes retries (keeps existing assertions meaningful)
	// because RESOURCE_EXHAUSTED responses should arrive quickly.
	// If this ever causes timing assertions to fail, we can subtract cumulativeRetryDelay from elapsed.
	// For now keep it simple.
	// eslint-disable-next-line no-constant-condition
	while (true) {
		attempt++
		try {
			return await restClient.activateJobs(req)
		} catch (e) {
			// Attempt to introspect the error shape (GotError or similar)
			const err = e as { response?: { body?: unknown }; message?: string }
			const body = err?.response?.body
			let detail: string | undefined
			if (body && typeof body === 'string') {
				try {
					const parsed = JSON.parse(body)
					detail = parsed?.detail
				} catch {
					/* ignore parse */
				}
			}
			const msg = `${err?.message ?? ''} ${detail ?? ''}`
			const transient =
				/RESOURCE_EXHAUSTED/.test(msg) ||
				/Expected to activate jobs of type/.test(msg)
			if (!transient || attempt >= maxAttempts) {
				throw err
			}
			await new Promise((r) => setTimeout(r, delay))
			delay = Math.min(delay * 2, 1000) // cap backoff at 1s
		}
	}
}

beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', TEST_BPMN_FILENAME),
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
	'reactivates job after timeout, and after updateJob sets a longer timeout',
	async () => {
		// 1. Start a process instance
		const instance = await restClient.createProcessInstance({
			processDefinitionId,
			variables: { foo: 'bar' },
		})

		// 1. Activate the job with a 5s timeout
		const start1 = Date.now()
		const jobs1 = await activateJobsWithRetry({
			maxJobsToActivate: 1,
			requestTimeout: 20000,
			timeout: 5000,
			type: TEST_TASK_TYPE,
			worker: 'test-worker',
		})
		const elapsed1 = Date.now() - start1
		expect(jobs1.length).toBe(1)
		expect(jobs1[0].processInstanceKey).toBe(instance.processInstanceKey)
		const jobKey = jobs1[0].jobKey
		expect(elapsed1).toBeLessThan(2000) // Should be available immediately

		// 2. Call activateJobs again, expect job after ~5s
		const start2 = Date.now()
		const jobs2 = await activateJobsWithRetry({
			maxJobsToActivate: 1,
			requestTimeout: 20000,
			timeout: 5000,
			type: TEST_TASK_TYPE,
			worker: 'test-worker',
		})
		const elapsed2 = Date.now() - start2
		expect(jobs2.length).toBe(1)
		expect(jobs2[0].jobKey).toBe(jobKey)
		expect(elapsed2).toBeGreaterThanOrEqual(4900)
		expect(elapsed2).toBeLessThan(9000)

		// 3. Update the job timeout to 10s
		await restClient.updateJob({
			jobKey,
			timeout: 10000,
		})

		// 4. Call activateJobs again, expect job after ~10s
		const start3 = Date.now()
		const jobs3 = await activateJobsWithRetry({
			maxJobsToActivate: 1,
			requestTimeout: 15000,
			timeout: 5000,
			type: TEST_TASK_TYPE,
			worker: 'test-worker',
		})
		const elapsed3 = Date.now() - start3
		expect(jobs3.length).toBe(1)
		expect(jobs3[0].jobKey).toBe(jobKey)
		expect(elapsed3).toBeGreaterThanOrEqual(9900)
		expect(elapsed3).toBeLessThan(15000)

		// 5. Complete the job to clean up
		await jobs3[0].complete()
	}
)
