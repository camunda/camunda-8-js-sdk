
import {type LosslessDto} from '@camunda8/lossless-json'
import {RestApiJob} from '../../dto/c8-dto.js'

const factory = createMemoizedSpecializedRestApiJobClassFactory()

// Creates a specialized RestApiJob class that is cached based on input variables and custom headers.
export const createSpecializedRestApiJobClass = <
	Variables extends LosslessDto,
	CustomHeaders extends LosslessDto,
>(
	inputVariableDto: new (object: any) => Variables,
	customHeaders: new (object: any) => CustomHeaders,
) =>
	// Assuming `createMemoizedSpecializedRestApiJobClassFactory` is available
	factory(inputVariableDto, customHeaders)

function createMemoizedSpecializedRestApiJobClassFactory() {
	const cache = new Map<string, any>()

	return function <
		Variables extends LosslessDto,
		CustomHeaders extends LosslessDto,
	>(
		inputVariableDto: new (object: any) => Variables,
		customHeadersDto: new (object: any) => CustomHeaders,
	): new (object: any) => RestApiJob<Variables, CustomHeaders> {
		// Create a unique cache key based on the class and inputs
		const cacheKey = JSON.stringify({
			inputVariableDto,
			customHeadersDto,
		})

		// Check for cached result
		/* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment */
		const cachedValue = cache.get(cacheKey)
		if (cachedValue) {
			return cachedValue // eslint-disable-line @typescript-eslint/no-unsafe-return
		}

		// Create a new class that extends the original class
		class NewRestApiJobClass<
			Variables extends LosslessDto,
			CustomHeaders extends LosslessDto,
		> extends RestApiJob<Variables, CustomHeaders> {}

		// Use Reflect to define the metadata on the new class's prototype
		Reflect.defineMetadata(
			'child:class',
			inputVariableDto,
			NewRestApiJobClass.prototype,
			'variables',
		)
		Reflect.defineMetadata(
			'child:class',
			customHeadersDto,
			NewRestApiJobClass.prototype,
			'customHeaders',
		)

		// Store the new class in cache
		cache.set(cacheKey, NewRestApiJobClass)

		// Return the new class
		return NewRestApiJobClass
	}
}
