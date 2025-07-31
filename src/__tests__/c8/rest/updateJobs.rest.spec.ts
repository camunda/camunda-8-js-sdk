import path from 'node:path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

const TEST_BPMN_FILENAME = 'update-job-test.bpmn'
// TEST_PROCESS_ID = 'UpdateJobTestProcess'
const TEST_TASK_TYPE = 'update-job-type'

let processDefinitionId: string
const restClient = new CamundaRestClient()

jest.setTimeout(60000) // Set a longer timeout for this test suite
beforeAll(async () => {
	const res = await restClient.deployResourcesFromFiles([
		path.join('.', 'src', '__tests__', 'testdata', TEST_BPMN_FILENAME),
	])
	processDefinitionId = res.processes[0].processDefinitionId
})

describe('CamundaRestClient.updateJob integration', () => {
	it('reactivates job after timeout, and after updateJob sets a longer timeout', async () => {
		// 1. Start a process instance
		const instance = await restClient.createProcessInstance({
			processDefinitionId,
			variables: { foo: 'bar' },
		})

		// 1. Activate the job with a 5s timeout
		const start1 = Date.now()
		const jobs1 = await restClient.activateJobs({
			maxJobsToActivate: 1,
			requestTimeout: 10000,
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
		const jobs2 = await restClient.activateJobs({
			maxJobsToActivate: 1,
			requestTimeout: 10000,
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
		const jobs3 = await restClient.activateJobs({
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
	})
})
