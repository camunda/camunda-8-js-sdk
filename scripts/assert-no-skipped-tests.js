#!/usr/bin/env node
/**
 * Fails a CI job if tests that must run against a broker were skipped.
 *
 * Most integration tests are gated with `test.runIf(...)` on the deployment,
 * version, tenancy and security of the environment, and many legitimately skip
 * in any one job. What must never happen silently is that the tests which guard
 * the broker-facing behaviour all skip because the environment is not what the
 * gate expects (a changed env variable, a renamed script): the job is green, and
 * nothing was tested.
 *
 * So the guard is scoped to a list of spec files (scripts/required-integration-specs.json)
 * that every broker job runs. For each of them it requires that the file is in the
 * Vitest JSON report, contains at least one test, and that every test passed:
 * none skipped, pending or todo. Unit-only jobs do not run it.
 *
 * Usage:
 *   vitest run ... --reporter=default --reporter=json --outputFile.json=report.json
 *   node scripts/assert-no-skipped-tests.js report.json [--required <spec-list.json>]
 */
const fs = require('node:fs')
const path = require('node:path')

const DEFAULT_REQUIRED_LIST = path.join(
	__dirname,
	'required-integration-specs.json'
)

const normalise = (p) => p.replace(/\\/g, '/')

/**
 * @typedef {{ status: string, fullName?: string, title?: string }} AssertionResult
 * @typedef {{ name: string, assertionResults?: AssertionResult[] }} FileResult
 * @typedef {{ testResults?: FileResult[] }} VitestJsonReport
 */

/**
 * @param {VitestJsonReport} report The Vitest JSON report.
 * @param {string[]} requiredSpecs Spec paths relative to the repository root.
 * @param {{ fileExists?: (spec: string) => boolean }} [options]
 * @returns {string[]} One message per problem; empty if the report is acceptable.
 */
function checkReport(report, requiredSpecs, options = {}) {
	const problems = []
	if (!report || !Array.isArray(report.testResults)) {
		return ['The report is not a Vitest JSON report (no testResults array).']
	}
	if (requiredSpecs.length === 0) {
		return ['The list of required specs is empty, so nothing is guarded.']
	}
	for (const spec of requiredSpecs) {
		if (options.fileExists && !options.fileExists(spec)) {
			problems.push(`${spec}: listed as required but the file does not exist.`)
			continue
		}
		const file = report.testResults.find((result) =>
			normalise(result.name).endsWith(`/${normalise(spec)}`)
		)
		if (!file) {
			problems.push(`${spec}: not in the report, so it did not run.`)
			continue
		}
		const tests = file.assertionResults ?? []
		if (tests.length === 0) {
			problems.push(`${spec}: contains no tests.`)
			continue
		}
		tests
			.filter((test) => test.status !== 'passed')
			.forEach((test) =>
				problems.push(
					`${spec}: "${test.fullName ?? test.title}" was ${
						test.status
					}, not passed.`
				)
			)
	}
	return problems
}

function main(argv) {
	const args = argv.slice(2)
	const requiredFlag = args.indexOf('--required')
	const requiredList =
		requiredFlag === -1 ? DEFAULT_REQUIRED_LIST : args[requiredFlag + 1]
	const reportPath = args.find(
		(arg, i) => !arg.startsWith('--') && args[i - 1] !== '--required'
	)
	if (!reportPath) {
		console.error(
			'Usage: assert-no-skipped-tests.js <vitest-report.json> [--required <list.json>]'
		)
		return 2
	}
	const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
	const required = JSON.parse(fs.readFileSync(requiredList, 'utf8'))
	const root = path.resolve(__dirname, '..')
	const problems = checkReport(report, required, {
		fileExists: (spec) => fs.existsSync(path.join(root, spec)),
	})
	if (problems.length > 0) {
		console.error(
			`::error::${problems.length} problem(s): required integration tests did not all run and pass:`
		)
		problems.forEach((problem) => console.error(`  - ${problem}`))
		return 1
	}
	console.log(
		`All tests in the ${required.length} required integration spec file(s) ran and passed.`
	)
	return 0
}

module.exports = { checkReport }

if (require.main === module) {
	process.exitCode = main(process.argv)
}
