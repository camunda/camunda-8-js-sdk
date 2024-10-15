import test from 'ava'
import {LosslessDto} from '@camunda8/lossless-json'
import {CamundaRestClient} from '../../c8-rest/index.js'

const c8 = new CamundaRestClient()

test.before(async () => {
	await c8.deployResourcesFromFiles({
		files: ['./distribution/test/resources/Signal.bpmn'],
	})
})

test('Can start a process with a signal', async t => {
	t.timeout(10_000)
	await c8.deployResourcesFromFiles({
		files: ['./distribution/test/resources/Signal.bpmn'],
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
