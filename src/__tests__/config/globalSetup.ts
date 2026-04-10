import fs from 'node:fs'
import path from 'node:path'

// eslint-disable-next-line import/order

import { HTTPError } from 'got'

import { Camunda8 } from '../../index'
import { OAuthProvider } from '../../oauth'
import { OperateApiClient } from '../../operate'
import { BpmnParser, ZeebeGrpcClient } from '../../zeebe'

function log(message: string) {
	if (process.env.CAMUNDA_TEST_VERBOSE_LOGGING === 'true')
		log(`[globalSetup] ${message}`)
}

async function cleanup() {
	// Your cleanup process here.
	log('Removing all cached OAuth tokens...')
	OAuthProvider.clearCacheDir()
	if (process.env.CAMUNDA_UNIT_TEST == 'true') {
		// We are not running in an integration environment, so we can skip the rest of the cleanup
		return
	}
	log('Removing any running test process instances...')
	const filePath = path.join(__dirname, '..', 'testdata')
	const files = fs
		.readdirSync(filePath)
		.map((file) => path.join(filePath, file))
		.filter((file) => fs.statSync(file).isFile())

	const bpmn = BpmnParser.parseBpmn(files)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const processIds = (bpmn as any[]).map(
		(b) => b?.['bpmn:definitions']?.['bpmn:process']?.['@_id']
	)

	if (process.env.TEST_VERSION === '8.8') {
		log(`Searching for existing process instances using 8.8 client`)
		return cleanup8_8(processIds).then(() => {
			/* wtf.dump() */
		})
	} else {
		log(`Searching for existing process instances using 8.7 client`)
		return cleanup8_7(processIds).then(() => {
			/* wtf.dump() */
		})
	}
}

async function cleanup8_8(processIds) {
	const c8 = new Camunda8()
	for (const id of processIds) {
		if (id) {
			// Are we running in a multi-tenant environment?
			const multiTenant = !!process.env.CAMUNDA_TENANT_ID
			const tenantIds = multiTenant
				? ['<default>', 'red', 'green']
				: ['<default>']
			for (const tenantId of tenantIds) {
				const camunda = c8.getCamundaRestClient({
					CAMUNDA_TENANT_ID: tenantId,
				})
				const processes = await camunda
					.searchProcessInstances({
						filter: {
							processDefinitionId: id,
							state: 'ACTIVE',
						},
					})
					.catch((e) => {
						log(`Error searching for process instances`)
						log(e.message)
						return { items: [] }
					})
				const instancesKeys = processes.items.map(
					(instance) => instance.processInstanceKey
				)
				if (instancesKeys.length > 0) {
					log(
						`Cancelling ${instancesKeys.length} instances for ${id} in tenant '${tenantId}'...`
					)
				}
				for (const key of instancesKeys) {
					try {
						const res = await camunda.cancelProcessInstance({
							processInstanceKey: key,
						})
						log(`Cancelled process instance ${key}`)
						log('res')
						log(JSON.stringify(res, null, 2))
					} catch (e) {
						if (!(e as HTTPError).message.includes('404')) {
							log('Failed to cancel process instance')
							log(key)
							log((e as Error).message)
						}
					}
				}
			}
		}
	}
}

async function cleanup8_7(processIds) {
	const zeebe = new ZeebeGrpcClient({
		config: {
			zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_EAGER_CONNECT: false },
		},
	})
	// Wait for the zeebe.connected property to be true
	// while (!zeebe.connected) {
	// 	// log('Waiting for Zeebe connection...')
	// 	await new Promise((resolve) => setTimeout(resolve, 100))
	// }
	for (const id of processIds) {
		if (id) {
			// Are we running in a multi-tenant environment?
			const multiTenant = !!process.env.CAMUNDA_TENANT_ID
			const tenantIds = multiTenant
				? ['<default>', 'red', 'green']
				: [undefined]
			for (const tenantId of tenantIds) {
				const operate = new OperateApiClient({
					config: {
						CAMUNDA_TENANT_ID: tenantId,
						CAMUNDA_LOG_LEVEL: 'debug',
					},
				})
				const res = await operate.searchProcessInstances({
					filter: { bpmnProcessId: id, state: 'ACTIVE' },
				})

				const instancesKeys = res.items.map((instance) => instance.key)
				if (instancesKeys.length > 0) {
					log(
						`Canceling ${instancesKeys.length} instances for ${id} in tenant '${tenantId}'...`
					)
				}
				for (const key of instancesKeys) {
					try {
						// await operate.deleteProcessInstance(key)
						await zeebe.cancelProcessInstance(key)
						log(`Canceled process instance ${key}`)
					} catch (e) {
						if (!(e as Error).message.startsWith('5 NOT_FOUND')) {
							log(`Failed to cancel process instance`)
							log(key)
							log((e as Error).message)
						}
					}
				}
			}
		}
	}
	await zeebe.close()
}
let previousLogState: string | undefined

/**
 * This now needs to be done in the test setup, because environment configuration is concretized and happens
 * when the SDK is loaded into memory.
 */
export function suppressZeebeLogging() {
	previousLogState = process.env.ZEEBE_CLIENT_LOG_LEVEL
	process.env.ZEEBE_CLIENT_LOG_LEVEL = 'NONE'
}

export function restoreZeebeLogging() {
	process.env.ZEEBE_CLIENT_LOG_LEVEL = previousLogState
}

export async function setup() {
	suppressZeebeLogging()
	await cleanup()
}

export async function teardown() {
	await cleanup()
	restoreZeebeLogging()
}
