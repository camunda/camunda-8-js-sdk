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
			console.error(`Failed to write log to ${this.filepath}:`, err)
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
const SENSITIVE_LOG_KEYS = new Set([
	'authorization',
	'proxyauthorization',
	'body',
	'cert',
	'certificate',
	'certificateauthority',
	'clientsecret',
	'cookie',
	'form',
	'idtoken',
	'json',
	'key',
	'password',
	'passphrase',
	'privatekey',
	'refreshtoken',
	'secret',
	'setcookie',
	'token',
	'accesstoken',
	'certchain',
	'rootcerts',
])

function isSensitiveLogKey(key: string) {
	const normalizedKey = key.replace(/[^a-z0-9]/gi, '').toLowerCase()
	return (
		SENSITIVE_LOG_KEYS.has(normalizedKey) ||
		[
			'accesstoken',
			'authorization',
			'body',
			'certchain',
			'certificate',
			'certstring',
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
		].some((suffix) => normalizedKey.endsWith(suffix))
	)
}

export function sanitizeSensitiveString(value: string) {
	return value
		.replace(
			/-----BEGIN (?:[^-\s]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[^-\s]+ )?PRIVATE KEY-----/g,
			REDACTED
		)
		.replace(/\b(Basic|Bearer)\s+[A-Za-z0-9._~+/=-]+/gi, `$1 ${REDACTED}`)
		.replace(
			/([a-z][a-z0-9+.-]*:\/\/)([^/@\s]+@)?([^\s?#]+)(\?[^\s#]*)?(#[^\s]*)?/gi,
			(_match, protocol, _userinfo, path) => `${protocol}${path}`
		)
		.replace(
			/\b(access[_-]?token|authorization|client[_-]?secret|cookie|id[_-]?token|password|passphrase|proxy[_-]?authorization|refresh[_-]?token|secret|set-cookie|token)(["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s&,;}]+)/gi,
			`$1$2${REDACTED}`
		)
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
