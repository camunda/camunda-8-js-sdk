import path from 'node:path'
import test from 'ava'
import {LosslessDto} from '@camunda8/lossless-json'
import {type CamundaJobWorker, CamundaRestClient} from '../../c8-rest/index.js'

const c8 = new CamundaRestClient()

class CustomHeaders extends LosslessDto {
	ProcessVersion!: number // eslint-disable-line @typescript-eslint/naming-convention
}

test('RestClient can migrate a process instance', async t => {
	// Deploy a process model
	await c8.deployResourcesFromFiles({
		files: [
			path.join(
				'distribution',
				'test',
				'resources',
				'MigrateProcess-Rest-Version-1.bpmn',
			),
		],
	})

	// Create an instance of the process model
	const processInstance = await c8.createProcessInstance({
		processDefinitionId: 'migrant-work-rest',
		variables: {},
	})

	let instanceKey = ''
	let processVersion = 0

	await new Promise<CamundaJobWorker<LosslessDto, CustomHeaders>>(resolve => {
		const w = c8.createJobWorker({
			type: 'migrant-rest-worker-task-1',
			maxJobsToActivate: 10,
			timeout: 30_000,
			pollIntervalMs: 1000,
			worker: 'Migrant Worker 1',
			customHeadersDto: CustomHeaders,
			async jobHandler(job) {
				instanceKey = job.processInstanceKey
				processVersion = job.customHeaders.ProcessVersion

				const response = await job.complete()
				resolve(w)
				return response
			},
		})
	}).then(async w => w.stop())

	t.is(instanceKey, processInstance.processInstanceKey)
	t.is(processVersion, 1)

	// Deploy the updated process model
	const response = await c8.deployResourcesFromFiles({
		files: ['./distribution/test/resources/MigrateProcess-Rest-Version-2.bpmn'],
	})

	// Migrate the process instance to the updated process model

	await c8.migrateProcessInstance({
		processInstanceKey: processInstance.processInstanceKey,
		mappingInstructions: [
			{
				sourceElementId: 'Activity_050vmrm',
				targetElementId: 'Activity_050vmrm',
			},
		],
		targetProcessDefinitionKey: response.processDefinitions[0].processDefinitionKey,
	})

	// Complete the job in the process instance

	await new Promise<CamundaJobWorker<LosslessDto, LosslessDto>>(resolve => {
		const w = c8.createJobWorker({
			type: 'migration-rest-checkpoint',
			worker: 'Migrant Checkpoint worker',
			maxJobsToActivate: 10,
			timeout: 10_000,
			pollIntervalMs: 1000,
			async jobHandler(job) {
				const outcome = await job.complete()
				resolve(w)
				return outcome
			},
		})
	}).then(async w => w.stop())

	await new Promise<CamundaJobWorker<LosslessDto, CustomHeaders>>(resolve => {
		const w = c8.createJobWorker({
			type: 'migrant-rest-worker-task-2',
			worker: 'Migrant Worker 2',
			maxJobsToActivate: 10,
			timeout: 30_000,
			pollIntervalMs: 1000,
			customHeadersDto: CustomHeaders,
			async jobHandler(job) {
				instanceKey = job.processInstanceKey
				processVersion = job.customHeaders.ProcessVersion
				const outcome = await job.complete()
				resolve(w)
				return outcome
			},
		})
	}).then(async w => w.stop())

	t.is(instanceKey, processInstance.processInstanceKey)
	t.is(processVersion, 2)
})
