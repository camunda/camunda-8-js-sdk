import path from 'node:path'

import { ESLint } from 'eslint'

import { allowAny } from '../../test-support/testTags'

/**
 * Negative tests for the ESLint rules that guard the stream modules (see the
 * `overrides` in .eslintrc.json): each fixture is a piece of code that must be
 * rejected, linted with the repository's real configuration as if it were the
 * named file. If someone loosens a rule, these fail.
 */

const root = path.resolve(__dirname, '../../..')
const workerFile = path.join(root, 'src/zeebe/lib/ZBStreamWorker.ts')
const adapterFile = path.join(root, 'src/zeebe/lib/StreamLifecycle.ts')
const otherFile = path.join(root, 'src/zeebe/lib/BpmnParser.ts')

const eslint = new ESLint({ cwd: root })

/** Rule ids reported for `code`, linted as `filePath`. */
const lint = async (code: string, filePath: string): Promise<string[]> => {
	const [result] = await eslint.lintText(code, { filePath })
	const fatal = result.messages.filter((m) => m.fatal)
	expect(fatal, JSON.stringify(fatal)).toEqual([])
	// Formatting of the fixtures is not what is under test.
	return result.messages
		.map((m) => m.ruleId ?? 'parse-error')
		.filter((ruleId) => ruleId !== 'prettier/prettier')
}

describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'stream lifecycle lint rules',
	() => {
		vi.setConfig({ testTimeout: 120_000 })

		const attachListener = `
export const attach = (stream: { on: (e: string, f: () => void) => void }) => {
	stream.on('error', () => undefined)
}
`
		const attachListenerOnProperty = `
export class Worker {
	private currentStream!: { once: (e: string, f: () => void) => void }
	open() {
		this.currentStream.once('end', () => undefined)
	}
}
`

		test('attaching a listener to a stream directly is rejected in a stream module', async () => {
			expect(await lint(attachListener, workerFile)).toContain(
				'no-restricted-syntax'
			)
			expect(await lint(attachListenerOnProperty, workerFile)).toContain(
				'no-restricted-syntax'
			)
		})

		test('the same code is rejected elsewhere under src/zeebe, but allowed in the adapter', async () => {
			expect(await lint(attachListener, otherFile)).toContain(
				'no-restricted-syntax'
			)
			expect(await lint(attachListener, adapterFile)).not.toContain(
				'no-restricted-syntax'
			)
		})

		test('naming the raw gRPC stream types is rejected in a stream module, but allowed in the adapter', async () => {
			const code = `
import type { ClientReadableStream } from '@grpc/grpc-js'

export type S = ClientReadableStream<unknown>
`
			expect(await lint(code, workerFile)).toContain('no-restricted-imports')
			expect(await lint(code, adapterFile)).not.toContain(
				'no-restricted-imports'
			)
		})

		test('console output is rejected in a stream module', async () => {
			const code = `
export const onError = (e: Error) => {
	console.error(e)
}
`
			expect(await lint(code, workerFile)).toContain('no-console')
			expect(await lint(code, adapterFile)).toContain('no-console')
		})

		test('a floating promise is rejected in a stream module', async () => {
			const code = `
const work = async () => undefined

export const run = () => {
	work()
}
`
			expect(await lint(code, workerFile)).toContain(
				'@typescript-eslint/no-floating-promises'
			)
			expect(await lint(code, adapterFile)).toContain(
				'@typescript-eslint/no-floating-promises'
			)
		})

		test('handled code is accepted', async () => {
			const code = `
const work = async () => undefined

export const run = (log: (message: string) => void) => {
	work().catch((e: unknown) => log(String(e)))
}
`
			expect(await lint(code, workerFile)).toEqual([])
		})
	}
)
