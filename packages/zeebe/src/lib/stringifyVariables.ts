import { Job } from './interfaces-1.0'
import { ActivatedJob } from './interfaces-grpc-1.0'

export function parseVariables<T extends { variables: string }, V = JSONDoc>(
	input: T
): Omit<T, 'variables'> & { variables: V } {
	return Object.assign({}, input, {
		variables: JSON.parse(input.variables || '{}') as V,
	})
}

export function parseVariablesAndCustomHeadersToJSON<Variables, CustomHeaders>(
	response: ActivatedJob
): Job<Variables, CustomHeaders> {
	return Object.assign({}, response, {
		customHeaders: JSON.parse(response.customHeaders),
		variables: JSON.parse(response.variables),
	}) as Job<Variables, CustomHeaders>
}

export function stringifyVariables<
	K,
	T extends { variables: K extends JSONDoc ? K : K },
	V extends T & { variables: string },
>(request: T): V {
	const variables = request.variables || {}
	const variablesString = JSON.stringify(variables)
	return Object.assign({}, request, { variables: variablesString }) as V
}

type JSON = string | number | boolean | JSON[] | JSONDoc[]
interface JSONDoc {
	[key: string]: JSON
}
