/* eslint-disable @typescript-eslint/naming-convention */
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import {XMLParser} from 'fast-xml-parser'
import {OAuthProvider} from '@camunda8/oauth'
import {HTTPError} from 'ky'
import {CamundaRestClient} from '../../c8-rest/index.js'
import {OperateApiClient} from '../../operate/index.js'

const parserOptions = {
	allowBooleanAttributes: false,
	attrNodeName: 'attr',
	attributeNamePrefix: '@_',
	cdataPositionChar: '\\c',
	cdataTagName: '__cdata',
	ignoreAttributes: false,
	ignoreNameSpace: false,
	localeRange: '',
	parseAttributeValue: false,
	parseNodeValue: true,
	parseTrueNumberOnly: false,
	textNodeName: '#text',
	trimValues: true,
}

const parser = new XMLParser(parserOptions)

async function cleanUp() {
	/** An OAuthProvider is created just to flush the file system cache. */
	console.log('Removing all cached OAuth tokens...')
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_OAUTH_URL: 'dummy',
			ZEEBE_CLIENT_ID: 'dummy',
			ZEEBE_CLIENT_SECRET: 'dummy',
		},
	})
	o.flushFileCache()

	// If we are not running in an integration environment, we can skip the rest of the cleanup
	if (process.env.CAMUNDA_UNIT_TEST === 'true') {
		return
	}

	console.log('Removing any running test process instances...')
	const filePath = path.join('.', 'distribution', 'test', 'resources')
	const files = fs
		.readdirSync(filePath)
		.map(file => path.join(filePath, file))

	const processIds = files.map(
		(path): string => {
			const bpmnString = fs.readFileSync(path, 'utf8')
			const jsonObject = parser.parse(bpmnString) as Record<string, string>
			return jsonObject?.['bpmn:definitions']?.['bpmn:process']?.['@_id'] as string
		},
	)

	const zeebe = new CamundaRestClient({
		// Config: { CAMUNDA_LOG_LEVEL: 'debug' },
	})
	for (const id of processIds) {
		if (id) {
			// Are we running in a multi-tenant environment?
			const isMultiTenant = Boolean(process.env.CAMUNDA_TENANT_ID)
			const tenantIds = isMultiTenant
				? ['<default>', 'red', 'green']
				: [undefined]
			for (const tenantId of tenantIds) {
				const operate = new OperateApiClient({
					config: {
						CAMUNDA_TENANT_ID: tenantId,
					},
				})
				// eslint-disable-next-line no-await-in-loop
				const response = await operate.searchProcessInstances({
					filter: {bpmnProcessId: id, state: 'ACTIVE'},
				})
				const instancesKeys = response.items.map(instance => instance.key)
				if (instancesKeys.length > 0) {
					console.log(
						`Cancelling ${instancesKeys.length} instances for ${id} in tenant '${tenantId}'...`,
					)
				}

				for (const key of instancesKeys) {
					// eslint-disable-next-line max-depth
					try {
						// eslint-disable-next-line no-await-in-loop
						await zeebe.cancelProcessInstance({
							processInstanceKey: key,
						})
						console.log(`Cancelled process instance ${key}`)
					} catch (error: unknown) {
						// eslint-disable-next-line max-depth
						if (error instanceof HTTPError && error.message.includes('404')) {
							console.log('[404] Failed to cancel process instance', key)
						} else {
							console.log('Failed to cancel process instance', key)
							console.log((error as any).message)
						}
					}
				}
			}
		}
	}
}

// eslint-disable-next-line unicorn/prefer-top-level-await
void cleanUp()
