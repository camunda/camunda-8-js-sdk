import { CamundaEnvironmentVariable } from '../lib'

export function RequireConfiguration<T>(
	config: T | undefined,
	key: CamundaEnvironmentVariable
): T {
	if (!config) {
		throw new Error(
			`Missing required configuration ${key}. Please supply this value as an environment variable or configuration object field.`
		)
	}
	return config
}
