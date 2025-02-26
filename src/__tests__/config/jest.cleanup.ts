import fs from 'fs'
import path from 'path'

import wtf from 'wtfnode'

// See: https://stackoverflow.com/a/74206721/1758461
// Without this, the paths in tsconfig.json are not resolved correctly
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tsconfig-paths').register()

import { OAuthProvider } from '../../oauth'
import { OperateApiClient } from '../../operate'
import { BpmnParser, ZeebeGrpcClient } from '../../zeebe'

export const cleanUp = async () => {
	// Your cleanup process here.
	console.log('Removing all cached OAuth tokens...')
	const o = new OAuthProvider({
		config: {
			CAMUNDA_OAUTH_URL: 'dummy',
			ZEEBE_CLIENT_ID: 'dummy',
			ZEEBE_CLIENT_SECRET: 'dummy',
		},
	})
	o.flushFileCache()
	if (process.env.CAMUNDA_UNIT_TEST == 'true') {
		// We are not running in an integration environment, so we can skip the rest of the cleanup
		return
	}
	console.log('Removing any running test process instances...')
	const filePath = path.join(__dirname, '..', 'testdata')
	const files = fs
		.readdirSync(filePath)
		.map((file) => path.join(filePath, file))
	const bpmn = BpmnParser.parseBpmn(files)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const processIds = (bpmn as any[]).map(
		(b) => b?.['bpmn:definitions']?.['bpmn:process']?.['@_id']
	)
	const zeebe = new ZeebeGrpcClient({
		config: {
			zeebeGrpcSettings: { ZEEBE_CLIENT_LOG_LEVEL: 'NONE' },
		},
	})
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
					},
				})
				const res = await operate.searchProcessInstances({
					filter: { bpmnProcessId: id, state: 'ACTIVE' },
				})
				const instancesKeys = res.items.map((instance) => instance.key)
				if (instancesKeys.length > 0) {
					console.log(
						`Cancelling ${instancesKeys.length} instances for ${id} in tenant '${tenantId}'...`
					)
				}
				for (const key of instancesKeys) {
					try {
						await zeebe.cancelProcessInstance(key)
						console.log(`Cancelled process instance ${key}`)
					} catch (e) {
						if (!(e as Error).message.startsWith('5 NOT_FOUND')) {
							console.log('Failed to cancel process instance', key)
							console.log((e as Error).message)
						}
					}
				}
			}
		}
		await zeebe.close()
	}
	wtf.dump()
}
