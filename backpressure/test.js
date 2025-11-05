/* eslint-disable @typescript-eslint/no-explicit-any */
const { CamundaRestClient } = require('../dist/c8/lib/CamundaRestClient')

const camunda = new CamundaRestClient()

async function main() {
	// We want to provoke an error and examine the error stack, and the headers.
	await camunda
		.activateJobs({
			timeout: 1000,
			maxJobsToActivate: 1,
			// type: 'non-existing-job-type',
			worker: 'test',
		}).catch(e => console.error('Caught error:', e))

}

main()
