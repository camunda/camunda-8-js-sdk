exports = {
	moduleNameMapper: {
		'^@camunda8/oauth(.*)$': '<rootDir>/packages/oauth/src$1',
	},
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
}
