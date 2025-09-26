import path from 'path'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'
import { matrix } from '../../../test-support/testTags'

const c8 = new CamundaRestClient()

vi.setConfig({ testTimeout: 30_000 })

class Variables extends LosslessDto {
	key?: string
}

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
	'RestClient can modify a process instance',
	async () =>
		// eslint-disable-next-line no-async-promise-executor
		new Promise<void>(async (resolve) => {
			// Deploy a process model
			const res = await c8.deployResourcesFromFiles([
				path.join(
					'.',
					'src',
					'__tests__',
					'testdata',
					'modify-process-instance-rest.bpmn'
				),
			])
			console.log('Deployed process:', JSON.stringify(res, null, 2))
			const key = Math.random().toString(36).substring(2, 15)

			const response = await c8.createProcessInstance<Variables>({
				processDefinitionId: res.processes[0].processDefinitionId,
				variables: { key },
			})

			// Call modifyProcessInstance and capture the response
			const modifyResponse = await c8.modifyProcessInstance({
				processInstanceKey: response.processInstanceKey,
				activateInstructions: [
					{
						elementId: 'gets-completed-108',
						ancestorElementInstanceKey: '-1',
						variableInstructions: [],
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
					timeout: 30_000,
					worker: 'Modified Process Worker 1',
				})
			})

			// Test completed successfully
			resolve()
		})
)
