import log from 'loglevel'
import {type IsoSdkClientConfiguration, isoSdkEnvironmentConfigurator} from './index.js'

let cachedLogger: Logger | undefined

export type Logger = {
	info: (message: string, ...meta: any[]) => void;
	warn: (message: string, ...meta: any[]) => void;
	error: (message: string, ...meta: any[]) => void;
	debug: (message: string, ...meta: any[]) => void;
	trace: (message: string, ...meta: any[]) => void;
}

export function getLogger(config: IsoSdkClientConfiguration = {}) {
	const configuration
		= isoSdkEnvironmentConfigurator.mergeConfigWithEnvironment(config)
	if (config.logger) {
		return config.logger
	}

	if (cachedLogger) {
		return cachedLogger
	}

	cachedLogger = log
	log.setLevel(configuration.CAMUNDA_LOG_LEVEL)

	return cachedLogger
}
