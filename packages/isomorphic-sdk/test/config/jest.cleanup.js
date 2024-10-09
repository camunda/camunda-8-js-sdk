const fs = require('fs')
const path = require('node:path')

const { XMLParser, XMLValidator } = require('fast-xml-parser')

// See: https://stackoverflow.com/a/74206721/1758461
// Without this, the paths in tsconfig.json are not resolved correctly
// eslint-disable-next-line @typescript-eslint/no-var-requires

const { OAuthProvider } = require('@camunda8/oauth')

const { CamundaRestClient } = require('../../../dist/c8rest/index.js')
const { OperateApiClient } = require('../../../dist/operate/index.js')

module.exports.cleanUp = async () => {
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
	const processIds = bpmn.map(
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
						if (!e.message.includes('404')) {
							console.log('Failed to cancel process instance', key)
							console.log(e.message)
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


/**
 * Read BPMN files and return an array of one or more parsed BPMN objects.
 * @param filenames - A single BPMN file path, or array of BPMN file paths.
 */
function parseBpmn(filenames) {
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
function getProcessId(bpmnString) {
	const jsonObj = BpmnParser.parser.parse(bpmnString)
	return jsonObj?.['bpmn:definitions']?.['bpmn:process']?.['@_id']
}

// Produce a starter worker file from a BPMN file
async function scaffold(filename) {
	const removeUndefined = (t) => !!t

	const buildEnumDictionaryFromArray = (a) =>
		a
			.filter(removeUndefined)
			.map((t) => ({ [t]: getConstantName(t) }))
			.reduce((prev, curr) => ({ ...prev, ...curr }), {})

	const bpmnObject = BpmnParser.parseBpmn(filename)[0]

	const taskTypes = await BpmnParser.getTaskTypes(bpmnObject)
	const taskEnumDict = buildEnumDictionaryFromArray(taskTypes)

	const interfaces = await BpmnParser.generateConstantsForBpmnFiles(filename)

	const headerInterfaces = {} // mutated in the recursive function

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
${headerInterfaces[t]
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

	async function scanForHeadersRecursively(obj) {
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
async function generateConstantsForBpmnFiles(
	filenames
) {
	const removeUndefined = (t) => !!t

	const buildEnumListFromArray = (a) =>
		a
			.filter(removeUndefined)
			.map((t) => `    ${getConstantName(t)} = "${t}"`)
			.join(',\n')

	if (typeof filenames === 'string') {
		filenames = [filenames]
	}

	const parsed = parseBpmn(filenames)
	const taskTypes = await getTaskTypes(parsed)
	const messageNames = await getMessageNames(parsed)
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
async function getTaskTypes(
	processes
) {
	const processArray = toArray(processes)
	return BpmnParser.mergeDedupeAndSort(
		await Promise.all(processArray.map(BpmnParser.scanBpmnObjectForTasks))
	)
}

/**
 * Take one or more parsed BPMN objects and return an array of unique message names.
 * @param processes - A parsed BPMN object, or an array of parsed BPMN objects.
 */
async function getMessageNames(
	processes
) {
	const processArray = toArray(processes)

	return mergeDedupeAndSort(
		await Promise.all(processArray.map(scanBpmnObjectForMessages))
	)
}

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

function mergeDedupeAndSort(arr) {
	return [...new Set([].concat(...arr).sort())]
}

/**
 * Return an array of task types.
 * @param bpmnObject - A parsed Bpmn object.
 */
async function scanBpmnObjectForTasks(bpmnObject) {
	let taskTypes = [] // mutated in the recursive function

	await scanRecursively(bpmnObject)
	return [...new Set(taskTypes.sort())]

	async function scanRecursively(obj) {
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
async function scanBpmnObjectForMessages(bpmnObject) {
	let messageNames = [] // mutated in the recursive function

	await scanRecursively(bpmnObject)
	return [...new Set(messageNames.sort())]

	async function scanRecursively(obj) {
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

