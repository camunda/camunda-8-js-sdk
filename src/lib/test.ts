/* eslint-disable @typescript-eslint/no-explicit-any */
import { Int64String, LosslessDto, losslessParse } from './LosslessJsonParser'

class JobDto<Variables, CustomHeaders> extends LosslessDto {
	@Int64String
	public key!: string
	variables!: Variables
	customHeaders!: CustomHeaders
}

class Variables extends LosslessDto {
	@Int64String
	bigValue!: string
}

class CustomHeaders extends LosslessDto {
	@Int64String
	bigHeader!: string
	smallHeader!: number
}

function extendClass<T, V>(
	jobClass: typeof JobDto<T, V>,
	variables: T,
	customHeaders: V
) {
	Reflect.defineMetadata(
		'child:class',
		variables,
		jobClass.prototype,
		'variables'
	)
	Reflect.defineMetadata(
		'child:class',
		customHeaders,
		JobDto.prototype,
		'customHeaders'
	)
	return jobClass
}

extendClass(JobDto, Variables, CustomHeaders)

console.log(Reflect.hasMetadata('Int64String', JobDto, 'key')) // true
const res = losslessParse(
	`{"key":123,"variables":{"bigValue": 45},"customHeaders":{"bigHeader":69, "smallHeader": 23}}`,
	JobDto<Variables, CustomHeaders>
)

console.log(res)
console.log(typeof res.key) // should be string
console.log(typeof res.variables.bigValue) // should be string
console.log(typeof res.customHeaders.bigHeader) // should be string
console.log(typeof res.customHeaders.smallHeader) // should be number
