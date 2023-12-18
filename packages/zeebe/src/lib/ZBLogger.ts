import { Chalk } from 'chalk'
import dayjs from 'dayjs'
import * as stackTrace from 'stack-trace'
import { Duration, MaybeTimeDuration } from 'typed-duration'

import { ConfigurationHydrator } from './ConfigurationHydrator'
import { ZBLoggerConfig } from './interfaces-1.0'
import { Loglevel, ZBCustomLogger } from './interfaces-published-contract'

interface Msg {
	timestamp: Date
	context: string
	id?: string
	level: number
	message: string
	time: string
	pollInterval?: MaybeTimeDuration
	namespace?: string
	taskType?: string
	data?: unknown[]
}

export class ZBLogger {
	// tslint:disable-next-line: variable-name
	public _tag: 'ZBCLIENT' | 'ZBWORKER'
	public loglevel: Loglevel
	private colorFn: Chalk | (<T extends string>(input: T) => string)
	private taskType?: string
	private id?: string
	private stdout: ZBCustomLogger
	private colorise: boolean
	private pollInterval?: MaybeTimeDuration
	private namespace: string | undefined

	constructor({
		loglevel,
		color,
		id,
		namespace,
		stdout,
		taskType,
		colorise,
		pollInterval,
		_tag,
	}: ZBLoggerConfig) {
		this._tag = _tag
		this.colorFn = color || ((m) => m)
		this.taskType = taskType
		this.id = id
		if (Array.isArray(namespace)) {
			namespace = namespace.join(' ')
		}
		this.namespace = namespace
		this.loglevel =
			ConfigurationHydrator.getLogLevelFromEnv() || loglevel || 'INFO'
		this.stdout = stdout || console
		this.colorise = colorise !== false
		this.pollInterval = pollInterval
			? Duration.milliseconds.from(pollInterval)
			: pollInterval
	}

	public info(message: unknown, ...optionalParameters) {
		if (this.loglevel === 'NONE' || this.loglevel === 'ERROR') {
			return
		}
		const frame = stackTrace.get()[1]
		const msg =
			optionalParameters.length > 0
				? this.makeMessage(frame, 30, message, optionalParameters)
				: this.makeMessage(frame, 30, message)
		this.stdout.info(msg)
	}

	public error(message, ...optionalParameters: unknown[]) {
		if (this.loglevel === 'NONE') {
			return
		}
		const frame = stackTrace.get()[1]

		const msg =
			optionalParameters.length > 0
				? this.makeMessage(frame, 50, message, optionalParameters)
				: this.makeMessage(frame, 50, message)
		this.stdout.error(msg)
	}

	public debug(message: string, ...optionalParameters: unknown[]) {
		if (this.loglevel !== 'DEBUG') {
			return
		}
		const frame = stackTrace.get()[1]

		const msg =
			optionalParameters.length > 0
				? this.makeMessage(frame, 20, message, optionalParameters)
				: this.makeMessage(frame, 20, message)
		if (this.stdout === console) {
			this.stdout.info(this._colorise(msg))
		} else {
			this.stdout.info(msg)
		}
	}

	public log(message: string, ...optionalParameters: unknown[]) {
		if (this.loglevel === 'NONE' || this.loglevel === 'ERROR') {
			return
		}
		const frame = stackTrace.get()[1]

		const msg =
			optionalParameters.length > 0
				? this.makeMessage(frame, 30, message, optionalParameters)
				: this.makeMessage(frame, 30, message)
		this.stdout.info(msg)
	}

	private makeMessage(
		frame: stackTrace.StackFrame,
		level: number,
		message,
		...optionalParameters
	) {
		const msg: Msg = {
			timestamp: new Date(),
			context: `${frame.getFileName()}:${frame.getLineNumber()}`,
			level,
			message,
			time: dayjs().format('YYYY MMM-DD HH:mm:ssA'),
		}

		if (this.id) {
			msg.id = this.id
		}
		if (this.pollInterval) {
			msg.pollInterval = this.pollInterval
		}
		if (this.namespace) {
			msg.namespace = this.namespace
		}
		if (this.taskType) {
			msg.taskType = this.taskType
		}
		if (optionalParameters.length > 0) {
			msg.data = optionalParameters
		}
		return JSON.stringify(msg)
	}

	private _colorise(message: string) {
		if (this.colorise) {
			// Only colorise console
			if (this.colorFn && typeof this.colorFn === 'function') {
				return this.colorFn(message)
			} else {
				return message
			}
		}
		return message
	}
}
