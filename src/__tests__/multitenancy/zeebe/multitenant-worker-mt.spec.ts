import { ZeebeGrpcClient } from '../../../zeebe/index'

jest.setTimeout(10000)

test('A worker can be multi-tenant', async () => {
	const client = new ZeebeGrpcClient()

	await client.deployResource({
		processFilename: './src/__tests__/testdata/multi-tenant-worker-test.bpmn',
		tenantId: '<default>',
	})

	await client.deployResource({
		processFilename: './src/__tests__/testdata/multi-tenant-worker-test.bpmn',
		tenantId: 'green',
	})

	await client.createProcessInstance({
		bpmnProcessId: 'multi-tenant-worker-test',
		variables: { foo: 'bar' },
		tenantId: '<default>',
	})

	await client.createProcessInstance({
		bpmnProcessId: 'multi-tenant-worker-test',
		variables: { foo: 'bar' },
		tenantId: 'green',
	})

	let greenTenant = false,
		defaultTenant = false
	await new Promise((resolve) =>
		client.createWorker({
			taskHandler: (job) => {
				greenTenant = greenTenant || job.tenantId === 'green'
				defaultTenant = defaultTenant || job.tenantId === '<default>'
				if (greenTenant && defaultTenant) {
					resolve(null)
				}
				return job.complete()
			},
			taskType: 'multi-tenant-work',
			tenantIds: ['<default>', 'green'],
		})
	)

	await client.close()
})

test('A stream worker can be multi-tenant', async () => {
	const client = new ZeebeGrpcClient()

	await client.deployResource({
		processFilename:
			'./src/__tests__/testdata/multi-tenant-stream-worker-test.bpmn',
		tenantId: '<default>',
	})

	await client.deployResource({
		processFilename:
			'./src/__tests__/testdata/multi-tenant-stream-worker-test.bpmn',
		tenantId: 'green',
	})

	let greenTenant = false,
		defaultTenant = false
	// eslint-disable-next-line no-async-promise-executor
	await new Promise(async (resolve) => {
		client.streamJobs({
			taskHandler: async (job) => {
				greenTenant = greenTenant || job.tenantId === 'green'
				defaultTenant = defaultTenant || job.tenantId === '<default>'
				const res = await job.complete()
				if (greenTenant && defaultTenant) {
					resolve(null)
				}
				return res
			},
			type: 'multi-tenant-stream-work',
			tenantIds: ['<default>', 'green'],
			worker: 'stream-worker',
			timeout: 2000,
		})

		await new Promise((resolve) => setTimeout(resolve, 2000))

		await client.createProcessInstance({
			bpmnProcessId: 'multi-tenant-stream-worker-test',
			variables: { foo: 'bar' },
			tenantId: '<default>',
		})

		await client.createProcessInstance({
			bpmnProcessId: 'multi-tenant-stream-worker-test',
			variables: { foo: 'bar' },
			tenantId: 'green',
		})
	})

	await client.close()
})
