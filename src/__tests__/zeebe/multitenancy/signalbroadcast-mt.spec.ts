import { delay, restoreZeebeLogging, suppressZeebeLogging } from 'lib'
import { OperateApiClient } from 'operate'
import { ZeebeGrpcClient } from 'zeebe'

jest.setTimeout(7000)
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
	const redClient = new ZeebeGrpcClient({
		config: {
			CAMUNDA_TENANT_ID: 'red',
			ZEEBE_CLIENT_ID: 'redzeebe',
			ZEEBE_CLIENT_SECRET: 'redzecret',
		},
	})
	const operate = new OperateApiClient()
	/**
	 * Make sure that there are no pending instances of the test process running
	 */
	await Promise.all(
		await operate
			.searchProcessInstances({ filter: { bpmnProcessId: 'red-tenant' } })
			.then((res) =>
				res.items.map((i) => redClient.cancelProcessInstance(i.key))
			)
	)
	return new Promise((resolve) => {
		redClient
			.deployResource({
				processFilename: './src/__tests__/testdata/Red-Tenant-Process.bpmn',
			})
			.then(() => {
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
						expect(res.bpmnProcessId).toBe('red-tenant')
						expect(res.variables.test).toBe('valid')
						resolve(null)
					})
				delay(2000).then(() => {
					redClient.broadcastSignal({
						signalName: 'red-tenant-signal',
						variables: { test: 'valid' },
						tenantId: 'red',
					})
				})
			})
	})
})
