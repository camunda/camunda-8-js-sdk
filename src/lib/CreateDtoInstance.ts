/**
 * Create an instance of a DTO class with the provided data.
 *
 * This provides a type-safe method to create a DTO instance from a plain object.
 *
 * @param dtoClass
 * @param dtoData
 * @returns
 */
export function createDtoInstance<T>(dtoClass: { new (): T }, dtoData: T) {
	const newDto = new dtoClass()
	for (const key in dtoData) {
		newDto[key] = dtoData[key]
	}
	return newDto
}
