import { restoreZeebeLogging, suppressZeebeLogging } from '../../../lib'
import { ZeebeGrpcClient } from '../../../zeebe/index'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'
import { DeployResourceResponse, ProcessDeployment } from '../../../zeebe/types'

jest.setTimeout(15000)

suppressZeebeLogging()

let res: DeployResourceResponse<ProcessDeployment> | undefined
let res1: DeployResourceResponse<ProcessDeployment> | undefined

afterAll(async () => {
	restoreZeebeLogging()
	await cancelProcesses(
		res?.deployments[0].process.processDefinitionKey as string
	)
	await cancelProcesses(
		res1?.deployments[0].process.processDefinitionKey as string
	)
})

const zbc = new ZeebeGrpcClient()

test('ZeebeGrpcClient can migrate a process instance', async () => {
	// Deploy a process model
	res = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/MigrateProcess-Version-1.bpmn',
	})

	// Create an instance of the process model
	const processInstance = await zbc.createProcessInstance({
		bpmnProcessId: 'migrant-work',
		variables: {},
	})

	let instanceKey = ''
	let processVersion = 0

	await new Promise((res) => {
		const w = zbc.createWorker({
			taskType: 'migrant-worker-task-1',
			taskHandler: async (job) => {
				instanceKey = job.processInstanceKey
				processVersion = job.customHeaders.ProcessVersion as number
				return job.complete().then((outcome) => {
					w.close()
					res(null)
					return outcome
				})
			},
		})
	})

	expect(instanceKey).toBe(processInstance.processInstanceKey)
	expect(processVersion).toBe('1')

	// Deploy the updated process model
	res1 = await zbc.deployResource({
		processFilename: './src/__tests__/testdata/MigrateProcess-Version-2.bpmn',
	})

	// Migrate the process instance to the updated process model

	await zbc.migrateProcessInstance({
		processInstanceKey: processInstance.processInstanceKey,
		migrationPlan: {
			mappingInstructions: [
				{
					sourceElementId: 'Activity_050vmrm',
					targetElementId: 'Activity_050vmrm',
				},
			],
			targetProcessDefinitionKey:
				res1?.deployments[0].process.processDefinitionKey,
		},
	})

	// Complete the job in the process instance

	await new Promise((res) => {
		const w = zbc.createWorker({
			taskType: 'migration-checkpoint',
			taskHandler: async (job) => {
				return job.complete().then((outcome) => {
					w.close()
					res(null)
					return outcome
				})
			},
		})
	})

	await new Promise((res) => {
		const w = zbc.createWorker({
			taskType: 'migrant-worker-task-2',
			taskHandler: async (job) => {
				instanceKey = job.processInstanceKey
				processVersion = job.customHeaders.ProcessVersion as number
				return job.complete().then((outcome) => {
					w.close()
					res(null)
					return outcome
				})
			},
		})
	})
	await zbc.close()
	expect(instanceKey).toBe(processInstance.processInstanceKey)
	expect(processVersion).toBe('2')
})
