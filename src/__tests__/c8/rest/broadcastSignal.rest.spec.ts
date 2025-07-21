import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'
import { cancelProcesses as cancelProcessesSMandSaaS } from '../../../zeebe/lib/cancelProcesses'

jest.setTimeout(60000)

const c8 = new CamundaRestClient()
let pid: string

function cancelProcessesC8Run(processDefinitionKey: string) {
	c8.searchProcessInstances({
		filter: {
			processDefinitionKey,
			state: 'ACTIVE',
		},
		sort: [{ field: 'processInstanceKey', order: 'DESC' }],
	}).then((processes) => {
		return Promise.all(
			processes.items.map((item) => {
				return c8
					.cancelProcessInstance({
						processInstanceKey: item.processInstanceKey,
					})
					.catch((e) => {
						console.log(`Failed to delete process ${item.processInstanceKey}`)
						console.log(e)
					})
			})
		)
	})
}

const cancelProcesses =
	process.env.CAMUNDA_AUTH_STRATEGY === 'NONE'
		? cancelProcessesC8Run
		: cancelProcessesSMandSaaS

beforeAll(async () => {
	const res = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/Signal.bpmn',
	])
	pid = res.processes[0].processDefinitionKey
	await cancelProcesses(pid)
})

afterAll(async () => {
	await cancelProcesses(pid)
})

test('Can start a process with a signal', async () => {
	await c8.deployResourcesFromFiles(['./src/__tests__/testdata/Signal.bpmn'])

	const res = await c8.broadcastSignal({
		signalName: 'test-signal',
		variables: {
			success: true,
		},
	})

	// Validate the complete BroadcastSignalResponse DTO
	expect(res.signalKey).toBeTruthy()
	expect(typeof res.signalKey).toBe('string')
	expect(res.signalKey.length).toBeGreaterThan(0)

	// Validate tenantId field
	expect(res.tenantId).toBeDefined()
	expect(typeof res.tenantId).toBe('string')

	await new Promise((resolve) => {
		const w = c8.createJobWorker({
			type: 'signal-service-task',
			worker: 'signal-worker',
			timeout: 10000,
			pollIntervalMs: 1000,
			maxJobsToActivate: 10,
			inputVariableDto: class extends LosslessDto {
				success!: boolean
			},
			jobHandler: (job) => {
				const ack = job.complete()
				expect(job.variables.success).toBe(true)
				w.stop().then(() => resolve(null))
				return ack
			},
		})
	})
})
