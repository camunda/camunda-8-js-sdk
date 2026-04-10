import { Camunda8 } from '../index'
import { allowAny } from '../test-support/testTags'

test.runIf(
	allowAny([
		{ deployment: 'unit-test' },
		{ deployment: 'saas' },
		{ deployment: 'self-managed' },
	])
)('exports as expected', () => {
	expect(Camunda8).toBeDefined()
})
