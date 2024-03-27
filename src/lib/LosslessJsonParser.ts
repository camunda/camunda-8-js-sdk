/**
 * This is a custom JSON Parser that handles lossless parsing of int64 numbers by using the lossless-json library.
 *
 * It converts all JSON numbers to lossless numbers, then converts them back to the correct type based on the metadata
 * of a Dto class - fields decorated with `@Int64` are converted to a `string`, fields decorated with `@BigIntValue` are
 * converted to `bigint`. All other numbers are converted to `number`. Throws if a number cannot be safely converted.
 *
 * It also handles nested Dtos by using the `@ChildDto` decorator.
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
 * Decorate Dto string fields as @Int64String to specify that the JSON number property should be parsed as a string.
 */
export function Int64String(target: any, propertyKey: string | symbol): void {
	Reflect.defineMetadata('type:int64', true, target, propertyKey)
}

/**
 * Decorate Dto bigint fields as @BigInt to specify that the JSON number property should be parsed as a bigint.
 * @param target
 * @param propertKey
 */
export function BigIntValue(target: any, propertKey: string | symbol): void {
	Reflect.defineMetadata('type:bigint', true, target, propertKey)
}

/**
 * Decorate a Dto object field as @ChildDto to specify that the JSON object property should be parsed as a child Dto.
 */
export function ChildDto(childClass: any) {
	return function (target: any, propertyKey: string | symbol) {
		Reflect.defineMetadata('child:class', childClass, target, propertyKey)
	}
}

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
				debug(`Parsing int64 field ${key}`)
				if (value) {
					if (isLosslessNumber(value)) {
						instance[key] = (value as LosslessNumber).toString()
					} else {
						throw new Error(`Received ${typeof value} for int64 field ${key}`)
					}
				}
			} else if (Reflect.hasMetadata('type:bigint', dto.prototype, key)) {
				debug(`Parsing bigint field ${key}`)
				if (value) {
					if (isLosslessNumber(value)) {
						instance[key] = BigInt((value as LosslessNumber).toString())
					} else {
						throw new Error(`Received ${typeof value} for bigint field ${key}`)
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
	debug(`Converting LosslessNumbers to numbers`)
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
