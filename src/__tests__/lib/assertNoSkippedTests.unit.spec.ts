import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { checkReport } from '../../../scripts/assert-no-skipped-tests'
import { allowAny } from '../../test-support/testTags'

const SPEC = 'src/__tests__/zeebe/integration/StreamJobs.spec.ts'

const file = (
	spec: string,
	statuses: string[],
	root = '/home/runner/work/camunda-8-js-sdk/camunda-8-js-sdk'
) => ({
	name: `${root}/${spec}`,
	assertionResults: statuses.map((status, i) => ({
		status,
		title: `test ${i}`,
		fullName: `suite test ${i}`,
	})),
})

describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'assert-no-skipped-tests',
	() => {
		test('accepts a report in which every required test passed', () => {
			const report = { testResults: [file(SPEC, ['passed', 'passed'])] }
			expect(checkReport(report, [SPEC])).toEqual([])
		})

		test('ignores skipped tests in files that are not required', () => {
			const report = {
				testResults: [
					file(SPEC, ['passed']),
					file('src/__tests__/oauth/Other.spec.ts', ['skipped', 'skipped']),
				],
			}
			expect(checkReport(report, [SPEC])).toEqual([])
		})

		test.each(['skipped', 'pending', 'todo', 'failed'])(
			'rejects a required test that is %s',
			(status) => {
				const report = { testResults: [file(SPEC, ['passed', status])] }
				const problems = checkReport(report, [SPEC])
				expect(problems).toHaveLength(1)
				expect(problems[0]).toContain(`was ${status}`)
			}
		)

		test('rejects a required file that is not in the report', () => {
			const report = {
				testResults: [file('src/__tests__/Other.spec.ts', ['passed'])],
			}
			expect(checkReport(report, [SPEC])).toEqual([
				`${SPEC}: not in the report, so it did not run.`,
			])
		})

		test('rejects a required file with no tests', () => {
			const report = { testResults: [file(SPEC, [])] }
			expect(checkReport(report, [SPEC])).toEqual([
				`${SPEC}: contains no tests.`,
			])
		})

		test('does not match a file whose path merely ends with the same name', () => {
			const report = {
				testResults: [
					file(`other/${SPEC}`.replace('src/', 'xsrc/'), ['passed']),
				],
			}
			expect(checkReport(report, [SPEC])).toHaveLength(1)
		})

		test('matches Windows-style paths', () => {
			const report = {
				testResults: [
					{
						name: `C:\\work\\repo\\${SPEC.replace(/\//g, '\\')}`,
						assertionResults: [{ status: 'passed' }],
					},
				],
			}
			expect(checkReport(report, [SPEC])).toEqual([])
		})

		test('rejects an empty required list and a malformed report', () => {
			expect(checkReport({ testResults: [] }, [])).toHaveLength(1)
			expect(checkReport({} as never, [SPEC])).toHaveLength(1)
		})

		test('rejects a required spec that does not exist on disk', () => {
			const report = { testResults: [file(SPEC, ['passed'])] }
			expect(checkReport(report, [SPEC], { fileExists: () => false })).toEqual([
				`${SPEC}: listed as required but the file does not exist.`,
			])
		})

		describe('command line', () => {
			const script = path.resolve(
				__dirname,
				'../../../scripts/assert-no-skipped-tests.js'
			)
			const run = (report: unknown) => {
				const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'no-skips-'))
				try {
					const reportPath = path.join(dir, 'report.json')
					fs.writeFileSync(reportPath, JSON.stringify(report))
					return spawnSync(process.execPath, [script, reportPath], {
						encoding: 'utf8',
					})
				} finally {
					fs.rmSync(dir, { recursive: true, force: true })
				}
			}
			const listed = JSON.parse(
				fs.readFileSync(
					path.resolve(
						__dirname,
						'../../../scripts/required-integration-specs.json'
					),
					'utf8'
				)
			) as string[]

			test('the required list only names files that exist, and includes the streamJobs specs', () => {
				const root = path.resolve(__dirname, '../../..')
				listed.forEach((spec) =>
					expect(fs.existsSync(path.join(root, spec)), spec).toBe(true)
				)
				expect(listed).toContain(SPEC)
			})

			test('exits 0 when every required test passed', () => {
				const result = run({
					testResults: listed.map((spec) => file(spec, ['passed'])),
				})
				expect(result.status).toBe(0)
			})

			test('exits 1 and names the skipped test when one was skipped', () => {
				const result = run({
					testResults: listed.map((spec, i) =>
						file(spec, i === 0 ? ['passed', 'skipped'] : ['passed'])
					),
				})
				expect(result.status).toBe(1)
				expect(result.stderr).toContain('was skipped')
			})
		})
	}
)
