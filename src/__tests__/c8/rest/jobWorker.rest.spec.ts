import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

// https://github.com/camunda/camunda-8-js-sdk/issues/424
test('REST worker will cancel inflight call on close', (done) => {
	const restClient = new CamundaRestClient({
		config: {
			CAMUNDA_LOG_LEVEL: 'none',
		},
	})
	const restJobWorker = restClient.createJobWorker({
		type: 'unauthenticated-worker',
		jobHandler: async () => {
			throw new Error('Not Implemented') // is never called
		},
		worker: 'unauthenticated-test-worker',
		maxJobsToActivate: 10,
		timeout: 30000,
	})

	setTimeout(() => {
		restJobWorker.stop()
		done()
	}, 3000)
})
