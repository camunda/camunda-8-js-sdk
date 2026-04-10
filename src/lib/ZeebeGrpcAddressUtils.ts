/**
 * Utilities for handling ZEEBE_GRPC_ADDRESS configuration and protocol-based TLS inference
 */

/**
 * Validates the ZEEBE_GRPC_ADDRESS format and extracts protocol information
 */
export interface ZeebeGrpcAddressInfo {
	/** The original address including protocol */
	fullAddress: string
	/** The address without protocol (host:port) */
	hostPort: string
	/** Whether TLS should be used based on protocol */
	isSecure: boolean
	/** The protocol used (grpc or grpcs) */
	protocol: 'grpc' | 'grpcs'
}

/**
 * Parses and validates a ZEEBE_GRPC_ADDRESS value
 * @param address The ZEEBE_GRPC_ADDRESS value to parse
 * @returns Parsed address information
 * @throws Error if the address format is invalid
 */
export function parseZeebeGrpcAddress(address: string): ZeebeGrpcAddressInfo {
	if (!address.startsWith('grpc://') && !address.startsWith('grpcs://')) {
		throw new Error(
			`ZEEBE_GRPC_ADDRESS must contain either grpc:// or grpcs:// protocol. Got: ${address}`
		)
	}

	const isSecure = address.startsWith('grpcs://')
	const protocol = isSecure ? 'grpcs' : 'grpc'
	const hostPort = address.replace(/^grpcs?:\/\//, '')

	return {
		fullAddress: address,
		hostPort,
		isSecure,
		protocol,
	}
}

/**
 * Emits warnings for deprecated configuration values
 */
export function emitDeprecationWarnings(config: {
	ZEEBE_ADDRESS?: string
	ZEEBE_GRPC_ADDRESS?: string
	CAMUNDA_SECURE_CONNECTION?: boolean
	zeebeGrpcSettings: {
		ZEEBE_INSECURE_CONNECTION?: boolean
	}
}): void {
	// Emit deprecation warnings for legacy TLS settings
	if (config.zeebeGrpcSettings.ZEEBE_INSECURE_CONNECTION !== undefined) {
		console.warn(
			'⚠️  ZEEBE_INSECURE_CONNECTION is deprecated. Please use ZEEBE_GRPC_ADDRESS with grpc:// or grpcs:// protocol instead.'
		)
	}

	if (config.CAMUNDA_SECURE_CONNECTION !== undefined) {
		console.warn(
			'⚠️  CAMUNDA_SECURE_CONNECTION is deprecated. Please use ZEEBE_GRPC_ADDRESS with grpc:// or grpcs:// protocol instead.'
		)
	}
}

/**
 * Emits warnings when ZEEBE_GRPC_ADDRESS conflicts with legacy settings
 */
export function emitConflictWarnings(config: {
	ZEEBE_ADDRESS?: string
	ZEEBE_GRPC_ADDRESS?: string
	CAMUNDA_SECURE_CONNECTION?: boolean
	zeebeGrpcSettings: {
		ZEEBE_INSECURE_CONNECTION?: boolean
	}
}): void {
	if (!config.ZEEBE_GRPC_ADDRESS) {
		return
	}

	const conflictingSettings: string[] = []

	if (config.ZEEBE_ADDRESS) {
		conflictingSettings.push('ZEEBE_ADDRESS')
	}

	if (config.CAMUNDA_SECURE_CONNECTION !== undefined) {
		conflictingSettings.push('CAMUNDA_SECURE_CONNECTION')
	}

	if (config.zeebeGrpcSettings.ZEEBE_INSECURE_CONNECTION !== undefined) {
		conflictingSettings.push('ZEEBE_INSECURE_CONNECTION')
	}

	if (conflictingSettings.length > 0) {
		console.warn(
			`⚠️  ZEEBE_GRPC_ADDRESS is set and takes precedence. The following settings will be ignored: ${conflictingSettings.join(
				', '
			)}`
		)
	}
}
