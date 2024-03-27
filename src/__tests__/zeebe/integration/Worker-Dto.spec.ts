import { BigIntValue, Int64String, LosslessDto } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe'

test("Let's test worker handler signatures", () => {
	expect(true).toBeTruthy()
	const isImplemented = false
	if (isImplemented) {
		const zbc = new ZeebeGrpcClient()

		class InputVariables extends LosslessDto {
			name!: string
			@Int64String
			key!: string
			age!: number
			@BigIntValue
			bigInt!: bigint
		}

		zbc.createWorker({
			taskType: 'test',
			taskHandler: (job) => {
				job.variables.age
				job.variables.bigInt
				return job.complete()
			},
			inputVariableDto: InputVariables,
		})
	}
})
