import winston, { transports } from 'winston' // Import Winston

import {
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
} from '../../lib'

/**
 * This is the interface for the logger used in the SDK.
 * It is based on the Winston logger and provides methods for logging at different levels.
 * You can use this interface to create your own logger that implements the same methods.
 */
export type Logger = {
	/* eslint-disable @typescript-eslint/no-explicit-any */
	info: (message: string | undefined, ...meta: any[]) => void
	warn: (message: string | undefined, ...meta: any[]) => void
	error: (message: string | undefined, ...meta: any[]) => void
	debug: (message: string | undefined, ...meta: any[]) => void
	trace: (message: string | undefined, ...meta: any[]) => void
	/* eslint-enable @typescript-eslint/no-explicit-any */
}

let defaultLogger: Logger
let cachedLogger: Logger | undefined

export function getLogger(config?: Camunda8ClientConfiguration) {
	const configuration =
		CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config ?? {})
	// We assume that the SDK user uses a single winston instance for 100% of logging, or no logger at all (in which case we create our own)
	if (config?.logger && cachedLogger !== config.logger) {
		cachedLogger = config.logger
		config.logger.debug(`Using supplied logger`)
	}
	if (!defaultLogger) {
		// Define the default logger
		const logger = createLogger({
			level: configuration.CAMUNDA_LOG_LEVEL,
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.colorize(),
				winston.format.simple()
			),
			transports: [new winston.transports.Console()],
		})

		defaultLogger = logger
	}
	if (!cachedLogger) {
		defaultLogger.debug(`Using default winston logger`)
		cachedLogger = defaultLogger
	}
	return config?.logger ?? defaultLogger
}

export function createLogger(options?: winston.LoggerOptions) {
	const logger: winston.Logger & {
		trace: (message: string | undefined, ...meta: any[]) => void // eslint-disable-line @typescript-eslint/no-explicit-any
	} = winston.createLogger(options) as any // eslint-disable-line @typescript-eslint/no-explicit-any
	logger.trace = logger.silly
	return logger
}

export const NullLogger = createLogger({
	transports: [new transports.Console({ silent: true })],
})
