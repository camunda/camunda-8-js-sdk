/**
 * This is a custom JSON Parser that handles lossless parsing of int64 numbers by using the lossless-json library.
 *
 * It converts all JSON numbers to lossless numbers, then converts them back to the correct type based on the metadata
 * of a Dto class - fields decorated with `@Int32` are converted to a `number` and fields decorated with `@Int64` are
 * converted to a `string`.
 *
 * It also handles nested Dtos by using the `@ChildDto` decorator.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	LosslessNumber,
	isLosslessNumber,
	parse,
	stringify,
} from 'lossless-json'
import 'reflect-metadata'

type DtoBehaviour = 'mapped' | 'safe' | 'lossless'
const DTOBEHAVIOUR = 'dtoBehaviour'

export function DtoBehaviour(behaviour: DtoBehaviour) {
	// eslint-disable-next-line @typescript-eslint/ban-types
	return function (constructor: Function) {
		Reflect.defineMetadata(DTOBEHAVIOUR, behaviour, constructor.prototype)
	}
}

/**
 * Decorate Dto number fields as @Int32 to specify that the JSON number property should be parsed as a number.
 */
export function Int32(target: any, propertyKey: string | symbol): void {
	Reflect.defineMetadata('type:int32', true, target, propertyKey)
}

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

@DtoBehaviour('mapped')
export class LosslessDto {
	constructor(obj: any) {
		if (obj) {
			for (const [key, value] of Object.entries(obj)) {
				this[key] = value
			}
		}
	}
}

@DtoBehaviour('safe')
export class SafeLosslessDto extends LosslessDto {}

@DtoBehaviour('lossless')
export class LosslessDtoWithInt64 extends LosslessDto {}

export function losslessParseArray<T = any>(
	json: string,
	dto?: { new (...args: any[]): T }
): T[] {
	return losslessParse(json, dto) as T[]
}

/**
 * With no Dto, the parser will throw if it encounters an int64 number that cannot be safely represented as a JS number.
 * With a Dto decorated with @Behaviour(), the parser will use the decorator value to determine how to parse the JSON string:
 *  'mapped' will parse the JSON string with the annotated Dto class.
 *  'safe' will throw if it encounters an int64 number that cannot be safely represented as a JS number.
 *  'lossless' will parse the JSON string with the lossless-json library and return a LosslessNumber for any int64 values.
 * With a Dto with no class annotation, the parser will use the annotations on the Dto fields to determine how to parse the JSON string (mapped).
 * @param json the JSON string to parse
 * @param dto an annotated Dto class to parse the JSON string with
 */
export function losslessParse<T = any>(
	json: string,
	dto?: { new (...args: any[]): T }
): T {
	const maybeArray = parse(json) as any[]

	if (Array.isArray(maybeArray)) {
		return parseArrayWithAnnotations(
			json,
			dto ?? (LosslessDto as new (...args: any[]) => T)
		) as T
	}
	if (!dto) {
		return parseAndThrowForUnsafeNumbers(json) as T
	}
	const behaviour: DtoBehaviour = Reflect.getMetadata(
		DTOBEHAVIOUR,
		dto.prototype
	)
	if (behaviour === 'mapped') {
		return parseWithAnnotations(json, dto)
	}
	if (behaviour === 'safe') {
		return parseAndThrowForUnsafeNumbers(json) as T
	}
	if (behaviour === 'lossless') {
		return parse(json) as T
	}
	return parseWithAnnotations(json, dto)
}

function parseWithAnnotations<T>(
	json: string,
	dto: { new (...args: any[]): T }
): T {
	const obj = parse(json) as any // Assume using a parser that doesn't lose precision for int64

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
			// Existing logic for int32 and int64...
			if (Reflect.hasMetadata('type:int32', dto.prototype, key)) {
				instance[key] =
					value && isLosslessNumber(value)
						? (value as LosslessNumber).valueOf()
						: value // Assuming value is already the correct type
			} else if (Reflect.hasMetadata('type:int64', dto.prototype, key)) {
				instance[key] =
					value && isLosslessNumber(value)
						? (value as LosslessNumber).toString()
						: value // Assuming value is string
			} else if (Reflect.hasMetadata('type:bigint', dto.prototype, key)) {
				instance[key] =
					value && isLosslessNumber(value)
						? BigInt((value as LosslessNumber).toString())
						: value // Assuming value is bigint
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

function parseAndThrowForUnsafeNumbers(json: string): any {
	const obj = parse(json) as any

	try {
		Object.keys(obj).forEach((key) => {
			if (isLosslessNumber(obj[key])) {
				obj[key] = obj[key].valueOf()
			}
		})
	} catch (e) {
		throw new Error(
			'Unsafe number detected - an int64 JSON serialised value was received that cannot be represented as a JS number type without loss of precision.'
		)
	}
	return obj
}
