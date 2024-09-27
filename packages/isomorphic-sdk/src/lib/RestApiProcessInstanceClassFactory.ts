import { LosslessDto } from '@camunda8/lossless-json'

import { CreateProcessInstanceResponse } from '../dto/C8Dto'

const factory =
	createMemoizedSpecializedCreateProcessInstanceResponseClassFactory()

// Creates a specialized RestApiJob class that is cached based on output variables
export const createSpecializedCreateProcessInstanceResponseClass = <
	Variables extends LosslessDto,
>(
	outputVariableDto: new () => Variables
) => {
	return factory(outputVariableDto)
}

function createMemoizedSpecializedCreateProcessInstanceResponseClassFactory() {
	const cache = new Map<string, new () => LosslessDto>()

	return function <Variables extends LosslessDto>(
		outputVariableDto: new () => Variables
	): new () => CreateProcessInstanceResponse<Variables> {
		// Create a unique cache key based on the class and inputs
		const cacheKey = JSON.stringify({
			outputVariableDto,
		})

		// Check for cached result
		if (cache.has(cacheKey)) {
			return cache.get(
				cacheKey
			) as new () => CreateProcessInstanceResponse<Variables>
		}

		// Create a new class that extends the original class
		class CustomCreateProcessInstanceResponseClass<
			Variables extends LosslessDto,
		> extends CreateProcessInstanceResponse<Variables> {
			variables!: Variables
		}

		// Use Reflect to define the metadata on the new class's prototype
		Reflect.defineMetadata(
			'child:class',
			outputVariableDto,
			CustomCreateProcessInstanceResponseClass.prototype,
			'variables'
		)

		// Store the new class in cache
		cache.set(cacheKey, CustomCreateProcessInstanceResponseClass)

		// Return the new class
		return CustomCreateProcessInstanceResponseClass
	}
}
