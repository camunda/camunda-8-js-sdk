import { losslessStringify } from 'lib'

type JSON = string | number | boolean | JSON[] | JSONDoc[]
export interface JSONDoc {
	[key: string]: JSON
}
/**
 * Shallow escape
 * @param variable
 * @returns
 */
export const escape = (variable: JSON) => {
	if (typeof variable === 'object') {
		return `${losslessStringify(variable)}`
	}
	if (typeof variable === 'string') {
		return `"${variable}"`
	}
	return variable
}

export const encodeTaskVariablesForAPIRequest = (variables: JSONDoc) =>
	Object.keys(variables).map((key) => ({
		name: `${key}`,
		value: escape(variables[key]),
	}))
