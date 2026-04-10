import { ProcessInstanceDetails } from 'c8/lib/C8Dto'
import Debug from 'debug'
import { expect, test, vi } from 'vitest'

import { CamundaRestClient, QuerySubscription } from '../../'
import { matrix } from '../../test-support/testTags'

const debug = Debug('camunda:querySubscriptionTest')
vi.setConfig({ testTimeout: 30_000 })

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'QuerySubscription retrieves results and emits exactly once for new items in the query result',
	async () => {
		const queryTag = `query-subscription-test-${Date.now()}`
		let queryResultCount = 0
		const c8 = new CamundaRestClient()

		const res = await c8.deployResourcesFromFiles([
			'./src/__tests__/testdata/query-subscription-test-1.bpmn',
		])
		const key = res.processes[0].processDefinitionKey

		const query = () =>
			c8.searchProcessInstances({
				filter: {
					processDefinitionKey: key,
					state: 'ACTIVE',
				},
				sort: [{ field: 'startDate', order: 'ASC' }],
			})
		const subscription = QuerySubscription({
			query,
			interval: 500,
		})

		let correlations: ProcessInstanceDetails[] = []

		subscription.on('update', (data) => {
			queryResultCount += data.items.length
			correlations = [...correlations, ...data.items]
		})

		const processInstance = await c8.createProcessInstance({
			processDefinitionKey: key,
			variables: {
				queryTag,
			},
		})
		const processInstance2 = await c8.createProcessInstance({
			processDefinitionKey: key,
			variables: {
				queryTag,
			},
		})
		const processInstance3 = await c8.createProcessInstance({
			processDefinitionKey: key,
			variables: {
				queryTag,
			},
		})

		await new Promise((resolve) => setTimeout(resolve, 7000)) // Wait for the subscription to pick up the new process instances
		// tslint:disable-next-line: no-console
		// debug('Correlations:', JSON.stringify(correlations, null, 2)) // @DEBUG
		expect(queryResultCount).toBe(3)

		// Check if process instances are found in the correlations array by their keys
		expect(
			correlations.some(
				(item) => item.processInstanceKey === processInstance.processInstanceKey
			)
		).toBe(true)
		expect(
			correlations.some(
				(item) =>
					item.processInstanceKey === processInstance2.processInstanceKey
			)
		).toBe(true)
		expect(
			correlations.some(
				(item) =>
					item.processInstanceKey === processInstance3.processInstanceKey
			)
		).toBe(true)
		expect(correlations.length).toBe(3)
		await c8.cancelProcessInstance({
			processInstanceKey: processInstance.processInstanceKey,
		})
		await c8.cancelProcessInstance({
			processInstanceKey: processInstance2.processInstanceKey,
		})
		await c8.cancelProcessInstance({
			processInstanceKey: processInstance3.processInstanceKey,
		})

		subscription.cancel()
	}
)

test.runIf(
	matrix({
		include: {
			versions: ['8.8'],
			deployments: ['self-managed', 'saas'],
			tenancy: ['single-tenant', 'multi-tenant'],
			security: ['secured', 'unsecured'],
		},
	})
)(
	'QuerySubscription correctly tracks and emits all processes started at regular intervals',
	async () => {
		const queryTag = `query-subscription-sequential-${Date.now()}`
		const c8 = new CamundaRestClient()

		const res = await c8.deployResourcesFromFiles([
			'./src/__tests__/testdata/query-subscription-test.bpmn',
		])
		const key = res.processes[0].processDefinitionKey

		const query = () =>
			c8.searchProcessInstances({
				filter: {
					processDefinitionKey: key,
					state: 'ACTIVE',
				},
				sort: [{ field: 'startDate', order: 'ASC' }],
			})

		const subscription = QuerySubscription({
			query,
			interval: 500, // Poll every 500ms
		})

		let receivedInstances: ProcessInstanceDetails[] = []
		const createdProcessInstances: { processInstanceKey: string }[] = []

		// Listen for updates
		subscription.on('update', (data) => {
			debug(`Received update with ${data.items.length} item(s)`)
			receivedInstances = [...receivedInstances, ...data.items]
		})

		// Create one process instance every second for seven seconds
		debug(`Starting to create 7 process instances...`)
		for (let i = 0; i < 7; i++) {
			debug(`Creating process instance ${i + 1}/7`)
			const instance = await c8.createProcessInstance({
				processDefinitionKey: key,
				variables: {
					queryTag,
					sequence: i, // Add a sequence number to help with debugging if needed
				},
			})
			debug(`Created instance with key ${instance.processInstanceKey}`)
			createdProcessInstances.push(instance)

			if (i < 6) {
				// Don't wait after the last instance
				debug('Waiting 1 second before creating next instance...')
				await new Promise((resolve) => setTimeout(resolve, 1000))
			}
		}
		debug(`Created all 7 process instances, waiting for final updates...`)

		// Wait for a total of 10 seconds to ensure all process instances are captured
		debug(
			`Waiting 7 more seconds to ensure all process instances are captured...`
		)
		await new Promise((resolve) => setTimeout(resolve, 7000))

		// Cancel the subscription
		debug(`Cancelling subscription...`)
		subscription.cancel()

		// Verify we have exactly 7 process instances
		debug(`Received ${receivedInstances.length} instances, expecting 7`)
		expect(receivedInstances.length).toBe(7)

		// Verify each created instance is in our received list
		debug(`Verifying all created instances were received...`)
		for (const instance of createdProcessInstances) {
			const found = receivedInstances.some(
				(item) => item.processInstanceKey === instance.processInstanceKey
			)
			debug(
				`Instance ${instance.processInstanceKey}: ${
					found ? 'FOUND' : 'NOT FOUND'
				}`
			)
			expect(found).toBe(true)
		}

		// Cancel all the process instances
		debug(`Cleaning up: cancelling all created process instances...`)
		for (const instance of createdProcessInstances) {
			debug(`Cancelling process instance ${instance.processInstanceKey}`)
			await c8.cancelProcessInstance({
				processInstanceKey: instance.processInstanceKey,
			})
		}
		debug(`Test completed successfully!`)
	}
)
