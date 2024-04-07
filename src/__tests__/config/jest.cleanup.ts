import fs from 'fs'
import path from 'path'

// See: https://stackoverflow.com/a/74206721/1758461
// Without this, the paths in tsconfig.json are not resolved correctly
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tsconfig-paths').register()

import { BpmnParser, ZeebeGrpcClient } from 'zeebe'

import { OAuthProvider } from '../../oauth'
import { OperateApiClient } from '../../operate'

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
	const operate = new OperateApiClient()
	const zeebe = new ZeebeGrpcClient({
		config: {
			zeebeGrpcSettings: { ZEEBE_CLIENT_LOG_LEVEL: 'NONE' },
		},
	})
	for (const id of processIds) {
		if (id) {
			const res = await operate.searchProcessInstances({
				filter: { bpmnProcessId: id, state: 'ACTIVE' },
			})
			const instancesKeys = res.items.map((instance) => instance.key)
			if (instancesKeys.length > 0) {
				console.log(`Cancelling ${instancesKeys.length} instances for ${id}`)
			}
			for (const key of instancesKeys) {
				try {
					await zeebe.cancelProcessInstance(key)
				} catch (e) {
					console.log('Error cancelling process instance', key)
					console.log((e as Error).message)
				}
			}
		}
	}
}
