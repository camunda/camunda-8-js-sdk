import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'
import { ZeebeGrpcClient } from 'zeebe'

suppressZeebeLogging()

afterAll(() => restoreZeebeLogging())
test('Multi-tenant Zeebe: Will throw an error if no tenantId is provided when broadcasting a signal to multi-tenant-enabled Zeebe broker', async () => {
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '', // Erase tenantId
		},
	})
	let thrown = false
	await zbc.broadcastSignal({ signalName: 'test' }).catch((e) => {
		thrown = true
		expect(e.code).toBe(3)
	})
	expect(thrown).toBe(true)
})

test('Multi-tenant Zeebe: Will throw an error if wrong tenantId is provided when broadcasting a signal to multi-tenant-enabled Zeebe broker', async () => {
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '<unknown>', // Wrong tenantId
		},
	})
	let thrown = false
	await zbc.broadcastSignal({ signalName: 'test' }).catch((e) => {
		thrown = true
		expect(e.code).toBe(3)
	})
	expect(thrown).toBe(true)
})

test('Multi-tenant Zeebe: No error if tenantId is provided when broadcasting a signal to multi-tenant-enabled Zeebe broker', async () => {
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: '<default>', // Correct tenantId
		},
	})
	let thrown = false
	await zbc.broadcastSignal({ signalName: 'test' }).catch(() => {
		thrown = true
	})
	expect(thrown).toBe(false)
})

test('Signal broadcast to red tenant is received', async () => {
	return new Promise((resolve) => {
		const redClient = new ZeebeGrpcClient({
			config: {
				CAMUNDA_TENANT_ID: 'red',
				ZEEBE_CLIENT_ID: 'redzeebe',
				ZEEBE_CLIENT_SECRET: 'redzecret',
			},
		})
		redClient
			.deployResource({
				processFilename: './src/__tests__/testdata/Red-Tenant-Process.bpmn',
			})
			.then((p) => {
				console.log(
					`Deployed process with bpmnProcessId: ${p.deployments[0].process.bpmnProcessId}`
				)
				redClient.broadcastSignal({
					signalName: 'red-tenant-signal',
					variables: { test: 'valid' },
					tenantId: 'red',
				})
				redClient
					.createProcessInstanceWithResult({
						bpmnProcessId: 'red-tenant',
						variables: {},
					})
					.then((res) => {
						console.log('Finished process on red tenant')
						expect(res.bpmnProcessId).toBe('red-tenant')
						expect(res.variables.test).toBe('valid')
						resolve(null)
					})
				console.log(`Started process with bpmnProcessId: red-tenant`)
				redClient
					.broadcastSignal({
						signalName: 'red-tenant-signal',
						variables: { test: 'valid' },
						tenantId: 'red',
					})
					.then((res) => console.log(res))
				console.log(`Broadcast signal with name: red-tenant-signal`)
			})
	})
})
