export function ValueOrDefault(
	value: string | undefined,
	defaultValue: string
): string {
	return value || defaultValue
}

export function ParseIntOrDefault(
	value: string | undefined,
	defaultValue: number
): number {
	return value ? parseInt(value, 10) : defaultValue
}
