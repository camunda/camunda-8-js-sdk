import path from 'path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'

const c8 = new CamundaRestClient()

jest.setTimeout(30000)

class Variables extends LosslessDto {
	key?: string
}

test('RestClient can migrate a process instance', async () => {
	// eslint-disable-next-line no-async-promise-executor
	return new Promise<void>(async (resolve) => {
		// Deploy a process model
		await c8.deployResourcesFromFiles([
			path.join(
				'.',
				'src',
				'__tests__',
				'testdata',
				'modify-process-instance-rest.bpmn'
			),
		])
		const key = Math.random().toString(36).substring(2, 15)

		const response = await c8.createProcessInstance<Variables>({
			processDefinitionId: 'modify-process-instance-test',
			variables: { key },
		})

		// Call modifyProcessInstance and capture the response
		const modifyResponse = await c8.modifyProcessInstance({
			processInstanceKey: response.processInstanceKey,
			activateInstructions: [
				{
					elementId: 'gets-completed-108',
				},
			],
		})

		// Validate the response
		expect(modifyResponse).toBeDefined()
		// The API returns an empty string for successful operations
		expect(typeof modifyResponse).toBe('string')
		expect(modifyResponse).toBe('')
		// Use Promise instead of polling for better test reliability
		await new Promise<void>((jobResolve) => {
			const worker = c8.createJobWorker<Variables, LosslessDto>({
				type: 'gets-completed-108',
				jobHandler: async (job) => {
					const result = await job.complete({
						key,
					})

					worker.stop()
					jobResolve()
					return result
				},
				maxJobsToActivate: 10,
				timeout: 30000,
				worker: 'Modified Process Worker 1',
			})
		})

		// Test completed successfully
		resolve()
	})
})
