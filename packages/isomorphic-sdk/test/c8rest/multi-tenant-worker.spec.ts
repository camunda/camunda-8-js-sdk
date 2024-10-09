import { CamundaRestClient } from '../../src'

test('A worker can be multi-tenant', async () => {
	const client = new CamundaRestClient()

	await client.deployResourcesFromFiles({
		files: ['./src/__tests__/testdata/multi-tenant-worker-test.bpmn'],
		tenantId: '<default>',
	})

	await client.deployResourcesFromFiles({
		files: ['./src/__tests__/testdata/multi-tenant-worker-test.bpmn'],
		tenantId: 'green',
	})

	await client.createProcessInstance({
		processDefinitionId: 'multi-tenant-worker-test',
		variables: { foo: 'bar' },
		tenantId: '<default>',
	})

	await client.createProcessInstance({
		processDefinitionId: 'multi-tenant-worker-test',
		variables: { foo: 'bar' },
		tenantId: 'green',
	})

	let greenTenant = false,
		defaultTenant = false
	await new Promise((resolve) =>
		client.createJobWorker({
			jobHandler: (job) => {
				greenTenant = greenTenant || job.tenantId === 'green'
				defaultTenant = defaultTenant || job.tenantId === '<default>'
				if (greenTenant && defaultTenant) {
					resolve(null)
				}
				return job.complete()
			},
			type: 'multi-tenant-work',
			tenantIds: ['<default>', 'green'],
			maxJobsToActivate: 2,
			worker: 'worker',
			timeout: 10000,
		})
	)
})
