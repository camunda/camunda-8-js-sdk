import fs from 'node:fs'
import * as os from 'node:os'
import path from 'node:path'

import mergeWith from 'lodash.mergewith'

import { packageVersion } from '../lib/GetPackageVersion'

import {
	Camunda8ClientConfiguration,
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
			`**WARNING**: This log can continue sensitive secrets. Scan it before uploading it to a public site such as GitHub`,
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
		const santisedConfig = obscureSensitiveInfo(mergedConfig)
		this.log(
			`/** Configuration */\n${JSON.stringify(santisedConfig, null, 2)}\n`,
			false
		)
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
			typeof message === 'object' ? safeStringify(message) : message

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

/** Function to obscure secrets in log */
function obscureSensitiveInfo(config: Camunda8ClientConfiguration) {
	const sensitiveKeys = [
		'CAMUNDA_BASIC_AUTH_PASSWORD',
		'CAMUNDA_CONSOLE_CLIENT_SECRET',
		'ZEEBE_CLIENT_SECRET',
		'CAMUNDA_COOKIE_AUTH_PASSWORD',
	]
	return mergeWith({}, config, (_, srcValue, key) => {
		if (sensitiveKeys.includes(key)) {
			return `${srcValue?.slice(0, 4)}...[${
				(srcValue?.length || 4) - 4
			} chars omitted]`
		}
		return undefined
	})
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

/** Safe stringify to deal with circular JSON */
function safeStringifyReplacer(seen) {
	return function (_, value) {
		// Handle objects with a custom `.toJSON()` method.
		if (typeof value?.toJSON === 'function') {
			value = value.toJSON()
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
