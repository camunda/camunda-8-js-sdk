import { expect, test } from 'vitest'

import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'

// This unit test validates that origin stack capture instrumentation
// attaches the apiMethod and original method frame to the got request context
// when calling activateJobs.

test('activateJobs origin stack capture includes apiMethod and method frame', async () => {
	// Use a deliberately unreachable address so the request fails fast (ECONNREFUSED)
	// allowing us to inspect the enriched error context.
	const restClient = new CamundaRestClient({
		config: {
			ZEEBE_REST_ADDRESS: 'http://127.0.0.1:9', // reserved, should refuse connection
		},
	})

	// Trigger the activation (will reject). The request body only needs required fields.
	try {
		await restClient.activateJobs({
			maxJobsToActivate: 1,
			requestTimeout: 1000,
			timeout: 1000,
			type: 'non-existent-type',
			worker: 'unit-test',
		})
		throw new Error('Expected activateJobs to fail for unreachable endpoint')
	} catch (error) {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const e = error as any
		// Ensure we have got error options/context populated
		expect(e).toBeDefined()
		// Some errors wrap inside .cause; unwrap if needed
		const ctx = e.options?.context || e.cause?.options?.context
		expect(ctx).toBeDefined()
		const trace = ctx.__stackTrace
		expect(trace).toBeDefined()
		// apiMethod should be set to 'activateJobs'
		expect(trace.apiMethod).toBe('activateJobs')
		// requestId should be a uuid-like string
		expect(typeof trace.requestId).toBe('string')
		// capturedAt should be a number timestamp
		expect(typeof trace.capturedAt).toBe('number')
		// Stacks should include frame with CamundaRestClient.activateJobs
		const hasMethodFrame = trace.stacks.some((s: { location: string }) =>
			s.location.includes('CamundaRestClient.activateJobs')
		)
		expect(hasMethodFrame).toBe(true)
		// Confirm stack replacement occurred
		expect(e.originalStack).toBeDefined()
		expect(typeof e.stack).toBe('string')
		expect(e.stack.split('\n')[0]).toMatch(/Error:/)
		expect(e.stack).toContain('CamundaRestClient.activateJobs')
	}
})
