import { describe, expect, it } from 'vitest'

import { Camunda8 } from '../c8'

/**
 * Validates loose orchestration client factory wiring.
 * Ensures no environment mutation and that returned client widens branded keys (runtime smoke only).
 */
describe('Camunda8.getOrchestrationClusterApiClientLoose', () => {
	it('creates loose client with /v2 rest address and leaves env untouched', () => {
		const baseline = { ...process.env }
		const c8 = new Camunda8({ ZEEBE_REST_ADDRESS: 'http://loose-host:8081' })
		const client = c8.getOrchestrationClusterApiClientLoose()
		expect(client.config.restAddress).toBe('http://loose-host:8081/v2')
		// Spot check that env was not polluted with a key the translator would set
		expect(process.env.CAMUNDA_REST_ADDRESS).toBeUndefined()
		// Basic method existence sanity: deployResourcesFromFiles exists on loose client
		// Cast to unknown then to a structural type to avoid explicit any while probing method existence
		type HasDeployResources = { deployResourcesFromFiles?: unknown }
		const maybeDeploy = client as unknown as HasDeployResources
		expect(typeof maybeDeploy.deployResourcesFromFiles).toBe('function')
		// Restore env snapshot (should already match)
		for (const k of Object.keys(process.env)) {
			if (baseline[k] === undefined) delete process.env[k]
		}
		for (const [k, v] of Object.entries(baseline)) {
			if (v !== undefined) process.env[k] = v
		}
	})
})
