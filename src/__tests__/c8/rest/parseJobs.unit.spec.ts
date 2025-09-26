import { createSpecializedRestApiJobClass } from '../../../c8/lib/RestApiJobClassFactory'
import { Int64String, LosslessDto, losslessParse } from '../../../lib'
import { matrix } from '../../../test-support/testTags'

class Variables extends LosslessDto {
	@Int64String
	bigValue!: string
}

class CustomHeaders extends LosslessDto {
	@Int64String
	bigHeader!: string
	smallHeader!: number
}

const myJob = createSpecializedRestApiJobClass(Variables, CustomHeaders)

test.runIf(
	matrix({
		include: {
			versions: ['8.8', '8.7'],
			deployments: ['saas', 'self-managed'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)('It correctly parses variables and custom headers', () => {
	const jsonString = `{"jobs":[{"key":2251799813737371,"type":"console-log-complete","processInstanceKey":2251799813737366,"processDefinitionId":"hello-world-complete","processDefinitionVersion":1,"processDefinitionKey":2251799813736299,"elementId":"ServiceTask_0g6tf5f","elementInstanceKey":2251799813737370,"customHeaders":{"message":"Hello World","bigHeader":1,"smallHeader":2},"worker":"test","retries":100,"deadline":1725501895792,"variables":{"bigValue":3},"tenantId":"<default>"}]}`
	const res = losslessParse(jsonString, myJob, 'jobs')
	expect(res[0].variables.bigValue).toBe('3')
	expect(res[0].customHeaders.smallHeader).toBe(2)
	expect(res[0].customHeaders.bigHeader).toBe('1')
})
