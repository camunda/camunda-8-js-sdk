import fs from 'fs'
import path from 'path'

import { XMLParser, XMLValidator } from 'fast-xml-parser'

// See: https://stackoverflow.com/a/74206721/1758461
// Without this, the paths in tsconfig.json are not resolved correctly
// eslint-disable-next-line @typescript-eslint/no-var-requires
require('tsconfig-paths').register()

import { OAuthProvider } from '@camunda8/oauth'

import { CamundaRestClient } from '../../c8rest'
import { OperateApiClient } from '../../operate'

export const cleanUp = async () => {
	/** An OAuthProvider is created just to flush the file system cache. */
	console.log('Removing all cached OAuth tokens...')
	const o = new OAuthProvider({
		config: {
			CAMUNDA_OAUTH_URL: 'dummy',
			ZEEBE_CLIENT_ID: 'dummy',
			ZEEBE_CLIENT_SECRET: 'dummy',
		},
	})
	o.flushFileCache()

	// If we are not running in an integration environment, we can skip the rest of the cleanup
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
	const zeebe = new CamundaRestClient({
		// config: { CAMUNDA_LOG_LEVEL: 'debug' },
	})
	for (const id of processIds) {
		if (id) {
			// Are we running in a multi-tenant environment?
			const isMultiTenant = !!process.env.CAMUNDA_TENANT_ID
			const tenantIds = isMultiTenant
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
						await zeebe.cancelProcessInstance({
							processInstanceKey: key,
						})
						console.log(`Cancelled process instance ${key}`)
					} catch (e) {
						if (!(e as Error).message.includes('404')) {
							console.log('Failed to cancel process instance', key)
							console.log((e as Error).message)
						} else {
							console.log('[404] Failed to cancel process instance', key)
						}
					}
				}
			}
		}
	}
}

// Converts, for example, task_type or task-type to TaskType
const getSafeName = (tasktype) =>
	tasktype
		.split('_')
		.map(([f, ...r]) => [f.toUpperCase(), ...r].join(''))
		.join('')
		.split('-')
		.map(([f, ...r]) => [f.toUpperCase(), ...r].join(''))
		.join('')

const getConstantName = (name) =>
	name.split('-').join('_').split(' ').join('_').toUpperCase()

const toArray = (stringOrArray) =>
	Array.isArray(stringOrArray) ? stringOrArray : [stringOrArray]

class BpmnParser {
	public static taskTypes

	/**
	 * Read BPMN files and return an array of one or more parsed BPMN objects.
	 * @param filenames - A single BPMN file path, or array of BPMN file paths.
	 */
	public static parseBpmn(filenames: string | string[]): object {
		if (typeof filenames === 'string') {
			filenames = [filenames]
		}
		return filenames.map((filename) => {
			if (filename) {
				const xmlData = fs.readFileSync(filename, 'utf8')
				if (xmlData && XMLValidator.validate(xmlData)) {
					return BpmnParser.parser.parse(xmlData)
				}
			}
			return {}
		})
	}

	// @ TODO: examine Camunda's parse BPMN code
	// https://github.com/camunda/camunda-bpmn-model/tree/master/src/main/java/org/camunda/bpm/model/bpmn
	public static getProcessId(bpmnString: string) {
		const jsonObj = BpmnParser.parser.parse(bpmnString)
		return jsonObj?.['bpmn:definitions']?.['bpmn:process']?.['@_id']
	}

	// Produce a starter worker file from a BPMN file
	public static async scaffold(filename: string) {
		const removeUndefined = (t) => !!t

		const buildEnumDictionaryFromArray = (a: string[]) =>
			a
				.filter(removeUndefined)
				.map((t) => ({ [t]: getConstantName(t) }))
				.reduce((prev, curr) => ({ ...prev, ...curr }), {})

		const bpmnObject = BpmnParser.parseBpmn(filename)[0]

		const taskTypes = await BpmnParser.getTaskTypes(bpmnObject)
		const taskEnumDict = buildEnumDictionaryFromArray(taskTypes)

		const interfaces = await BpmnParser.generateConstantsForBpmnFiles(filename)

		const headerInterfaces: { [key: string]: string[] } = {} // mutated in the recursive function

		await scanForHeadersRecursively(bpmnObject)

		const importStmnt = `import { ZBClient } from "zeebe-node"

const zbc = new ZBClient()
`
		const genericWorkflowVariables = `// @TODO Update with the shape of your job variables
// For better intellisense and type-safety
export interface WorkflowVariables {
	[key: string]: any
}`

		const workers = taskTypes
			.map(
				(t) => `// Worker for tasks of type "${t}"
${
	headerInterfaces[t]
		? headerInterfaces[t].join('|')
		: 'type ' + getSafeName(t) + 'CustomHeaders = never'
}

export const ${getSafeName(t)}Worker = zbc.createWorker<
WorkflowVariables,
${getSafeName(t)}CustomHeaders,
WorkflowVariables
>({ taskType: TaskType.${taskEnumDict[t]},
	taskHandler: job => {
		console.log(job)
		return job.complete()
	}
})
`
			)
			.join('\n')

		return `${importStmnt}
${genericWorkflowVariables}
${interfaces}
${workers}`

		async function scanForHeadersRecursively(obj: object) {
			if (!(obj instanceof Object)) {
				return
			}
			for (const k in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, k)) {
					if (k === 'bpmn:serviceTask') {
						const tasks = toArray(obj[k])
						tasks.forEach((t) => {
							const taskHeaders =
								t['bpmn:extensionElements']['zeebe:taskHeaders']
							const customHeaderNames = taskHeaders
								? toArray(taskHeaders['zeebe:header']).map((h) => h['@_key'])
								: undefined

							const tasktype =
								t['bpmn:extensionElements']['zeebe:taskDefinition']['@_type']
							const headerInterfaceName = getSafeName(tasktype)
							if (customHeaderNames) {
								const headerInterfaceDfnBody = customHeaderNames
									.sort()
									.map((h) => '    ' + h + ': string')
									.join('\n')
								const headerInterfaceDfn = `interface ${headerInterfaceName}CustomHeaders {
${headerInterfaceDfnBody}
}`
								if (!headerInterfaces[tasktype]) {
									headerInterfaces[tasktype] = [headerInterfaceDfn]
								} else {
									if (
										headerInterfaces[tasktype].filter(
											(d) => d === headerInterfaceDfn
										).length === 0
									) {
										headerInterfaces[tasktype].push(
											`{
${headerInterfaceDfnBody}
}`
										)
									}
								}
							}
						})
					} else {
						// recursive call to scan property
						await scanForHeadersRecursively(obj[k])
					}
				}
			}
		}
	}

	/**
	 * Generate TypeScript constants for task types and message names in BPMN files
	 * @param filenames - a BPMN file path or array of BPMN file paths
	 */
	public static async generateConstantsForBpmnFiles(
		filenames: string | string[]
	): Promise<string> {
		const removeUndefined = (t) => !!t

		const buildEnumListFromArray = (a) =>
			a
				.filter(removeUndefined)
				.map((t) => `    ${getConstantName(t)} = "${t}"`)
				.join(',\n')

		if (typeof filenames === 'string') {
			filenames = [filenames]
		}

		const parsed = BpmnParser.parseBpmn(filenames)
		const taskTypes = await BpmnParser.getTaskTypes(parsed)
		const messageNames = await BpmnParser.getMessageNames(parsed)
		const files = filenames.map((f) => path.basename(f))
		const taskEnumMembers = buildEnumListFromArray(taskTypes)
		const messageEnumMembers = buildEnumListFromArray(messageNames)

		return `
// Autogenerated constants for ${files}

export enum TaskType {
${taskEnumMembers}
}

export enum MessageName {
${messageEnumMembers}
}

`
	}

	/**
	 * Take one or more parsed BPMN objects and return an array of unique task types.
	 * @param processes - A parsed BPMN object, or an array of parsed BPMN objects.
	 */
	public static async getTaskTypes(
		processes: object[] | object
	): Promise<string[]> {
		const processArray = toArray(processes)
		return BpmnParser.mergeDedupeAndSort(
			await Promise.all(processArray.map(BpmnParser.scanBpmnObjectForTasks))
		)
	}

	/**
	 * Take one or more parsed BPMN objects and return an array of unique message names.
	 * @param processes - A parsed BPMN object, or an array of parsed BPMN objects.
	 */
	public static async getMessageNames(
		processes: object[] | object
	): Promise<string[]> {
		const processArray = toArray(processes)

		return BpmnParser.mergeDedupeAndSort(
			await Promise.all(processArray.map(BpmnParser.scanBpmnObjectForMessages))
		)
	}

	private static parserOptions = {
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

	private static parser = new XMLParser(BpmnParser.parserOptions)

	private static mergeDedupeAndSort(arr) {
		return [...new Set([].concat(...arr).sort())]
	}

	/**
	 * Return an array of task types.
	 * @param bpmnObject - A parsed Bpmn object.
	 */
	private static async scanBpmnObjectForTasks(bpmnObject: object) {
		let taskTypes: string[] = [] // mutated in the recursive function

		await scanRecursively(bpmnObject)
		return [...new Set(taskTypes.sort())]

		async function scanRecursively(obj: object) {
			if (!(obj instanceof Object)) {
				return // not an Object so obj[k] here is a value
			}
			for (const k in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, k)) {
					if (k === 'bpmn:serviceTask') {
						const tasks = toArray(obj[k])
						taskTypes = taskTypes.concat(
							tasks.map(
								(t) =>
									t['bpmn:extensionElements']['zeebe:taskDefinition']['@_type']
							)
						)
					} else {
						// recursive call to scan property
						await scanRecursively(obj[k])
					}
				}
			}
		}
	}
	/**
	 * Return an array of message names.
	 * @param bpmnObject - A parsed Bpmn object.
	 */
	private static async scanBpmnObjectForMessages(bpmnObject: object) {
		let messageNames: string[] = [] // mutated in the recursive function

		await scanRecursively(bpmnObject)
		return [...new Set(messageNames.sort())]

		async function scanRecursively(obj: object) {
			if (!(obj instanceof Object)) {
				return // not an Object so obj[k] here is a value
			}
			for (const k in obj) {
				if (Object.prototype.hasOwnProperty.call(obj, k)) {
					if (k === 'bpmn:message') {
						const messages = toArray(obj[k])

						messageNames = messageNames.concat(messages.map((m) => m['@_name']))
					} else {
						// recursive call to scan property
						await scanRecursively(obj[k])
					}
				}
			}
		}
	}
}

/*

Bearer eyJhbGciOiJSUzI1NiIsInR5cCIgOiAiSldUIiwia2lkIiA6ICJKMEVYRW1TN0JiSGJYSjRJajhsZFpwbWxjcl83UkFsNTU0SHgzbWxiT3BzIn0.eyJleHAiOjE3Mjc5MjEzNTgsImlhdCI6MTcyNzkyMTA1OCwianRpIjoiMjU0YTExYjQtYmY3ZS00OGEyLTlkMTYtZGVmMGZkNWE3MjFmIiwiaXNzIjoiaHR0cDovL2xvY2FsaG9zdDoxODA4MC9hdXRoL3JlYWxtcy9jYW11bmRhLXBsYXRmb3JtIiwiYXVkIjpbInplZWJlIiwidGFza2xpc3QtYXBpIiwiemVlYmUtYXBpIiwib3BlcmF0ZS1hcGkiLCJvcHRpbWl6ZS1hcGkiLCJ3ZWItbW9kZWxlci1wdWJsaWMtYXBpIiwiYWNjb3VudCJdLCJzdWIiOiJkMDQxZGQyMi02YmMwLTQzMzAtOGVjYi1iMmM4ZjA3ZjZhZmUiLCJ0eXAiOiJCZWFyZXIiLCJhenAiOiJ6ZWViZSIsImFjciI6IjEiLCJyZWFsbV9hY2Nlc3MiOnsicm9sZXMiOlsiRGVmYXVsdCB1c2VyIHJvbGUiXX0sInJlc291cmNlX2FjY2VzcyI6eyJ0YXNrbGlzdC1hcGkiOnsicm9sZXMiOlsicmVhZDoqIiwid3JpdGU6KiJdfSwiemVlYmUtYXBpIjp7InJvbGVzIjpbIndyaXRlOioiXX0sIm9wZXJhdGUtYXBpIjp7InJvbGVzIjpbInJlYWQ6KiIsIndyaXRlOioiXX0sIm9wdGltaXplLWFwaSI6eyJyb2xlcyI6WyJ3cml0ZToqIl19LCJ3ZWItbW9kZWxlci1wdWJsaWMtYXBpIjp7InJvbGVzIjpbImRlbGV0ZToqIiwicmVhZDoqIiwidXBkYXRlOioiLCJjcmVhdGU6KiJdfSwiYWNjb3VudCI6eyJyb2xlcyI6WyJtYW5hZ2UtYWNjb3VudCIsIm1hbmFnZS1hY2NvdW50LWxpbmtzIiwidmlldy1wcm9maWxlIl19fSwic2NvcGUiOiJwcm9maWxlIGVtYWlsIiwiZW1haWxfdmVyaWZpZWQiOmZhbHNlLCJjbGllbnRIb3N0IjoiMTkyLjE2OC42NS4xIiwicGVybWlzc2lvbnMiOnsidGFza2xpc3QtYXBpIjpbInJlYWQ6KiIsIndyaXRlOioiXSwiemVlYmUtYXBpIjpbIndyaXRlOioiXSwib3BlcmF0ZS1hcGkiOlsicmVhZDoqIiwid3JpdGU6KiJdLCJvcHRpbWl6ZS1hcGkiOlsid3JpdGU6KiJdLCJ3ZWItbW9kZWxlci1wdWJsaWMtYXBpIjpbImRlbGV0ZToqIiwicmVhZDoqIiwidXBkYXRlOioiLCJjcmVhdGU6KiJdLCJhY2NvdW50IjpbIm1hbmFnZS1hY2NvdW50IiwibWFuYWdlLWFjY291bnQtbGlua3MiLCJ2aWV3LXByb2ZpbGUiXX0sInByZWZlcnJlZF91c2VybmFtZSI6InNlcnZpY2UtYWNjb3VudC16ZWViZSIsImNsaWVudEFkZHJlc3MiOiIxOTIuMTY4LjY1LjEiLCJjbGllbnRfaWQiOiJ6ZWViZSJ9.L-uRPUJ2Rf2fOXaSGYusgslSdNjX1Jn1oBpuvdzCNVscbxXMG_8Ht-KrQq1kz4U1ZxB3lsUFDUS0MtNublTzaCDQR6p4RxJvZhx6o0FRhmKjnwnMc4_d65vTgUdZo3Td6D-Eg-vHLodFBmI6Tz1SUh7thKnw3zhVNyqZPSQrb-PVk4FG6qyqCgMbDobrEdS-iSL478uQVvvTwf1ncNOGtkr5JPuUfqRzPAznpxemi3LLZvCwD7i-zu9_ScgOT_w14XvfXlYCGik0_MbsgON1LqXSPaOlAis4DxH5dCsreeNqfHltdwg9MAnaluRHe9Sp-IBSvvrFPJDqvmTy66pCoA


--header "Authorization: Bearer ${TOKEN}"

curl -L -X POST 'http://localhost:8080/v2/process-instances/2251799815012486/cancellation' \
-H 'Content-Type: application/json' \
--header "Authorization: Bearer ${TOKEN}" \
--data-raw '{}'

*/
