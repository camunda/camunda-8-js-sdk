export function ValueOrDefault(
	value: string | undefined,
	defaultValue: string
): string {
	return value ?? defaultValue
}
