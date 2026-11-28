import path from 'node:path'

import { ESLint } from 'eslint'
import { describe, expect, it } from 'vitest'

const root = path.resolve(__dirname, '../../..')
const sourceFile = path.join(root, 'src/lib/LoggingTarget.ts')
const zeebeFile = path.join(root, 'src/zeebe/lib/LoggingTarget.ts')

const eslint = new ESLint({ cwd: root })

const lint = async (code: string, filePath: string): Promise<string[]> => {
	const [result] = await eslint.lintText(code, { filePath })
	const fatal = result.messages.filter((message) => message.fatal)
	expect(fatal, JSON.stringify(fatal)).toEqual([])
	return result.messages
		.map((message) => message.ruleId ?? 'parse-error')
		.filter((ruleId) => ruleId !== 'prettier/prettier')
}

describe('whole-error logging lint rule', () => {
	const rawErrorObject = `
const logger = { logError: (...args: unknown[]) => args }
declare const debug: (...args: unknown[]) => void
declare const error: Error
const id = 'worker'

logger.logError({ id, error })
debug({ error })
`

	it('rejects raw error values in structured log payloads', async () => {
		expect(await lint(rawErrorObject, sourceFile)).toContain(
			'no-restricted-syntax'
		)
		expect(await lint(rawErrorObject, zeebeFile)).toContain(
			'no-restricted-syntax'
		)
	})

	it('allows structured log payloads after errorForLogging', async () => {
		const safeErrorObject = `
const logger = { logError: (...args: unknown[]) => args }
declare const debug: (...args: unknown[]) => void
declare const error: Error
declare const errorForLogging: (error: unknown) => string
const id = 'worker'

logger.logError({ id, error: errorForLogging(error) })
debug({ error: errorForLogging(error) })
`

		expect(await lint(safeErrorObject, sourceFile)).not.toContain(
			'no-restricted-syntax'
		)
		expect(await lint(safeErrorObject, zeebeFile)).not.toContain(
			'no-restricted-syntax'
		)
	})
})
