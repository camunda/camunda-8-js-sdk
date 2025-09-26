import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globalSetup: './src/__tests__/config/globalSetup.ts',
		globals: true,
	},
})
