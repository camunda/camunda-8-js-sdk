import { OrchestrationLifters } from '../../index'

/**
 * Unit test validating that a representative lifter namespace is available and
 * returns the underlying string value at runtime while applying the branded type at compile time.
 */

describe('OrchestrationLifters', () => {
	it('lifts a raw process instance key string to a branded type', () => {
		const raw = '2251799813685249'
		const lifted = OrchestrationLifters.ProcessInstanceKey.assumeExists(raw)
		// Type-level check: assignment should compile (ProcessInstanceKey brand)
		const branded: OrchestrationLifters.ProcessInstanceKey = lifted
		// Runtime value should be identical to the original string
		expect(lifted).toBe(raw)
		expect(branded).toBe(lifted)
	})

	it('exposes multiple lifter namespaces (spot check)', () => {
		// Spot check a couple of representative lifters exist
		expect(typeof OrchestrationLifters.JobKey.assumeExists).toBe('function')
		expect(typeof OrchestrationLifters.ProcessDefinitionId.assumeExists).toBe(
			'function'
		)
	})
})
