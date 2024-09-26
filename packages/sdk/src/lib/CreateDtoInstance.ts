/**
 * Create an instance of a DTO class with the provided data.
 *
 * This provides a type-safe method to create a DTO instance from a plain object.
 *
 * Node 22's experimental strip types does not play well with the previous "via the constructor" method.
 *
 * See: https://gist.github.com/jwulf/6e7b093b5b7b3e12c7b76f55b9e4be84
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
