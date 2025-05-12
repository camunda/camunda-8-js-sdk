/* eslint-disable @typescript-eslint/no-explicit-any */
import { LosslessDto } from '../../lib'

import { RestApiJob } from './C8Dto'

/**
 * REST Job class factory that creates specialized RestApiJob classes based on input variables and custom headers.
 * This factory caches the created classes to avoid creating the same class multiple times.
 * It uses a memoization technique to store the classes in a Map, where the key is a stringified version of the input variables and custom headers.
 * A Specialized REST Job class is the generic Job Dto specialised with the LosslessDto for the variables and custom headers payload.
 */

const factory = createMemoizedSpecializedRestApiJobClassFactory()

// Creates a specialized RestApiJob class that is cached based on input variables and custom headers.
export const createSpecializedRestApiJobClass = <
	Variables extends LosslessDto,
	CustomHeaders extends LosslessDto,
>(
	inputVariableDto: new (obj: any) => Variables,
	customHeaders: new (obj: any) => CustomHeaders
) => {
	// Assuming `createMemoizedSpecializedRestApiJobClassFactory` is available
	return factory(inputVariableDto, customHeaders)
}

function createMemoizedSpecializedRestApiJobClassFactory() {
	const cache = new Map<string, any>()

	return function <
		Variables extends LosslessDto,
		CustomHeaders extends LosslessDto,
	>(
		inputVariableDto: new (obj: any) => Variables,
		customHeadersDto: new (obj: any) => CustomHeaders
	): new (obj: any) => RestApiJob<Variables, CustomHeaders> {
		// Create a unique cache key based on the class and inputs
		const cacheKey = JSON.stringify({
			inputVariableDto,
			customHeadersDto,
		})

		// Check for cached result
		if (cache.has(cacheKey)) {
			return cache.get(cacheKey)
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
			'variables'
		)
		Reflect.defineMetadata(
			'child:class',
			customHeadersDto,
			NewRestApiJobClass.prototype,
			'customHeaders'
		)

		// Store the new class in cache
		cache.set(cacheKey, NewRestApiJobClass)

		// Return the new class
		return NewRestApiJobClass
	}
}
