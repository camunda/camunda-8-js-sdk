import { defineConfig } from 'vitest/config'

// Used by Stryker (`npm run test:mutation`): only the unit tests that exercise
// the stream lifecycle modules, so each mutant is checked against a fast, focused
// suite. The lint test (slow, and it cannot kill a mutant) and the fault-injection
// test (real sockets and timing) are left out.
export default defineConfig({
	test: {
		globalSetup: './src/__tests__/config/globalSetup.ts',
		globals: true,
		include: [
			'src/__tests__/zeebe/ZBStreamWorker.unit.spec.ts',
			'src/__tests__/zeebe/ZBStreamWorker.lifecycle.unit.spec.ts',
			'src/__tests__/zeebe/StreamLifecycle.unit.spec.ts',
			'src/__tests__/zeebe/conformance/*.unit.spec.ts',
		],
	},
})
