import fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import { packageVersion } from '../lib/GetPackageVersion'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
} from './Configuration'

export class CamundaSupportLogger {
	private static instance: CamundaSupportLogger
	private readonly enabled: boolean | undefined
	private readonly filepath: string

	private constructor(config?: DeepPartial<CamundaPlatform8Configuration>) {
		const mergedConfig =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config || {})
		this.enabled = mergedConfig?.CAMUNDA_SUPPORT_LOG_ENABLED

		const filename =
			mergedConfig?.CAMUNDA_SUPPORT_LOG_FILE_PATH ||
			path.join(process.cwd(), 'camunda-support.log')
		this.filepath = filename

		if (!this.enabled) {
			return
		}

		if (fs.existsSync(this.filepath)) {
			/** Add sequentially increasing numbers to the file name if the file already exists, until we get a unique name */
			let n = 1
			while (fs.existsSync(this.filepath)) {
				this.filepath = `${filename}-${n++}`
			}
		}
		this.log(`********************************************************`, false)
		this.log(
			`Camunda Support Debugging log. You can supply this log to Camunda Technical Support to assist in troubleshooting issues\n`,
			false
		)
		this.log(`* https://camunda.com/services/camunda-success/`, false)
		this.log(`* https://github.com/camunda/camunda-8-js-sdk/issues\n`, false)
		this.log(
			`**WARNING**: This log can contain sensitive application data. Scan it before uploading it to a public site such as GitHub`,
			false
		)
		this.log(
			`********************************************************\n`,
			false
		)

		/** Log Date */
		this.log(`CamundaSupportLogger initialized. Logging to ${this.filepath}\n`)

		/** Log SDK version */
		this.log(`Camunda SDK version: ${packageVersion}\n`, false)
		/** OS information */
		const osInfo = getOSInfo()
		this.log(
			`/** OS Information */\n${JSON.stringify(osInfo, null, 2)}\n`,
			false
		)
		/** Node version */
		const nodeVersion = process.release
		this.log(
			`/** Node Version */\n${JSON.stringify(nodeVersion, null, 2)}\n`,
			false
		)

		/** Log Configuration */
		const sanitizedConfig = safeStringify(mergedConfig)
		this.log(`/** Configuration */\n${sanitizedConfig}\n`, false)
	}

	public static getInstance(): CamundaSupportLogger {
		if (!CamundaSupportLogger.instance) {
			CamundaSupportLogger.instance = new CamundaSupportLogger()
		}
		return CamundaSupportLogger.instance
	}

	public log(
		message: string | number | boolean | object,
		addTimestamp = true
	): void {
		if (!this.enabled) {
			return
		}
		const _message =
			typeof message === 'object'
				? safeStringify(message)
				: typeof message === 'string'
					? sanitizeSensitiveString(message)
					: message

		const logMessage = addTimestamp
			? `[${new Date().toISOString()}]: ${_message}\n`
			: `${_message}\n`
		try {
			// If this is async then messages are written out of order, which doesn't help with debugging
			fs.appendFileSync(this.filepath, logMessage)
		} catch (err) {
			console.error(
				`Failed to write log to ${this.filepath}:`,
				errorForLogging(err)
			)
		}
	}
}

/** Function to get OS information */
function getOSInfo() {
	return {
		platform: os.platform(), // 'darwin', 'win32', 'linux', etc.
		release: os.release(), // OS release version
		type: os.type(), // OS name (e.g., 'Darwin', 'Windows_NT', 'Linux')
		arch: os.arch(), // CPU architecture (e.g., 'x64', 'arm64')
		version: os.version(), // OS version
		hostname: os.hostname(), // Computer hostname
		totalmem: os.totalmem(), // Total memory in bytes
		freemem: os.freemem(), // Free memory in bytes
		cpus: os.cpus().length, // Number of CPU cores
		uptime: os.uptime(), // System uptime in seconds
	}
}

const REDACTED = '[REDACTED]'
// Keys matched exactly (after normalization) because they are too generic to
// match as suffixes.
const SENSITIVE_LOG_KEYS = new Set([
	'cert',
	'certificateauthority',
	'form',
	'json',
	'key',
])
const SENSITIVE_LOG_KEY_SUFFIXES = [
	'accesstoken',
	'apikey',
	'authorization',
	'body',
	'certchain',
	'certificate',
	'certstring',
	'clientassertion',
	'clientsecret',
	'cookie',
	'idtoken',
	'password',
	'passphrase',
	'privatekey',
	'refreshtoken',
	'rootcert',
	'rootcerts',
	'secret',
	'token',
]

const SENSITIVE_LOG_ASSIGNMENT_KEY_SUFFIXES = [
	'accesstoken',
	'access_token',
	'access-token',
	'apikey',
	'api_key',
	'api-key',
	'authorization',
	'clientassertion',
	'client_assertion',
	'client-assertion',
	'clientsecret',
	'client_secret',
	'client-secret',
	'cookie',
	'idtoken',
	'id_token',
	'id-token',
	'password',
	'passphrase',
	'refreshtoken',
	'refresh_token',
	'refresh-token',
	'secret',
	'token',
]
const SENSITIVE_LOG_ASSIGNMENT_VALUE_PATTERN =
	/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\[[^\]]*\]|[^\s&,;}]+/y
const PRIVATE_KEY_BEGIN_PREFIX = '-----BEGIN '
const PRIVATE_KEY_END_PREFIX = '-----END '
const PRIVATE_KEY_BEGIN_PATTERN = /-----BEGIN (?:[^-\s]+ )?PRIVATE KEY-----/y
const PRIVATE_KEY_END_PATTERN = /-----END (?:[^-\s]+ )?PRIVATE KEY-----/y

function isSensitiveLogKey(key: string) {
	const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
	return (
		SENSITIVE_LOG_KEYS.has(normalizedKey) ||
		SENSITIVE_LOG_KEY_SUFFIXES.some((suffix) => normalizedKey.endsWith(suffix))
	)
}

function isAsciiAlphaNumeric(character: string | undefined) {
	if (!character) {
		return false
	}
	const code = character.charCodeAt(0)
	return (
		(code >= 48 && code <= 57) ||
		(code >= 65 && code <= 90) ||
		(code >= 97 && code <= 122)
	)
}

function isNamespacePrefix(key: string, start: number, end: number) {
	let index = start
	while (index < end) {
		const segmentStart = index
		while (index < end && isAsciiAlphaNumeric(key[index])) {
			index++
		}
		if (
			index === segmentStart ||
			index === end ||
			(key[index] !== '_' && key[index] !== '-')
		) {
			return false
		}
		index++
	}
	return true
}

function isSensitiveLogAssignmentKey(key: string) {
	const normalizedKey = key.toLowerCase()
	for (const suffix of SENSITIVE_LOG_ASSIGNMENT_KEY_SUFFIXES) {
		if (!normalizedKey.endsWith(suffix)) {
			continue
		}

		const suffixStart = key.length - suffix.length
		if (isNamespacePrefix(key, 0, suffixStart)) {
			return true
		}

		const previousHyphen = key.lastIndexOf('-', suffixStart - 1)
		if (
			previousHyphen !== -1 &&
			isNamespacePrefix(key, previousHyphen + 1, suffixStart)
		) {
			return true
		}
	}
	return false
}

function findPrivateKeyMarkerEnd(
	value: string,
	markerStart: number,
	markerPattern: RegExp
) {
	markerPattern.lastIndex = markerStart
	return markerPattern.exec(value) ? markerPattern.lastIndex : undefined
}

function findPrivateKeyEnd(value: string, start: number) {
	let searchFrom = start
	while (searchFrom < value.length) {
		const markerStart = value.indexOf(PRIVATE_KEY_END_PREFIX, searchFrom)
		if (markerStart === -1) {
			return undefined
		}

		const markerEnd = findPrivateKeyMarkerEnd(
			value,
			markerStart,
			PRIVATE_KEY_END_PATTERN
		)
		if (markerEnd !== undefined) {
			return markerEnd
		}
		searchFrom = markerStart + 1
	}
	return undefined
}

function redactPrivateKeyBlocks(value: string) {
	let sanitized: string[] | undefined
	let copiedThrough = 0
	let searchFrom = 0
	while (searchFrom < value.length) {
		const beginStart = value.indexOf(PRIVATE_KEY_BEGIN_PREFIX, searchFrom)
		if (beginStart === -1) {
			break
		}

		const beginEnd = findPrivateKeyMarkerEnd(
			value,
			beginStart,
			PRIVATE_KEY_BEGIN_PATTERN
		)
		if (beginEnd === undefined) {
			searchFrom = beginStart + 1
			continue
		}

		const end = findPrivateKeyEnd(value, beginEnd)
		if (end === undefined) {
			break
		}

		sanitized ??= []
		sanitized.push(value.slice(copiedThrough, beginStart), REDACTED)
		copiedThrough = end
		searchFrom = end
	}

	if (!sanitized) {
		return value
	}
	sanitized.push(value.slice(copiedThrough))
	return sanitized.join('')
}

function isWhitespaceCharacter(character: string | undefined) {
	return character !== undefined && /\s/.test(character)
}

function redactUrls(value: string) {
	return value.replace(
		/(?<![a-z0-9+.-])([0-9+.-]*)([a-z][a-z0-9+.-]*:\/\/)([^/@\s]+@)?([^\s?#]+)(\?[^\s#]*)?(#[^\s]*)?/gi,
		(_match, prefix, protocol, _userinfo, path) => `${prefix}${protocol}${path}`
	)
}

function redactSensitiveAssignments(value: string) {
	let sanitized: string[] | undefined
	let copiedThrough = 0
	let index = 0
	// Scan separators once so a long non-sensitive identifier is not retried at every hyphen.
	while (index < value.length) {
		if (value[index] !== '=' && value[index] !== ':') {
			index++
			continue
		}

		let keyEnd = index
		while (keyEnd > 0 && isWhitespaceCharacter(value[keyEnd - 1])) {
			keyEnd--
		}
		if (value[keyEnd - 1] === '"' || value[keyEnd - 1] === "'") {
			keyEnd--
		}
		let keyStart = keyEnd
		while (
			keyStart > 0 &&
			(isAsciiAlphaNumeric(value[keyStart - 1]) ||
				value[keyStart - 1] === '_' ||
				value[keyStart - 1] === '-')
		) {
			keyStart--
		}

		if (
			keyStart < keyEnd &&
			isSensitiveLogAssignmentKey(value.slice(keyStart, keyEnd))
		) {
			let valueStart = index + 1
			while (
				valueStart < value.length &&
				isWhitespaceCharacter(value[valueStart])
			) {
				valueStart++
			}
			SENSITIVE_LOG_ASSIGNMENT_VALUE_PATTERN.lastIndex = valueStart
			const assignmentValue = SENSITIVE_LOG_ASSIGNMENT_VALUE_PATTERN.exec(value)
			if (assignmentValue) {
				const valueEnd = SENSITIVE_LOG_ASSIGNMENT_VALUE_PATTERN.lastIndex
				sanitized ??= []
				sanitized.push(value.slice(copiedThrough, valueStart), REDACTED)
				copiedThrough = valueEnd
				index = valueEnd
				continue
			}
		}
		index++
	}

	if (!sanitized) {
		return value
	}
	sanitized.push(value.slice(copiedThrough))
	return sanitized.join('')
}

export function sanitizeSensitiveString(value: string) {
	const sanitized = redactPrivateKeyBlocks(value)
		// Header values can contain multiple credentials (`Cookie: a=1; b=2`),
		// so redact a quoted value or the whole remainder of the line.
		.replace(
			/\b(authorization|proxy-authorization|cookie|set-cookie|x-api-key)(["']?\s*[:=]\s*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|\[[^\]]*\]|[^\n"]*)/gi,
			`$1$2${REDACTED}`
		)
		// Preserve only the complete Basic prose token; credential suffixes are sensitive.
		.replace(
			/\b(Basic|Bearer)\s+([A-Za-z0-9._~+/=-]+)/gi,
			(match, scheme: string, credential: string) =>
				scheme.toLowerCase() === 'basic' &&
				credential.toLowerCase() === 'authentication'
					? match
					: `${scheme} ${REDACTED}`
		)
	return redactSensitiveAssignments(redactUrls(sanitized))
}

/**
 * Use this instead of passing a whole error to a logger. HTTP errors carry
 * request options (authorization headers, request bodies, TLS keys), which
 * loggers serialize. Enforced by `no-restricted-syntax` in .eslintrc.json.
 */
export function errorForLogging(error: unknown): string {
	try {
		if (!(error instanceof Error)) {
			return sanitizeSensitiveString(String(error))
		}
		const code = (error as { code?: unknown }).code
		return sanitizeSensitiveString(
			`${error.name}${code === undefined ? '' : ` [${code}]`}: ${error.message}`
		)
	} catch {
		// Thrown values can have hostile or missing string-coercion methods.
		return '[Unserializable error]'
	}
}

export function redactUrlForLogging(url: URL | string | undefined) {
	if (!url) {
		return undefined
	}
	try {
		const parsed = new URL(url.toString())
		parsed.username = ''
		parsed.password = ''
		parsed.search = ''
		parsed.hash = ''
		return parsed.toString()
	} catch {
		return sanitizeSensitiveString(url.toString())
	}
}

/** Safe stringify to deal with circular JSON */
function safeStringifyReplacer(seen) {
	return function (key, value) {
		if (isSensitiveLogKey(key)) {
			return REDACTED
		}

		// Handle objects with a custom `.toJSON()` method.
		if (typeof value?.toJSON === 'function') {
			value = value.toJSON()
		}

		if (typeof value === 'string') {
			return sanitizeSensitiveString(value)
		}

		if (!(value !== null && typeof value === 'object')) {
			return value
		}

		if (seen.has(value)) {
			return '[Circular]'
		}

		seen.add(value)

		const newValue = Array.isArray(value) ? [] : {}

		for (const [key2, value2] of Object.entries(value)) {
			newValue[key2] = safeStringifyReplacer(seen)(key2, value2)
		}

		seen.delete(value)

		return newValue
	}
}

export default function safeStringify(
	object,
	{ indentation } = { indentation: 2 }
) {
	const seen = new WeakSet()
	return JSON.stringify(object, safeStringifyReplacer(seen), indentation)
}
