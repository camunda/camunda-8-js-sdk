import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { matrix } from '../../../test-support/testTags'

// https://github.com/camunda/camunda-8-js-sdk/issues/424
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
	'REST worker will cancel inflight call on close',
	() =>
		new Promise((done) => {
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
				done(void 0)
			}, 3000)
		})
)
