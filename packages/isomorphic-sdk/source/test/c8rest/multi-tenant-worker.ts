/* eslint-disable no-promise-executor-return */
import test from 'ava'
import {CamundaRestClient} from '../../c8-rest/index.js'

test('A worker can be multi-tenant', async () => {
	const client = new CamundaRestClient()

	await client.deployResourcesFromFiles({
		files: ['./distribution/test/resources/multi-tenant-worker-test.bpmn'],
		tenantId: '<default>',
	})

	await client.deployResourcesFromFiles({
		files: ['./distribution/test/resources/multi-tenant-worker-test.bpmn'],
		tenantId: 'green',
	})

	await client.createProcessInstance({
		processDefinitionId: 'multi-tenant-worker-test',
		variables: {foo: 'bar'},
		tenantId: '<default>',
	})

	await client.createProcessInstance({
		processDefinitionId: 'multi-tenant-worker-test',
		variables: {foo: 'bar'},
		tenantId: 'green',
	})

	let greenTenant = false;
	let defaultTenant = false
	await new Promise(resolve =>
		client.createJobWorker({
			async jobHandler(job) {
				greenTenant ||= job.tenantId === 'green'
				defaultTenant ||= job.tenantId === '<default>'
				if (greenTenant && defaultTenant) {
					resolve(null)
				}

				return job.complete()
			},
			type: 'multi-tenant-work',
			tenantIds: ['<default>', 'green'],
			maxJobsToActivate: 2,
			worker: 'worker',
			timeout: 10_000,
		}),
	)
})
