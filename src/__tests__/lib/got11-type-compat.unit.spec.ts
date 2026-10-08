import path from 'node:path'

import ts from 'typescript'
import { describe, expect, test } from 'vitest'

/**
 * Guards the public type surface of the got -> undici migration: code that
 * type-checked against the SDK when it used got 11 (middleware typed as got's
 * BeforeRequestHook, retry typed as got's RequiredRetryOptions, narrowing on
 * the RestError union) must still compile.
 */
describe('got 11 type compatibility', () => {
	test('consumer code written against got 11 types still compiles', () => {
		const root = path.resolve(__dirname, '../../..')
		const configPath = path.join(root, 'tsconfig.json')
		const { config } = ts.readConfigFile(configPath, ts.sys.readFile)
		const parsed = ts.parseJsonConfigFileContent(config, ts.sys, root)
		const fixture = path.join(__dirname, 'fixtures/got11-consumer.fixture.ts')
		const program = ts.createProgram([fixture], {
			...parsed.options,
			noEmit: true,
			composite: false,
			declaration: false,
			incremental: false,
		})
		const diagnostics = ts
			.getPreEmitDiagnostics(program)
			.filter((d) => d.file?.fileName === fixture)
			.map((d) => {
				const { line } = d.file!.getLineAndCharacterOfPosition(d.start ?? 0)
				return `L${line + 1}: ${ts.flattenDiagnosticMessageText(
					d.messageText,
					'\n'
				)}`
			})
		expect(diagnostics).toEqual([])
	}, 120_000)
})
