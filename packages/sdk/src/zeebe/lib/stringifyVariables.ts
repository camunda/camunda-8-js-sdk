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

/**
 * Parse an incoming job and convert its variables and custom headers to JSON.
 */

export function parseVariablesAndCustomHeadersToJSON<Variables, CustomHeaders>(
	response: ActivatedJob,
	/* eslint-disable @typescript-eslint/no-explicit-any */
	inputVariableDto: new (...args: any[]) => Readonly<Variables>,
	customHeadersDto: new (...args: any[]) => Readonly<CustomHeaders>
	/* eslint-enable @typescript-eslint/no-explicit-any */
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

/**
 * Turn the `variables` field of a request from a JS object to a JSON string
 * This should be a key:value object where the keys will be variable names in Zeebe and the values are the corresponding values.
 * This function is used when sending a job back to Zeebe.
 */
export function stringifyVariables<
	K,
	T extends { variables: K extends JSONDoc ? K : K },
	V extends T & { variables: string },
>(request: T): V {
	const variables = request.variables || {}
	/**
	 * This is a run-time guard. The type system disallows passing an array, but type erasure and dynamic programming can override that.
	 * If you pass an array as the variables to a CompleteJob RPC call, it will report success, but fail on the broker, stalling the process.
	 * See: https://github.com/camunda/camunda-8-js-sdk/issues/247
	 */
	if (Array.isArray(variables)) {
		throw new Error('Unable to parse Array into variables')
	}
	const variablesString = losslessStringify(variables)
	return Object.assign({}, request, { variables: variablesString }) as V
}

type JSON = string | number | boolean | JSON[] | JSONDoc[]
interface JSONDoc {
	[key: string]: JSON
}
