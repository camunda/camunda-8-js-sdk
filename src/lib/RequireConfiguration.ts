import { CamundaEnvironmentVariables } from '../lib'

export function RequireConfiguration<T>(
	config: T | undefined,
	key: keyof typeof CamundaEnvironmentVariables
): T {
	if (!config) {
		throw new Error(
			`Missing required configuration ${String(
				key
			)}. Please supply this value as an environment variable or configuration object field.`
		)
	}
	return config
}
