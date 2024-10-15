import test from 'ava'
import {
	Int64String,
	LosslessDto,
	losslessParse,
} from '@camunda8/lossless-json'
import {createSpecializedRestApiJobClass} from '../../c8-rest/lib/rest-api-job-class-factory.js'

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

test('It correctly parses variables and custom headers', t => {
	const jsonString = '{"jobs":[{"key":2251799813737371,"type":"console-log-complete","processInstanceKey":2251799813737366,"bpmnProcessId":"hello-world-complete","processDefinitionVersion":1,"processDefinitionKey":2251799813736299,"elementId":"ServiceTask_0g6tf5f","elementInstanceKey":2251799813737370,"customHeaders":{"message":"Hello World","bigHeader":1,"smallHeader":2},"worker":"test","retries":100,"deadline":1725501895792,"variables":{"bigValue":3},"tenantId":"<default>"}]}'
	const response = losslessParse(jsonString, myJob, 'jobs')
	t.is(response[0].variables.bigValue, '3')
	t.is(response[0].customHeaders.smallHeader, 2)
	t.is(response[0].customHeaders.bigHeader, '1')
})
