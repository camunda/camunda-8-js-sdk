import { losslessParse, losslessStringify } from '../../lib'

import { Job } from './interfaces-1.0'
import { ActivatedJob } from './interfaces-grpc-1.0'

export function parseVariables<T extends { variables: string }, V = JSONDoc>(
	input: T
): Omit<T, 'variables'> & { variables: V } {
	return Object.assign({}, input, {
		variables: losslessParse(input.variables || '{}') as V,
	})
}

export function parseVariablesAndCustomHeadersToJSON<Variables, CustomHeaders>(
	response: ActivatedJob,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	inputVariableDto: new (...args: any[]) => Readonly<Variables>,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	customHeadersDto: new (...args: any[]) => Readonly<CustomHeaders>
): Job<Variables, CustomHeaders> {
	return Object.assign({}, response, {
		customHeaders: losslessParse(
			response.customHeaders,
			customHeadersDto
		) as CustomHeaders,
		variables: losslessParse(
			response.variables,
			inputVariableDto
		) as Readonly<Variables>,
	}) as Job<Variables, CustomHeaders>
}

export function stringifyVariables<
	K,
	T extends { variables: K extends JSONDoc ? K : K },
	V extends T & { variables: string },
>(request: T): V {
	const variables = request.variables || {}
	const variablesString = losslessStringify(variables)
	return Object.assign({}, request, { variables: variablesString }) as V
}

type JSON = string | number | boolean | JSON[] | JSONDoc[]
interface JSONDoc {
	[key: string]: JSON
}
