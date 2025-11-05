import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'

export interface OriginContext {
	requestId: string
	frames: string[]
	capturedAt: number
	apiMethod?: string
}

export const originContextStorage = new AsyncLocalStorage<OriginContext>()

const INTERNAL_PATTERNS = [
	'/TrackedGot.',
	'node:internal/modules',
	'diagnostics_channel',
]

function isInternalFrame(line: string): boolean {
	// Drop the explicit capture helper frame but keep decorated method frames
	if (line.includes('captureOrigin (')) return true
	return INTERNAL_PATTERNS.some((p) => line.includes(p))
}

// Cache for method line lookup
const methodLineCache: Record<string, number> = {}

function findMethodLine(
	classFile: string,
	methodName: string
): number | undefined {
	if (methodLineCache[methodName]) return methodLineCache[methodName]
	try {
		const contents = fs.readFileSync(classFile, 'utf8').split('\n')
		for (let i = 0; i < contents.length; i++) {
			if (contents[i].includes(`${methodName}(`)) {
				methodLineCache[methodName] = i + 1 // 1-based
				return methodLineCache[methodName]
			}
		}
	} catch {
		return undefined
	}
	return undefined
}

function remapDecoratorFrame(line: string): string {
	// Only adjust frames where the method belongs to CamundaRestClient but file is OriginTracing
	if (!/CamundaRestClient\./.test(line) || !/OriginTracing\.\w+/.test(line))
		return line
	// Resolve potential source file paths (dist and src)
	const distPath = path.join(path.dirname(__filename), 'CamundaRestClient.js')
	const srcPath = path.join(
		process.cwd(),
		'src',
		'c8',
		'lib',
		'CamundaRestClient.ts'
	)
	const preferDist = fs.existsSync(distPath)
	const targetFile = preferDist ? distPath : srcPath
	const methodMatch = line.match(/CamundaRestClient\.(\w+)/)
	const methodName = methodMatch?.[1]
	if (!methodName) return line
	const targetLine = findMethodLine(targetFile, methodName)
	if (!targetLine) return line
	// Replace parenthetical file reference
	return line.replace(
		/\(.*OriginTracing.*\)/,
		`(${targetFile}:${targetLine}:1)`
	) // column unknown, set to 1
}

export function captureOrigin(): OriginContext {
	const raw = new Error('capture-origin').stack?.split('\n').slice(1) ?? []
	const cleaned = raw
		.map((l) => l.trim())
		.filter((l) => !isInternalFrame(l))
		.map(remapDecoratorFrame)
	return {
		requestId: randomUUID(),
		frames: cleaned,
		capturedAt: Date.now(),
	}
}

/** Legacy class decorator (single-argument) that wraps instance methods to seed origin context. */
// Legacy decorator: mutate prototype in place, do not return a new constructor.
// eslint-disable-next-line @typescript-eslint/ban-types
export function TraceOrigin(Ctor: Function): void {
	const proto = Ctor.prototype
	for (const key of Object.getOwnPropertyNames(proto)) {
		if (key === 'constructor') continue
		const desc = Object.getOwnPropertyDescriptor(proto, key)
		if (!desc || typeof desc.value !== 'function') continue
		const original = desc.value as (...args: unknown[]) => unknown
		// Use computed property to preserve method name in stack traces
		const wrapped = {
			[key]: function (...args: unknown[]) {
				const existing = originContextStorage.getStore()
				if (existing) return original.apply(this, args)
				const origin = captureOrigin()
				origin.apiMethod = key
				return originContextStorage.run(origin, () =>
					original.apply(this, args)
				)
			},
		}[key]
		Object.defineProperty(proto, key, { ...desc, value: wrapped })
	}
}
