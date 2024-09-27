import winston from 'winston' // Import Winston

import {
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
} from '../../lib'

let defaultLogger: winston.Logger
let cachedLogger: winston.Logger | undefined

export function getLogger(config?: Camunda8ClientConfiguration) {
	const configuration =
		CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config ?? {})
	// We assume that the SDK user uses a single winston instance for 100% of logging, or no logger at all (in which case we create our own)
	if (config?.logger && cachedLogger !== config.logger) {
		cachedLogger = config.logger
		config.logger.info(
			`Using supplied winston logger at level '${config.logger.level}'`
		)
	}
	if (!defaultLogger) {
		// Define the default logger
		defaultLogger = winston.createLogger({
			level: configuration.CAMUNDA_LOG_LEVEL,
			format: winston.format.combine(
				winston.format.timestamp(),
				winston.format.colorize(),
				winston.format.simple()
			),
			transports: [new winston.transports.Console()],
		})
	}
	if (!cachedLogger) {
		defaultLogger.info(
			`Using default winston logger at level '${defaultLogger.level}'`
		)
		cachedLogger = defaultLogger
	}
	return config?.logger ?? defaultLogger
}
