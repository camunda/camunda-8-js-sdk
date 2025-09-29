import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe/index'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

const zbc = new ZeebeGrpcClient()
let pid: string
let processDefinitionKey: string

beforeAll(async () => {
	const res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/Client-SkipFirstTask.bpmn',
	})
	processDefinitionKey = res.deployments[0].process.processDefinitionKey
})
afterAll(async () => {
	zbc.cancelProcessInstance(pid).catch((_) => _)
	await zbc.close()

	await cancelProcesses(processDefinitionKey)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Modify Process Instance',
	() =>
		new Promise<void>((done) => {
			zbc.deployResource({
				processFilename: './src/__tests__/testdata/Client-SkipFirstTask.bpmn',
			})
			zbc.createWorker({
				taskType: 'second_service_task',
				taskHandler: (job) => {
					expect(job.variables.second).toBe(1)
					return job.complete().then((ack) => {
						done()
						return ack
					})
				},
			})
			zbc
				.createProcessInstance({
					bpmnProcessId: 'SkipFirstTask',
					variables: {},
				})
				.then((res) => {
					pid = res.processInstanceKey
					zbc.modifyProcessInstance({
						processInstanceKey: res.processInstanceKey,
						activateInstructions: [
							{
								elementId: 'second_service_task',
								ancestorElementInstanceKey: '-1',
								variableInstructions: [
									{
										scopeId: '',
										variables: { second: 1 },
									},
								],
							},
						],
					})
				})
		})
)
