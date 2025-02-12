/**
 * This is a custom JSON Parser that handles lossless parsing of int64 numbers by using the lossless-json library.
 *
 * This is motivated by the use of int64 for Camunda 8 Entity keys, which are not supported by JavaScript's Number type.
 * Variables could also contain unsafe large integers if an external system sends them to the broker.
 *
 * It converts all JSON numbers to lossless numbers, then converts them back to the correct type based on the metadata
 * of a Dto class - fields decorated with `@Int64` are converted to a `string`, fields decorated with `@BigIntValue` are
 * converted to `bigint`. All other numbers are converted to `number`. Throws if a number cannot be safely converted.
 *
 * It also handles nested Dtos by using the `@ChildDto` decorator.
 *
 * Update: added an optional `key` parameter to support the Camunda 8 REST API's use of an array under a key, e.g. { jobs : Job[] }
 *
 * Note: the parser uses DTO classes that extend the LosslessDto class to perform mappings of numeric types. However, only the type of
 * the annotated numerics is type-checked at runtime. Fields of other types are not checked.
 *
 * More details on the design here: https://github.com/camunda/camunda-8-js-sdk/issues/81#issuecomment-2022213859
 *
 * See this article to understand why this is necessary: https://jsoneditoronline.org/indepth/parse/why-does-json-parse-corrupt-large-numbers/
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

const MetadataKey = {
	INT64_STRING: 'type:int64',
	INT64_STRING_ARRAY: 'type:int64[]',
	INT64_BIGINT: 'type:bigint',
	INT64_BIGINT_ARRAY: 'type:bigint[]',
	CHILD_DTO: 'child:class',
}
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
	Reflect.defineMetadata(MetadataKey.INT64_STRING, true, target, propertyKey)
}

/**
 * Decorate Dto string fields as `@Int64StringArray` to specify that the array of JSON numbers should be parsed as an array of strings.
 * @example
 * ```typescript
 * class Dto extends LosslessDto {
 *   message!: string
 *   userId!: number
 *   @Int64StringArray
 *   sendTo!: string[]
 * }
 */
export function Int64StringArray(
	target: any,
	propertyKey: string | symbol
): void {
	Reflect.defineMetadata(
		MetadataKey.INT64_STRING_ARRAY,
		true,
		target,
		propertyKey
	)
}

/**
 * Decorate Dto bigint fields as `@BigIntValue` to specify that the JSON number property should be parsed as a bigint.
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
	Reflect.defineMetadata(MetadataKey.INT64_BIGINT, true, target, propertKey)
}

/**
 * Decorate Dto bigint fields as `@BigIntValueArray` to specify that the JSON number property should be parsed as a bigint.
 * @example
 * ```typescript
 * class MyDto extends LosslessDto {
 *   @Int64String
 *   int64NumberField!: string
 *   @BigIntValueArray
 *   bigintField!: bigint[]
 *   @ChildDto(MyChildDto)
 *   childDtoField!: MyChildDto
 *   normalField!: string
 *   normalNumberField!: number
 *   maybePresentField?: string
 * }
 * ```
 */
export function BigIntValueArray(
	target: any,
	propertKey: string | symbol
): void {
	Reflect.defineMetadata(
		MetadataKey.INT64_BIGINT_ARRAY,
		true,
		target,
		propertKey
	)
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
		Reflect.defineMetadata(
			MetadataKey.CHILD_DTO,
			childClass,
			target,
			propertyKey
		)
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
export class LosslessDto {}

/**
 * losslessParse uses lossless-json parse to deserialize JSON.
 * With no Dto, the parser will throw if it encounters an int64 number that cannot be safely represented as a JS number.
 *
 * @param json the JSON string to parse
 * @param dto an annotated Dto class to parse the JSON string with
 */
export function losslessParse<T = any>(
	json: string,
	dto?: { new (...args: any[]): T },
	keyToParse?: string
): T {
	/**
	 * lossless-json parse converts all numerics to LosslessNumber type instead of number type.
	 * Here we safely parse the string into an JSON object with all numerics as type LosslessNumber.
	 * This way we lose no fidelity at this stage, and can then use a supplied DTO to map large numbers
	 * or throw if we find an unsafe number.
	 */

	const parsedLossless = parse(json) as any

	/**
	 * Specifying a keyToParse value applies all the mapping functionality to a key of the object in the JSON.
	 * gRPC API responses were naked objects or arrays of objects. REST response shapes typically have
	 * an array under an object key - eg: { jobs: [ ... ] }
	 *
	 * Since we now have a safely parsed object, we can recursively call losslessParse with the key, if it exists.
	 */
	if (keyToParse) {
		if (parsedLossless[keyToParse]) {
			return losslessParse(stringify(parsedLossless[keyToParse]) as string, dto)
		}
		/**
		 * A key was specified, but it was not found on the parsed object.
		 * At this point we should throw, because we cannot perform the operation requested. Something has gone wrong with
		 * the expected shape of the response.
		 *
		 * We throw an error with the actual shape of the object to help with debugging.
		 */
		throw new Error(
			`Attempted to parse key ${keyToParse} on an object that does not have this key: ${stringify(
				parsedLossless
			)}`
		)
	}

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
	/** All numbers are parsed to LosslessNumber by lossless-json. For any fields that should be numbers, we convert them
	 * now to number. Because we expose large values as string or BigInt, the only Lossless numbers left on the object
	 * are unmapped. So at this point we convert all remaining LosslessNumbers to number type if safe, and throw if not.
	 */
	return convertLosslessNumbersToNumberOrThrow(parsed)
}

function parseWithAnnotations<T>(
	obj: any,
	dto: { new (...args: any[]): T }
): T {
	const instance = new dto()

	for (const [key, value] of Object.entries(obj)) {
		const childClass = Reflect.getMetadata(
			MetadataKey.CHILD_DTO,
			dto.prototype,
			key
		)
		if (childClass) {
			if (Array.isArray(value)) {
				// If the value is an array, parse each element with the specified child class
				instance[key] = value.map((item) =>
					losslessParse(stringify(item)!, childClass)
				)
			} else {
				// If the value is an object, parse it with the specified child class
				instance[key] = losslessParse(stringify(value)!, childClass)
			}
		} else {
			if (
				Reflect.hasMetadata(MetadataKey.INT64_STRING_ARRAY, dto.prototype, key)
			) {
				debug(`Parsing int64 array field "${key}" to string`)
				if (Array.isArray(value)) {
					instance[key] = value.map((item) => {
						// item is already a string - from 8.7, the broker returns strings for int64 entity keys
						if (typeof item === 'string') {
							return item
						}
						if (isLosslessNumber(item)) {
							return item.toString()
						} else {
							debug('Unexpected type for value', value)
							throw new Error(
								`Unexpected type: Received JSON ${typeof item} value for Int64String Dto field "${key}", expected number`
							)
						}
					})
				} else {
					const type = value instanceof LosslessNumber ? 'number' : typeof value
					throw new Error(
						`Unexpected type: Received JSON ${type} value for Int64StringArray Dto field "${key}", expected Array`
					)
				}
			} else if (
				Reflect.hasMetadata(MetadataKey.INT64_STRING, dto.prototype, key)
			) {
				debug(`Parsing int64 field "${key}" to string`)
				if (value) {
					// value is already a string - from 8.7, the broker returns strings for int64 entity keys
					if (typeof value === 'string') {
						instance[key] = value
					} else if (isLosslessNumber(value)) {
						instance[key] = value.toString()
					} else {
						if (Array.isArray(value)) {
							throw new Error(
								`Unexpected type: Received JSON array value for Int64String Dto field "${key}", expected number. If you are expecting an array, use the @Int64StringArray decorator.`
							)
						}
						const type =
							value instanceof LosslessNumber ? 'number' : typeof value

						throw new Error(
							`Unexpected type: Received JSON ${type} value for Int64String Dto field "${key}", expected number`
						)
					}
				}
			} else if (
				Reflect.hasMetadata(MetadataKey.INT64_BIGINT_ARRAY, dto.prototype, key)
			) {
				debug(`Parsing int64 array field "${key}" to BigInt`)
				if (Array.isArray(value)) {
					instance[key] = value.map((item) => {
						if (isLosslessNumber(item)) {
							return BigInt(item.toString())
						} else {
							debug('Unexpected type for value', value)
							throw new Error(
								`Unexpected type: Received JSON ${typeof item} value for BigIntValue in Dto field "${key}[]", expected number`
							)
						}
					})
				} else {
					const type = value instanceof LosslessNumber ? 'number' : typeof value
					throw new Error(
						`Unexpected type: Received JSON ${type} value for BigIntValueArray Dto field "${key}", expected Array`
					)
				}
			} else if (
				Reflect.hasMetadata(MetadataKey.INT64_BIGINT, dto.prototype, key)
			) {
				debug(`Parsing bigint field ${key}`)
				if (value) {
					if (isLosslessNumber(value)) {
						instance[key] = BigInt(value.toString())
					} else {
						if (Array.isArray(value)) {
							throw new Error(
								`Unexpected type: Received JSON array value for BigIntValue Dto field "${key}", expected number. If you are expecting an array, use the @BigIntValueArray decorator.`
							)
						}
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
 * Convert all `LosslessNumber` instances to a number or throw if any are unsafe.
 *
 * All numerics are converted to LosslessNumbers by lossless-json parse. Then, if a DTO was provided,
 * all mappings have been done to either BigInt or string type. So all remaining LosslessNumbers in the object
 * are either unmapped or mapped to number.
 *
 * Here we convert all remaining LosslessNumbers to a safe number value, or throw if an unsafe value is detected.
 */
function convertLosslessNumbersToNumberOrThrow<T>(obj: any): T {
	debug(`Parsing LosslessNumbers to numbers for ${obj?.constructor?.name}`)
	if (!obj) {
		return obj
	}
	if (obj instanceof LosslessNumber) {
		return toSafeNumberOrThrow(obj.toString()) as T
	}
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

	if (obj instanceof Date) {
		throw new Error(
			`Date type not supported in variables. Please serialize with .toISOString() before passing to Camunda`
		)
	}
	if (obj instanceof Map) {
		throw new Error(
			`Map type not supported in variables. Please serialize with Object.fromEntries() before passing to Camunda`
		)
	}
	if (obj instanceof Set) {
		throw new Error(
			`Set type not supported in variables. Please serialize with Array.from() before passing to Camunda`
		)
	}

	const newObj: any = Array.isArray(obj) ? [] : {}

	Object.keys(obj).forEach((key) => {
		const value = obj[key]

		if (typeof value === 'object' && value !== null) {
			// If the value is an object or array, recurse into it
			newObj[key] = losslessStringify(value, false)
		} else if (Reflect.getMetadata(MetadataKey.INT64_STRING, obj, key)) {
			// If the property is decorated with @Int64String, convert the string to a LosslessNumber
			debug(`Stringifying int64 string field ${key}`)
			newObj[key] = new LosslessNumber(value)
		} else if (Reflect.getMetadata(MetadataKey.INT64_BIGINT, obj, key)) {
			// If the property is decorated with @BigIntValue, convert the bigint to a LosslessNumber
			debug(`Stringifying bigint field ${key}`)
			newObj[key] = new LosslessNumber(value.toString())
		} else {
			newObj[key] = value
		}
	})

	return isTopLevel ? (stringify(newObj) as string) : newObj
}
