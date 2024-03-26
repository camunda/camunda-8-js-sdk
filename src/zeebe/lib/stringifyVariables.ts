import { parseAndThrowForUnsafeNumbers } from 'lib'
import { stringify } from 'lossless-json'

import { Job } from './interfaces-1.0'
import { ActivatedJob } from './interfaces-grpc-1.0'

export function parseVariables<T extends { variables: string }, V = JSONDoc>(
	input: T
): Omit<T, 'variables'> & { variables: V } {
	return Object.assign({}, input, {
		variables: parseAndThrowForUnsafeNumbers(input.variables || '{}') as V,
	})
}

export function parseVariablesAndCustomHeadersToJSON<Variables, CustomHeaders>(
	response: ActivatedJob
): Job<Variables, CustomHeaders> {
	return Object.assign({}, response, {
		customHeaders: parseAndThrowForUnsafeNumbers(
			response.customHeaders
		) as CustomHeaders,
		variables: parseAndThrowForUnsafeNumbers(response.variables) as Variables,
	}) as Job<Variables, CustomHeaders>
}

export function stringifyVariables<
	K,
	T extends { variables: K extends JSONDoc ? K : K },
	V extends T & { variables: string },
>(request: T): V {
	const variables = request.variables || {}
	const variablesString = stringify(variables)
	return Object.assign({}, request, { variables: variablesString }) as V
}

type JSON = string | number | boolean | JSON[] | JSONDoc[]
interface JSONDoc {
	[key: string]: JSON
}
