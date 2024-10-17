import test from 'ava'
import {LosslessDto} from '@camunda8/lossless-json'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {loadResourcesFromFiles} from '../helpers/_load-resources.js'

const c8 = new CamundaRestClient()

test.before(async () => {
	const resources = loadResourcesFromFiles(['./distribution/test/resources/Signal.bpmn'])
	await c8.deployResources({
		resources,
	})
})

test('Can start a process with a signal', async t => {
	t.timeout(10_000)
	const resources = loadResourcesFromFiles(['./distribution/test/resources/Signal.bpmn'])
	await c8.deployResources({
		resources,
	})

	const response = await c8.broadcastSignal({
		signalName: 'test-signal',
		variables: {
			success: true,
		},
	})

	t.is(Boolean(response.signalKey), true)

	let success = false
	await new Promise(resolve => {
		const w = c8.createJobWorker({
			type: 'signal-service-task',
			worker: 'signal-worker',
			timeout: 10_000,
			pollIntervalMs: 1000,
			maxJobsToActivate: 10,
			inputVariableDto: class extends LosslessDto {
				success!: boolean
			},
			async jobHandler(job) {
				const ack = job.complete()
				success = job.variables.success
				void w.stop()
				resolve(null);
				return ack
			},
		})
	})
	t.is(success, true)
})
