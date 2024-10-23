import { createLogger, format, transports } from 'winston'

import { Camunda8ClientConfiguration, CamundaEnvironmentConfigurator } from '.'

let cachedLogger: ILogger | undefined

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface ILogger {
	info: (message: string, ...meta: any[]) => void
	warn: (message: string, ...meta: any[]) => void
	error: (message: string, ...meta: any[]) => void
	debug: (message: string, ...meta: any[]) => void
	trace: (message: string, ...meta: any[]) => void
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function getLogger(config: Camunda8ClientConfiguration = {}) {
	const configuration =
		CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config)
	if (config.logger) {
		return config.logger
	}
	if (cachedLogger) {
		return cachedLogger
	}
	cachedLogger = new WinstonLogger(configuration.CAMUNDA_LOG_LEVEL)

	return cachedLogger
}

class WinstonLogger implements ILogger {
	private logger

	constructor(loglevel: string) {
		if (loglevel === 'trace') {
			loglevel = 'silly'
		}
		this.logger = createLogger({
			level: loglevel,
			format: format.combine(
				format.timestamp(),
				format.colorize(),
				format.printf(({ level, message, timestamp, ...data }) => {
					if (
						data &&
						!(Object.keys(data).length === 0 && data.constructor === Object)
					) {
						message = `${message} ${JSON.stringify(data)}`
					}
					return `${timestamp} [${level}]: ${message}`
				})
			),
			transports: [new transports.Console()],
		})
	}
	/* eslint-disable @typescript-eslint/no-explicit-any */
	info(message: string, ...meta: any[]) {
		this.logger.info(message, ...meta)
	}

	error(message: string, ...meta: any[]) {
		this.logger.error(message, ...meta)
	}

	warn(message: string, ...meta: any[]) {
		this.logger.warn(message, ...meta)
	}

	debug(message: string, ...meta: any[]) {
		this.logger.debug(message, ...meta)
	}

	trace(message: string, ...meta: any[]) {
		this.logger.silly(message, ...meta)
	}
}
