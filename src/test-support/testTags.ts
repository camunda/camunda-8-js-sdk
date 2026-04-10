/**
 * Test environment selection utilities (Matrix + Exclude model)
 *
 * BREAKING CHANGE: Previous TagFilter / matrix(filterObjectReturningBoolean) semantics removed.
 * New primary APIs:
 *   - matrix({ include: { versions: ['8.8','8.7'], deployments: ['saas','self-managed'] }, exclude: [{ version: '8.8', deployment: 'self-managed' }] })
 *   - allowAny([{ version: '8.7' }, { version: '8.8', deployment: 'saas' }])
 *   - matrix(predicate) -> returns boolean for use with Vitest test.if(matrix(...))
 *
 * Semantics:
 *   matrix(): Produces the cartesian product of provided include dimension arrays. Any dimensions omitted are treated as wildcards (not expanded).
 *             Exclusion patterns (partial matches) remove matching tuples.
 *   allowAny(): Returns true if the current environment matches ANY provided partial pattern.
 *   matrix(): Just invokes the predicate with the current environment and returns a boolean (thin wrapper for clarity / future debug hooks).
 *
 * Example (run on 8.7 all deployments + 8.8 saas only):
 *   const pred = matrix({
 *     include: { versions: ['8.7','8.8'], deployments: ['saas','self-managed'] },
 *     exclude: [{ version: '8.8', deployment: 'self-managed' }]
 *   })
 *   // In a test file (Vitest):
 *   // test.if(matrix(pred))('my test', () => { ...test logic })
 *
 * Example using allowAny (same intent):
 *   const pred = allowAny([{ version: '8.7' }, { version: '8.8', deployment: 'saas' }])
 *   test.if(matrix(pred))('my test', () => {})
 *
 * Debugging: set TEST_TAG_DEBUG=1 to log evaluation decisions.
 */

export const VersionTags = {
	['8.8']: '8.8',
	['8.7']: '8.7',
} as const
export type VersionTag = (typeof VersionTags)[keyof typeof VersionTags]

const DeploymentModeTags = {
	saas: 'saas',
	selfManaged: 'self-managed',
	unitTest: 'unit-test',
} as const
export type DeploymentModeTag =
	(typeof DeploymentModeTags)[keyof typeof DeploymentModeTags]

const TenancyTags = {
	multiTenant: 'multi-tenant',
	singleTenant: 'single-tenant',
} as const
export type TenancyTag = (typeof TenancyTags)[keyof typeof TenancyTags]

const SecurityTags = {
	secured: 'secured',
	unsecured: 'unsecured',
} as const
export type SecurityTag = (typeof SecurityTags)[keyof typeof SecurityTags]

export const TestTags = {
	...VersionTags,
	...DeploymentModeTags,
	...TenancyTags,
	...SecurityTags,
}

// Filter object interface
export interface TestEnvironment {
	version: VersionTag
	deployment: DeploymentModeTag
	tenancy: TenancyTag
	security: SecurityTag
}

export type EnvPattern = Partial<TestEnvironment>

export interface MatrixInclude {
	versions?: VersionTag[]
	deployments?: DeploymentModeTag[]
	tenancy?: TenancyTag[]
	security?: SecurityTag[]
}

export interface MatrixRules {
	include: MatrixInclude
	exclude?: EnvPattern[]
}

export const currentEnv = (): TestEnvironment => ({
	version: (process.env.TEST_VERSION as VersionTag) || '8.8',
	deployment:
		(process.env.TEST_DEPLOYMENT as DeploymentModeTag) || 'self-managed',
	tenancy: (process.env.TEST_TENANCY as TenancyTag) || 'single-tenant',
	security: (process.env.TEST_SECURITY as SecurityTag) || 'unsecured',
})

function matchesPattern(pattern: EnvPattern, env: TestEnvironment): boolean {
	return Object.entries(pattern).every(([k, v]) => (env as never)[k] === v)
}

// Generate predicate from matrix rules
export function matrix(rules: MatrixRules): boolean {
	const includeKeys = Object.entries(rules.include) as [
		keyof MatrixInclude,
		string[],
	][]
	const expanded: EnvPattern[] = []

	if (includeKeys.length === 0) {
		// No explicit include lists given -> everything allowed unless excluded
		expanded.push({})
	} else {
		// Map plural include keys to exact environment property names
		const includeKeyToEnvKey: Record<
			keyof MatrixInclude,
			keyof TestEnvironment
		> = {
			versions: 'version',
			deployments: 'deployment',
			tenancy: 'tenancy',
			security: 'security',
		}
		const recur = (i: number, acc: EnvPattern) => {
			if (i === includeKeys.length) {
				expanded.push(acc)
				return
			}
			const [includeKey, values] = includeKeys[i]
			const envKey = includeKeyToEnvKey[includeKey]
			for (const val of values) {
				recur(i + 1, { ...acc, [envKey]: val } as EnvPattern)
			}
		}
		recur(0, {})
	}

	const env = currentEnv()

	const debug = process.env.TEST_TAG_DEBUG === '1'
	const allowed = expanded.some((p) => matchesPattern(p, env))
	if (!allowed) {
		if (debug)
			console.log('[tagged][matrix] not in include set', { env, expanded })
		return false
	}
	if (rules.exclude?.some((ex) => matchesPattern(ex, env))) {
		if (debug) console.log('[tagged][matrix] excluded', { env })
		return false
	}
	if (debug) console.log('[tagged][matrix] allowed', { env })
	return true
}

// Whitelist of partial environment tuples (OR logic)
export function allowAny(patterns: EnvPattern[]): boolean {
	const env = currentEnv()
	const debug = process.env.TEST_TAG_DEBUG === '1'
	const hit = patterns.some((p) => matchesPattern(p, env))
	if (debug) console.log('[tagged][allowAny]', { env, hit, patterns })
	return hit
}

// Thin wrapper for clarity / future enhancement
export function tagged(predicate: (env: TestEnvironment) => boolean): boolean {
	return predicate(currentEnv())
}

// Export dimension tag objects for caller convenience
export { DeploymentModeTags as DeploymentTags, SecurityTags, TenancyTags }
