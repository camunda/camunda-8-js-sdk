import {
	BigIntValue,
	BigIntValueArray,
	ChildDto,
	createDtoInstance,
	Int64String,
	Int64StringArray,
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

/**
 * In versions prior to 8.7, entity keys were transmitted as JSON number values.
 * In 8.7, they are transmitted as JSON strings.
 * This test ensures that the parser can handle both cases.
 */
test('LosslessJsonParser will not throw if a string type is encountered in an int64String annotated field at runtime', () => {
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
	let parsed: InputVariables
	try {
		parsed = losslessParse(json, InputVariables)
		expect(parsed.key).toBe('12345678901234567890')
		expect(parsed.optionalKey).toBe('optional')
	} catch (e) {
		threw = true
	}
	expect(threw).toBe(false)
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

test('LosslessJsonParser correctly handles null objects', () => {
	const json = `{"abc": [null, null, null] }`

	const parsedDto = losslessParse(json)
	expect(parsedDto.abc).toMatchObject([null, null, null]) // 3 (string)
})

test('LosslessStringify correctly handles null objects', () => {
	const json = { abc: [null, null, null] }

	const stringifiedDto = losslessStringify(json)
	expect(stringifiedDto).toBe(`{"abc":[null,null,null]}`) // 3 (string)
})

test('LosslessJsonParser handles subkeys', () => {
	const jsonString = `{"jobs":[{"key":2251799813737371,"type":"console-log-complete","processInstanceKey":2251799813737366,"processDefinitionId":"hello-world-complete","processDefinitionVersion":1,"processDefinitionKey":2251799813736299,"elementId":"ServiceTask_0g6tf5f","elementInstanceKey":2251799813737370,"customHeaders":{"message":"Hello World"},"worker":"test","retries":100,"deadline":1725501895792,"variables":{},"tenantId":"<default>"}]}`

	const parsed = losslessParse(jsonString, undefined, 'jobs')
	expect(parsed[0].key).toBe(2251799813737371)
})

test('LosslessJsonParser will throw if given stringified JSON with an unsafe integer number', () => {
	let threw = false
	const json = `{"unsafeNumber": 9223372036854775808}` // Unsafe integer (greater than Int64 max)

	try {
		losslessParse(json) // Attempt to parse un-mapped JSON directly
	} catch (e) {
		threw = true
		expect((e as Error).message.includes('unsafe number value')).toBe(true)
	}

	expect(threw).toBe(true)
})

test('LosslessJsonParser will throw if given stringified JSON with an unsafe integer number, even with a Dto', () => {
	let threw = false
	const json = `{"unsafeNumber": 9223372036854775808}` // Unsafe integer (greater than Int64 max)

	class Dto extends LosslessDto {
		unsafeNumber!: number
	}

	try {
		losslessParse(json, Dto) // Attempt to parse mapped JSON without a mapping
	} catch (e) {
		threw = true
		expect((e as Error).message.includes('unsafe number value')).toBe(true)
	}

	expect(threw).toBe(true)
})

test('It rejects Date, Map, and Set types', () => {
	class Dto extends LosslessDto {
		date?: Date
		name?: string
		map?: Map<string, string>
		set?: Set<string>
	}
	const date = new Date()
	const dto = createDtoInstance(Dto, { date, name: 'me' })
	expect(() => losslessStringify(dto)).toThrow('Date')
	const mapDto = createDtoInstance(Dto, { map: new Map() })
	expect(() => losslessStringify(mapDto)).toThrow('Map')
	const setDto = createDtoInstance(Dto, { set: new Set<string>() })
	expect(() => losslessStringify(setDto)).toThrow('Set')
})

test('It correctly handles a number array in a subkey', () => {
	const json = `{"message":"Hello from automation","userId":null,"sendTo":[12022907,12022896,12022831]}`
	const res = losslessParse(json)
	expect(res.sendTo[0]).toBe(12022907)
})

test('It correctly handles a number array in a subkey with a DTO (Int64StringArray)', () => {
	class Dto extends LosslessDto {
		message!: string
		userId!: number
		@Int64StringArray
		sendTo!: string[]
	}

	const json = `{"message":"Hello from automation","userId":null,"sendTo":[12022907,12022896,12022831]}`
	const res = losslessParse(json, Dto)
	expect(res.sendTo[0]).toBe('12022907')
})

test('It correctly handles a number array in a subkey with a DTO (BigIntValueArray)', () => {
	class Dto extends LosslessDto {
		message!: string
		userId!: number
		@BigIntValueArray
		sendTo!: string[]
	}

	const json = `{"message":"Hello from automation","userId":null,"sendTo":[12022907,12022896,12022831]}`
	const res = losslessParse(json, Dto)
	expect(res.sendTo[0]).toBe(BigInt('12022907'))
})

test('It correctly throws when encountering a number rather than an array in a subkey with a DTO (Int64StringArray)', () => {
	class Dto extends LosslessDto {
		message!: string
		userId!: number
		@Int64StringArray
		sendTo!: string[]
	}

	const json = `{"message":"Hello from automation","userId":null,"sendTo":12022907}`
	expect(() => losslessParse(json, Dto)).toThrow('expected Array')
})

test('It correctly throws when encountering a number rather than an array in a subkey with a DTO (BigIntValueArray)', () => {
	class Dto extends LosslessDto {
		message!: string
		userId!: number
		@BigIntValueArray
		sendTo!: string[]
	}

	const json = `{"message":"Hello from automation","userId":null,"sendTo":12022907}`
	expect(() => losslessParse(json, Dto)).toThrow('expected Array')
})

describe('losslessParse native fast path (#890)', () => {
	const cases = [
		'{"a":1,"b":-2.5,"c":"x\\\\\\"9999999999999999","d":[1e21,0,-0.001],"e":null,"f":true}',
		'{"a":1.0,"b":1e3,"c":-0}',
		'[{"n":12345678901234},{"n":"str"}]',
		'{"s":"\\u00e9\\n\\\\","n":3.14}',
	]
	test.each(cases)('matches lossless-json semantics for %s', (json) => {
		class Dto extends LosslessDto {
			n!: number
		}
		expect(losslessParse(json)).toEqual(JSON.parse(json))
		expect(losslessParse(json, Dto)).toEqual(
			expect.objectContaining(
				Array.isArray(JSON.parse(json)) ? {} : JSON.parse(json)
			)
		)
	})

	test('preserves literal text for Int64String fields on fast and slow paths', () => {
		class Dto extends LosslessDto {
			@Int64String
			key!: string
			@BigIntValue
			big!: bigint
		}
		expect(losslessParse('{"key": 123, "big": 5}', Dto)).toMatchObject({
			key: '123',
			big: BigInt(5),
		})
		expect(
			losslessParse('{"key": 2251799813685249, "big": 9007199254740993}', Dto)
		).toMatchObject({
			key: '2251799813685249',
			big: BigInt('9007199254740993'),
		})
		expect(losslessParse('{"key": 1.50}', Dto).key).toBe('1.50')
	})

	test('still throws on unsafe number without a Dto', () => {
		expect(() => losslessParse('{"x": 9007199254740993}')).toThrow(
			/unsafe number value was received for "x"/
		)
	})

	test('a digit run inside a string does not affect numbers', () => {
		expect(losslessParse('{"s":"99999999999999999999","n":1}')).toEqual({
			s: '99999999999999999999',
			n: 1,
		})
	})

	test('does not retain per-character heap for large string variables', () => {
		const big = 'x'.repeat(10_000)
		const payload = JSON.stringify({ data: big, count: 1 })
		const start = Date.now()
		const kept: unknown[] = []
		for (let i = 0; i < 1600; i++) {
			kept.push(losslessParse(payload))
		}
		const elapsed = Date.now() - start
		expect(kept.length).toBe(1600)
		// lossless-json 4.3.x takes ~500ms+ and ~500MB here; JSON.parse ~10ms
		expect(elapsed).toBeLessThan(300)
		const gc = (globalThis as { gc?: () => void }).gc
		if (gc) {
			gc()
			const heap = process.memoryUsage().heapUsed
			// 1600 * 10KB = 16MB of payload; allow a generous multiple
			expect(heap).toBeLessThan(200 * 1024 * 1024)
		}
	})
})
