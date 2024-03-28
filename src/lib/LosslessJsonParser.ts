/**
 * This is a custom JSON Parser that handles lossless parsing of int64 numbers by using the lossless-json library.
 *
 * It converts all JSON numbers to lossless numbers, then converts them back to the correct type based on the metadata
 * of a Dto class - fields decorated with `@Int64` are converted to a `string`, fields decorated with `@BigIntValue` are
 * converted to `bigint`. All other numbers are converted to `number`. Throws if a number cannot be safely converted.
 *
 * It also handles nested Dtos by using the `@ChildDto` decorator.
 *
 * More details on the design here: https://github.com/camunda-community-hub/camunda-8-js-sdk/issues/81#issuecomment-2022213859
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { debug as d } from 'debug'
import {
	LosslessNumber,
	isLosslessNumber,
	parse,
	stringify,
	toSafeNumberOrThrow,
} from 'lossless-json'
import 'reflect-metadata'

const debug = d('lossless-json-parser')

/**
 * Decorate Dto string fields as `@Int64String` to specify that the JSON number property should be parsed as a string.
 * @example
 * ```typescript
 * class MyDto extends LosslessDto {
 *   @Int64String
 *   int64NumberField!: string
 *   @BigIntValue
 *   bigintField!: bigint
 *   @ChildDto(MyChildDto)
 *   childDtoField!: MyChildDto
 *   normalField!: string
 *   normalNumberField!: number
 *   maybePresentField?: string
 * }
 * ```
 */
export function Int64String(target: any, propertyKey: string | symbol): void {
	Reflect.defineMetadata('type:int64', true, target, propertyKey)
}

/**
 * Decorate Dto bigint fields as `@BigInt` to specify that the JSON number property should be parsed as a bigint.
 * @example
 * ```typescript
 * class MyDto extends LosslessDto {
 *   @Int64String
 *   int64NumberField!: string
 *   @BigIntValue
 *   bigintField!: bigint
 *   @ChildDto(MyChildDto)
 *   childDtoField!: MyChildDto
 *   normalField!: string
 *   normalNumberField!: number
 *   maybePresentField?: string
 * }
 * ```
 */
export function BigIntValue(target: any, propertKey: string | symbol): void {
	Reflect.defineMetadata('type:bigint', true, target, propertKey)
}

/**
 * Decorate a Dto object field as `@ChildDto` to specify that the JSON object property should be parsed as a child Dto.
 * @example
 * ```typescript
 *
 * class MyChildDto extends LosslessDto {
 *   someField!: string
 * }
 *
 * class MyDto extends LosslessDto {
 *   @Int64String
 *   int64NumberField!: string
 *   @BigIntValue
 *   bigintField!: bigint
 *   @ChildDto(MyChildDto)
 *   childDtoField!: MyChildDto
 *   normalField!: string
 *   normalNumberField!: number
 *   maybePresentField?: string
 * }
 */
export function ChildDto(childClass: any) {
	return function (target: any, propertyKey: string | symbol) {
		Reflect.defineMetadata('child:class', childClass, target, propertyKey)
	}
}

/**
 * Extend the LosslessDto class with your own Dto classes to enable lossless parsing of int64 values.
 * Decorate fields with `@Int64String` or `@BigIntValue` to specify how int64 JSON numbers should be parsed.
 * @example
 * ```typescript
 * class MyDto extends LosslessDto {
 *   @Int64String
 *   int64NumberField: string
 *   @BigIntValue
 *   bigintField: bigint
 *   @ChildDto(MyChildDto)
 *   childDtoField: MyChildDto
 *   normalField: string
 *   normalNumberField: number
 * }
 * ```
 */
export class LosslessDto {
	constructor(obj: any) {
		if (obj) {
			for (const [key, value] of Object.entries(obj)) {
				this[key] = value
			}
		}
	}
}

export function losslessParseArray<T = any>(
	json: string,
	dto?: { new (...args: any[]): T }
): T[] {
	return losslessParse(json, dto) as T[]
}

/**
 * With no Dto, the parser will throw if it encounters an int64 number that cannot be safely represented as a JS number.
 *
 * @param json the JSON string to parse
 * @param dto an annotated Dto class to parse the JSON string with
 */
export function losslessParse<T = any>(
	json: string,
	dto?: { new (...args: any[]): T }
): T {
	const parsedLossless = parse(json) as any

	if (Array.isArray(parsedLossless)) {
		debug(`Array input detected. Parsing array.`)
		return parseArrayWithAnnotations(
			json,
			dto ?? (LosslessDto as new (...args: any[]) => T)
		) as T
	}
	if (!dto) {
		debug(`No Dto class provided. Parsing without annotations (safe parse).`)
		return convertLosslessNumbersToNumberOrThrow(parsedLossless) as T
	}
	debug(`Got a Dto ${dto.name}. Parsing with annotations.`)
	const parsed = parseWithAnnotations(parsedLossless, dto)
	debug(`Converting remaining lossless numbers to numbers for ${dto.name}`)
	return convertLosslessNumbersToNumberOrThrow(parsed)
}

function parseWithAnnotations<T>(
	obj: any,
	dto: { new (...args: any[]): T }
): T {
	const instance = new dto()

	for (const [key, value] of Object.entries(obj)) {
		const childClass = Reflect.getMetadata('child:class', dto.prototype, key)
		if (childClass) {
			if (Array.isArray(value)) {
				// If the value is an array, parse each element with the specified child class
				instance[key] = value.map((item) =>
					losslessParse(stringify(item) as string, childClass)
				)
			} else {
				// If the value is an object, parse it with the specified child class
				instance[key] = losslessParse(stringify(value) as string, childClass)
			}
		} else {
			if (Reflect.hasMetadata('type:int64', dto.prototype, key)) {
				debug(`Parsing int64 field "${key}" to string`)
				if (value) {
					if (isLosslessNumber(value)) {
						instance[key] = (value as LosslessNumber).toString()
					} else {
						throw new Error(
							`Unexpected type: Received JSON ${typeof value} value for Int64String Dto field "${key}", expected number`
						)
					}
				}
			} else if (Reflect.hasMetadata('type:bigint', dto.prototype, key)) {
				debug(`Parsing bigint field ${key}`)
				if (value) {
					if (isLosslessNumber(value)) {
						instance[key] = BigInt((value as LosslessNumber).toString())
					} else {
						throw new Error(
							`Unexpected type: Received JSON ${typeof value} value for BigIntValue Dto field "${key}", expected number`
						)
					}
				}
			} else {
				instance[key] = value // Assign directly for other types
			}
		}
	}

	return instance
}

function parseArrayWithAnnotations<T>(
	json: string,
	dto: { new (...args: any[]): T }
): T[] {
	const array = parse(json) as any[]

	return array.map((item) =>
		losslessParse(stringify(item) as string, dto)
	) as T[]
}

/**
 * Convert all `LosslessNumber` instances to a number or throw if any are unsafe
 */
function convertLosslessNumbersToNumberOrThrow<T>(obj: any): T {
	debug(`Parsing LosslessNumbers to numbers for ${obj.constructor.name}`)
	let currentKey = ''
	try {
		Object.keys(obj).forEach((key) => {
			currentKey = key
			if (Array.isArray(obj[key])) {
				// If the value is an array, iterate over it and recursively call the function on each element
				obj[key].forEach((item: any, index: number) => {
					obj[key][index] = convertLosslessNumbersToNumberOrThrow(item)
				})
			} else if (isLosslessNumber(obj[key])) {
				debug(`Converting LosslessNumber ${key} to number`)
				obj[key] = toSafeNumberOrThrow(obj[key].toString())
			} else if (typeof obj[key] === 'object' && obj[key] !== null) {
				// If the value is an object, recurse into it
				obj[key] = convertLosslessNumbersToNumberOrThrow(obj[key])
			}
		})
	} catch (e) {
		const message = (e as Error).message
		throw new Error(
			`An unsafe number value was received for "${currentKey}" and no Dto mapping was specified.\n` +
				message
		)
	}
	return obj
}

export function losslessStringify<T extends LosslessDto>(
	obj: T,
	isTopLevel = true
): string {
	const isLosslessDto = obj instanceof LosslessDto

	debug(`Stringifying ${isLosslessDto ? obj.constructor.name : 'object'}`)
	if (!isLosslessDto) {
		debug(`Object is not a LosslessDto. Stringifying as normal JSON.`)
	}

	const newObj: any = Array.isArray(obj) ? [] : {}

	Object.keys(obj).forEach((key) => {
		const value = obj[key]

		if (typeof value === 'object' && value !== null) {
			// If the value is an object or array, recurse into it
			newObj[key] = losslessStringify(value, false)
		} else if (Reflect.getMetadata('type:int64', obj, key)) {
			// If the property is decorated with @Int64String, convert the string to a LosslessNumber
			debug(`Stringifying int64 string field ${key}`)
			newObj[key] = new LosslessNumber(value)
		} else if (Reflect.getMetadata('type:bigint', obj, key)) {
			// If the property is decorated with @BigIntValue, convert the bigint to a LosslessNumber
			debug(`Stringifying bigint field ${key}`)
			newObj[key] = new LosslessNumber(value.toString())
		} else {
			newObj[key] = value
		}
	})

	return isTopLevel ? (stringify(newObj) as string) : newObj
}
