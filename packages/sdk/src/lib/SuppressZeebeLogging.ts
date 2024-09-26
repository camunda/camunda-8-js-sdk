let previousLogState: string | undefined
export function suppressZeebeLogging() {
	previousLogState = process.env.ZEEBE_CLIENT_LOG_LEVEL
	process.env.ZEEBE_CLIENT_LOG_LEVEL = 'NONE'
}

export function restoreZeebeLogging() {
	process.env.ZEEBE_CLIENT_LOG_LEVEL = previousLogState
}
