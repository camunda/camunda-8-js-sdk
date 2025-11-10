import { describe, expect, it } from 'vitest'

import { Camunda8 } from '../c8'

/**
 * Unit test for the orchestration client factory wiring.
 * Ensures we no longer mutate process.env and that config overrides are passed directly.
 */
describe('Camunda8.getOrchestrationClusterApiClient', () => {
	it('creates client with translated overrides without mutating process.env', () => {
		// Guard: ensure env baseline (remove keys that translator would set)
		const baselineKeys = [
			'CAMUNDA_REST_ADDRESS',
			'CAMUNDA_AUTH_STRATEGY',
			'CAMUNDA_CLIENT_ID',
			'CAMUNDA_CLIENT_SECRET',
		]
		const original: Record<string, string | undefined> = {}
		for (const k of baselineKeys) {
			original[k] = process.env[k]
			delete process.env[k]
		}

		const c8 = new Camunda8({
			ZEEBE_REST_ADDRESS: 'http://example:1234',
			CAMUNDA_AUTH_STRATEGY: 'NONE',
		})
		const client = c8.getOrchestrationClusterApiClient()
		// Verify client exposes hydrated config restAddress ending with /v2
		const restAddress = client.config.restAddress
		expect(restAddress).toBe('http://example:1234/v2')
		// Auth strategy mapped correctly
		expect(client.config.auth.strategy).toBe('NONE')
		// Environment not polluted
		for (const k of baselineKeys) {
			expect(process.env[k]).toBeUndefined()
		}

		// Restore environment
		for (const k of baselineKeys) {
			if (original[k] !== undefined) process.env[k] = original[k]!
		}
	})
})
