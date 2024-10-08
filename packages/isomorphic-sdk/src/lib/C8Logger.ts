import * as log from 'loglevel'

import { IsoSdkClientConfiguration, IsoSdkEnvironmentConfigurator } from '.'

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

export function getLogger(config: IsoSdkClientConfiguration = {}) {
	const configuration =
		IsoSdkEnvironmentConfigurator.mergeConfigWithEnvironment(config)
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
