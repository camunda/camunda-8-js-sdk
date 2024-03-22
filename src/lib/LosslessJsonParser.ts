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
import { LosslessNumber, parse, stringify } from 'lossless-json'
import 'reflect-metadata'

// Custom Decorators
export function Int32(target: any, propertyKey: string | symbol): void {
	Reflect.defineMetadata('type:int32', true, target, propertyKey)
}

export function Int64(target: any, propertyKey: string | symbol): void {
	Reflect.defineMetadata('type:int64', true, target, propertyKey)
}

// Custom decorator to specify the class type of a property
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

export function parseWithAnnotations<T>(
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
					parseWithAnnotations(stringify(item) as string, childClass)
				)
			} else {
				// If the value is an object, parse it with the specified child class
				instance[key] = parseWithAnnotations(
					stringify(value) as string,
					childClass
				)
			}
		} else {
			// Existing logic for int32 and int64...
			if (Reflect.hasMetadata('type:int32', dto.prototype, key)) {
				instance[key] = (value as LosslessNumber).valueOf() // Assuming value is already the correct type
			} else if (Reflect.hasMetadata('type:int64', dto.prototype, key)) {
				instance[key] = (value as LosslessNumber).toString() // Assuming value is string
			} else {
				instance[key] = value // Assign directly for other types
			}
		}
	}

	return instance
}

export function parseArrayWithAnnotations<T>(
	json: string,
	dto: { new (...args: any[]): T }
): T[] {
	const array = parse(json) as any[] // Assume using a parser that doesn't lose precision for int64

	return array.map((item) =>
		parseWithAnnotations(stringify(item) as string, dto)
	)
}
