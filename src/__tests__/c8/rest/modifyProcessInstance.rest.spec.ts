import path from 'path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'

const c8 = new CamundaRestClient()

jest.setTimeout(20000)

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

		await c8.modifyProcessInstance({
			processInstanceKey: response.processInstanceKey,
			activateInstructions: [
				{
					elementId: 'gets-completed-108',
				},
			],
		})
		let done = false
		const worker = c8.createJobWorker<Variables, LosslessDto>({
			type: 'gets-completed-108',
			jobHandler: async (job) => {
				done = true
				return job.complete({
					key,
				})
			},
			maxJobsToActivate: 10,
			timeout: 30000,
			worker: 'Modified Process Worker 1',
		})

		const poll = setInterval(() => {
			if (done) {
				worker.stop()
				clearInterval(poll)
				resolve()
			}
		}, 100)
	})
})
