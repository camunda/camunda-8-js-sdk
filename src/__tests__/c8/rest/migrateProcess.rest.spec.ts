import path from 'path'

import { CamundaJobWorker } from '../../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import { LosslessDto } from '../../../lib'

const c8 = new CamundaRestClient()

jest.setTimeout(20000)

class CustomHeaders extends LosslessDto {
	ProcessVersion!: number
}

test('RestClient can migrate a process instance', async () => {
	// Deploy a process model
	await c8.deployResourcesFromFiles([
		path.join(
			'.',
			'src',
			'__tests__',
			'testdata',
			'MigrateProcess-Rest-Version-1.bpmn'
		),
	])

	// Create an instance of the process model
	const processInstance = await c8.createProcessInstance({
		processDefinitionId: 'migrant-work-rest',
		variables: {},
	})

	let instanceKey = ''
	let processVersion = 0

	await new Promise<CamundaJobWorker<LosslessDto, CustomHeaders>>((res) => {
		const w = c8.createJobWorker({
			type: 'migrant-rest-worker-task-1',
			maxJobsToActivate: 10,
			timeout: 30000,
			pollIntervalMs: 1000,
			worker: 'Migrant Worker 1',
			customHeadersDto: CustomHeaders,
			jobHandler: async (job) => {
				instanceKey = job.processInstanceKey
				processVersion = job.customHeaders.ProcessVersion as number
				return job.complete().then(async (outcome) => {
					res(w)
					return outcome
				})
			},
		})
	}).then((w) => w.stop())

	expect(instanceKey).toBe(processInstance.processInstanceKey)
	expect(processVersion).toBe('1')

	// Deploy the updated process model
	const res1 = await c8.deployResourcesFromFiles([
		'./src/__tests__/testdata/MigrateProcess-Rest-Version-2.bpmn',
	])

	// Migrate the process instance to the updated process model
	const migrationResponse = await c8.migrateProcessInstance({
		processInstanceKey: processInstance.processInstanceKey,
		mappingInstructions: [
			{
				sourceElementId: 'Activity_050vmrm',
				targetElementId: 'Activity_050vmrm',
			},
		],
		targetProcessDefinitionKey: res1.processes[0].processDefinitionKey,
	})

	// Validate the migration response - it's an empty string for success
	expect(migrationResponse).toBeDefined()
	// The migration response should be a string
	expect(typeof migrationResponse).toBe('string')
	// Verify the response is an empty string (successful operation)
	expect(migrationResponse).toBe('')

	// Complete the job in the process instance
	await new Promise<CamundaJobWorker<LosslessDto, LosslessDto>>((res) => {
		const w = c8.createJobWorker({
			type: 'migration-rest-checkpoint',
			worker: 'Migrant Checkpoint worker',
			maxJobsToActivate: 10,
			timeout: 10000,
			pollIntervalMs: 1000,
			jobHandler: async (job) => {
				return job.complete().then(async (outcome) => {
					res(w)
					return outcome
				})
			},
		})
	}).then((w) => w.stop())

	await new Promise<CamundaJobWorker<LosslessDto, CustomHeaders>>((res) => {
		const w = c8.createJobWorker({
			type: 'migrant-rest-worker-task-2',
			worker: 'Migrant Worker 2',
			maxJobsToActivate: 10,
			timeout: 30000,
			pollIntervalMs: 1000,
			customHeadersDto: CustomHeaders,
			jobHandler: async (job) => {
				instanceKey = job.processInstanceKey
				processVersion = job.customHeaders.ProcessVersion as number
				return job.complete().then(async (outcome) => {
					res(w)
					return outcome
				})
			},
		})
	}).then((w) => w.stop())

	expect(instanceKey).toBe(processInstance.processInstanceKey)
	expect(processVersion).toBe('2')
})
