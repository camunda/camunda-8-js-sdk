import {
	BigIntValue,
	ChildDto,
	Int64String,
	LosslessDto,
	losslessParse,
	losslessStringify,
} from '../../lib'
import { ProcessInstanceStatistics } from '../../operate/lib/OperateDto'

test('LosslessJsonParser correctly handles nested Dtos', () => {
	class DecisionInstanceOutput extends LosslessDto {
		public someInt32Field!: number
	}

	class ProcessDefinitionDto extends LosslessDto {
		@ChildDto(DecisionInstanceOutput)
		public decisionsOutputs!: DecisionInstanceOutput[]

		@Int64String
		public total!: string // Example of another field
	}

	const json = `{
			"total": 3,
			"decisionsOutputs": [
				{
					"someInt32Field": 123
				}
			]
		}`

	const parsedDto = losslessParse(json, ProcessDefinitionDto)
	expect(parsedDto.decisionsOutputs[0].someInt32Field).toBe(123) // 123 (number)
	expect(parsedDto.total).toBe('3') // 3 (string)
})

test('LosslessJsonParser can handle an array', () => {
	class ProcessInstanceStatisticsWithInt32 extends ProcessInstanceStatistics {
		smallNumber!: number
	}
	const json = `[
			{
				"activityId": "activityId",
				"active": 1,
				"canceled": 2,
				"incidents": 3,
				"completed": 4,
				"smallNumber": 100
			},
			{
				"activityId": "activityId2",
				"active": 11,
				"canceled": 12,
				"incidents": 13,
				"completed": 14
			}
		]`
	const parsedDto = losslessParse(
		json,
		ProcessInstanceStatisticsWithInt32
	) as unknown as ProcessInstanceStatisticsWithInt32[]
	expect(Array.isArray(parsedDto)).toBe(true)
	expect(parsedDto[0].activityId).toBe('activityId')
	expect(parsedDto[0].active).toBe('1')
	expect(parsedDto[0].smallNumber).toBe(100)
	expect(parsedDto[1].activityId).toBe('activityId2')
	expect(parsedDto[1].active).toBe('11')
})

test('LosslessJsonParser will throw when passed an unsafe int64 number and no Dto', () => {
	let threw = false
	const text = '{"normal":2.3,"long":123456789012345678901,"big":2.3e+500}'
	try {
		losslessParse(text)
	} catch (e) {
		threw = true
		expect((e as Error).message.includes('unsafe number value'))
	}
	expect(threw).toBe(true)
})

test('LosslessJsonParser will throw when passed an unsafe int64 number and a Dto without a mapping for it', () => {
	let threw = false
	const text = '{"normal":2.3,"long":123456789012345678901,"big":2.3e+500}'
	try {
		losslessParse(text, LosslessDto)
	} catch (e) {
		threw = true
		expect((e as Error).message.includes('Unsafe number detected'))
	}
	expect(threw).toBe(true)
})

test('LosslessJsonParser will parse a BigInt when passed an int64 number and a mapped Dto', () => {
	const text = '{"normal":2.3,"long":123456789012345678901,"big":2.3e+500}'

	class BigIntDto extends LosslessDto {
		@BigIntValue
		long!: bigint
		normal!: number
		@Int64String
		big!: string
	}

	const v = losslessParse(text, BigIntDto)
	expect(v.long).toBe(123456789012345678901n)
	expect(v.normal).toBe(2.3)
})

test('LosslessJsonParser with safe numbers and no Dto works like JSON.parse', () => {
	const json = `[
			{
				"activityId": "activityId",
				"active": 1,
				"canceled": 2,
				"incidents": 3,
				"completed": 4,
				"smallNumber": 100
			},
			{
				"activityId": "activityId2",
				"active": 11,
				"canceled": 12,
				"incidents": 13,
				"completed": 14
			}
		]`
	const p = losslessParse(json)
	expect(p[0].active).toBe(1)
	expect(p[1].incidents).toBe(13)
})

test('LosslessJsonParser parses unexpected numbers as number at runtime', () => {
	class InputVariables extends LosslessDto {
		name!: string
		@Int64String
		key!: string
		@BigIntValue
		bigInt!: bigint
	}

	const json = `{
			"name": "John Doe",
			"key": 12345678901234567890,
			"age": 42,
			"bigInt": 12345678901234567890
		}`
	const parsedDto = losslessParse(json, InputVariables)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expect((parsedDto as any).age).toBe(42)
})

test('LosslessJsonParser is ok with missing optional fields at runtime', () => {
	class InputVariables extends LosslessDto {
		name!: string
		@Int64String
		key!: string
		@BigIntValue
		bigInt!: bigint
		@Int64String
		optionalKey?: string
	}

	const json = `{
			"name": "John Doe",
			"key": 12345678901234567890,
			"age": 42,
			"bigInt": 12345678901234567890
		}`
	const parsedDto = losslessParse(json, InputVariables)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	expect((parsedDto as any).age).toBe(42)
})

test('LosslessJsonParser will throw if an unexpected type is encountered at runtime', () => {
	class InputVariables extends LosslessDto {
		name!: string
		@Int64String
		key!: string
		@BigIntValue
		bigInt!: bigint
		@Int64String
		optionalKey?: string
	}

	const json = `{
			"name": "John Doe",
			"key": 12345678901234567890,
			"age": 42,
			"bigInt": 12345678901234567890,
			"optionalKey": "optional"
		}`
	let threw = false
	try {
		losslessParse(json, InputVariables)
	} catch (e) {
		expect((e as Error).message.includes('Unexpected type')).toBe(true)
		threw = true
	}
	expect(threw).toBe(true)
})

test('LosslessJsonParser throws for unexpected unsafe numbers at runtime', () => {
	class InputVariables extends LosslessDto {
		name!: string
		@Int64String
		key!: string
		@BigIntValue
		bigInt!: bigint
	}

	let threw = false
	const json = `{
			"name": "John Doe",
			"key": 12345678901234567890,
			"age": 42,
			"bigInt": 12345678901234567890,
			"unexpectedBig": 1234567890123456789012345678901234567890
		}`
	try {
		losslessParse(json, InputVariables)
	} catch (e) {
		threw = true
	}
	expect(threw).toBe(true)
})

test('LosslessJsonParser/Stringify correctly handles array of nested Dtos', () => {
	class DecisionInstanceOutput extends LosslessDto {
		public someInt32Field!: number
		@Int64String
		public someInt64Field!: string
	}

	class ProcessDefinitionDto extends LosslessDto {
		@ChildDto(DecisionInstanceOutput)
		public decisionsOutputs!: DecisionInstanceOutput[]

		@Int64String
		public total!: string // Example of another field
	}

	const json = `[{
			"total": 3,
			"decisionsOutputs": [
				{
					"someInt32Field": 123,
					"someInt64Field": 123
				}
			]
		},
		{
			"total": 2,
			"decisionsOutputs": [
				{
					"someInt32Field": 456,
					"someInt64Field": 456
				}
			]
		}]
		`

	const parsedDto = losslessParse(json, ProcessDefinitionDto)
	expect(parsedDto[0].decisionsOutputs[0].someInt32Field).toBe(123) // 123 (number)
	expect(parsedDto[0].decisionsOutputs[0].someInt64Field).toBe('123') // 123 (string)
	expect(parsedDto[1].decisionsOutputs[0].someInt32Field).toBe(456) // 123 (number)
	expect(parsedDto[1].decisionsOutputs[0].someInt64Field).toBe('456') // 123 (string)
	const stringified = losslessStringify(parsedDto)
	expect(typeof stringified).toBe('string')
	expect(stringified).toBe(
		`[{"total":3,"decisionsOutputs":[{"someInt32Field":123,"someInt64Field":123}]},{"total":2,"decisionsOutputs":[{"someInt32Field":456,"someInt64Field":456}]}]`
	)
})

test('LosslessStringify parses safe unexpected numbers as number at runtime', () => {
	class InputVariables extends LosslessDto {
		name!: string
		@Int64String
		key!: string
		@BigIntValue
		bigInt!: bigint
	}

	const json = `{
			"name": "John Doe",
			"key": 12345678901234567890,
			"age": 42,
			"bigInt": 12345678901234567890
		}`
	const parsedDto = losslessParse(json, InputVariables)
	const stringified = losslessStringify(parsedDto)
	expect(typeof stringified).toBe('string')
	expect(stringified).toBe(
		`{"name":"John Doe","key":12345678901234567890,"age":42,"bigInt":12345678901234567890}`
	)
})

test('LosslessStringify correctly handles nested Dtos', () => {
	class DecisionInstanceOutput extends LosslessDto {
		public someInt32Field!: number
		@Int64String
		public someInt64Field!: string
	}

	class ProcessDefinitionDto extends LosslessDto {
		@ChildDto(DecisionInstanceOutput)
		public decisionsOutputs!: DecisionInstanceOutput[]

		@Int64String
		public total!: string // Example of another field
	}

	const json = `{
			"total": 3,
			"decisionsOutputs": [
				{
					"someInt32Field": 123,
					"someInt64Field": 123
				}
			]
		}`

	const parsedDto = losslessParse(json, ProcessDefinitionDto)
	expect(parsedDto.decisionsOutputs[0].someInt32Field).toBe(123) // 123 (number)
	expect(parsedDto.decisionsOutputs[0].someInt64Field).toBe('123') // 123 (string)
	const stringified = losslessStringify(parsedDto)
	expect(typeof stringified).toBe('string')
	expect(stringified).toBe(
		`{"total":3,"decisionsOutputs":[{"someInt32Field":123,"someInt64Field":123}]}`
	)
})
