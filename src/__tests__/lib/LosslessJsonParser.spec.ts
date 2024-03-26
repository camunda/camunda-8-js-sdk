import {
	ChildDto,
	Int32,
	Int64,
	LosslessDto,
	parseAndThrowForUnsafeNumbers,
	parseArrayWithAnnotations,
	parseWithAnnotations,
} from 'lib'
import { ProcessInstanceStatistics } from 'operate/lib/OperateDto'

describe('LosslessJSONParser methods', () => {
	test('It correctly handles nested Dtos', () => {
		class DecisionInstanceOutput extends LosslessDto {
			@Int32
			public someInt32Field!: number
		}

		class ProcessDefinitionDto extends LosslessDto {
			@ChildDto(DecisionInstanceOutput)
			public decisionsOutputs!: DecisionInstanceOutput[]

			@Int64
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

		const parsedDto = parseWithAnnotations(json, ProcessDefinitionDto)
		expect(parsedDto.decisionsOutputs[0].someInt32Field).toBe(123) // 123 (number)
		expect(parsedDto.total).toBe('3') // 3 (string)
	})

	test('it can handle an array', () => {
		class ProcessInstanceStatisticsWithInt32 extends ProcessInstanceStatistics {
			@Int32
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
		const parsedDto = parseArrayWithAnnotations(
			json,
			ProcessInstanceStatisticsWithInt32
		)
		expect(Array.isArray(parsedDto)).toBe(true)
		expect(parsedDto[0].activityId).toBe('activityId')
		expect(parsedDto[0].active).toBe('1')
		expect(parsedDto[0].smallNumber).toBe(100)
		expect(parsedDto[1].activityId).toBe('activityId2')
		expect(parsedDto[1].active).toBe('11')
	})

	test('It will throw when passed an unsafe int64 number', () => {
		let threw = false
		const text = '{"normal":2.3,"long":123456789012345678901,"big":2.3e+500}'
		try {
			parseAndThrowForUnsafeNumbers(text)
		} catch (e) {
			threw = true
			expect((e as Error).message.includes('Unsafe number detected'))
		}
		expect(threw).toBe(true)
	})
})
