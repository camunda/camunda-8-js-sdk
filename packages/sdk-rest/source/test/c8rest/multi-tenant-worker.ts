
import test from 'ava'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {loadResourcesFromFiles} from '../helpers/_load-resources.js'

test('A worker can be multi-tenant', async t => {
	const client = new CamundaRestClient()

	t.timeout(10_000)

	await client.deployResources({
		resources: loadResourcesFromFiles([
			'./distribution/test/resources/multi-tenant-worker-test.bpmn',
		]),
		tenantId: '<default>',
	})

	await client.deployResources({
		resources:
		loadResourcesFromFiles(['./distribution/test/resources/multi-tenant-worker-test.bpmn']),
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
	await new Promise(resolve => {
		const w = client.createJobWorker({
			async jobHandler(job) {
				greenTenant ||= job.tenantId === 'green'
				defaultTenant ||= job.tenantId === '<default>'

				const outcome = job.complete()
				if (greenTenant && defaultTenant) {
					resolve(null)
				}

				void w.stop()
				return outcome
			},
			type: 'multi-tenant-work',
			tenantIds: ['<default>', 'green'],
			maxJobsToActivate: 2,
			worker: 'worker',
			timeout: 10_000,
		})
	})

	t.true(greenTenant)
	t.true(defaultTenant)
})
