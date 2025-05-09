export type KeysOf<T> = Extract<keyof T, string>

type MissingKeys<T, U extends readonly string[]> = Exclude<
	KeysOf<T>,
	U[number]
> extends never
	? true
	: false

type ExtraKeys<T, U extends readonly string[]> = Exclude<
	U[number],
	KeysOf<T>
> extends never
	? true
	: false

export function createExhaustiveKeyArray<
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Record<string, any>,
	K extends readonly KeysOf<T>[],
>(
	keys: K &
		(MissingKeys<T, K> extends true
			? ExtraKeys<T, K> extends true
				? unknown
				: ['Extra keys present']
			: ['Missing some keys'])
): K {
	return keys
}
