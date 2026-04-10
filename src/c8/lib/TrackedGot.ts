import { randomUUID } from 'node:crypto'

import { Got, Options } from 'got'

import { OriginContext, originContextStorage } from './OriginTracing'

export interface StackEntry {
	location: string
	stack: string
	timestamp: number
}

export interface CapturedStackTrace {
	stacks: StackEntry[]
	requestId: string
	capturedAt: number
	apiMethod?: string
}

/**
 * Wrap a got instance with a Proxy that injects AsyncLocalStorage-derived stack context
 * into each request's options.context.__stackTrace.
 * It preserves the full surface of the original got instance (HTTP verb helpers, extend, etc.).
 */
export function createTrackedGot(gotInstance: Got): Got {
	// Capture stack synchronously before got does internal async work
	const capture = () => {
		const raw =
			new Error('tracked-got-capture').stack?.split('\n').slice(1) ?? []
		const frames: StackEntry[] = raw.map((line) => ({
			location: line.trim(),
			stack: line.trim(),
			timestamp: Date.now(),
		}))
		return { frames, flat: frames.map((f) => f.location).join('\n') }
	}

	const withStackContext = (options?: Options): Options => {
		const base: Options = options ? { ...options } : ({} as Options)
		const origin: OriginContext | undefined = originContextStorage.getStore()
		let frames: StackEntry[]
		let flat: string
		let requestId: string
		let capturedAt: number
		if (origin) {
			frames = origin.frames.map((loc) => ({
				location: loc,
				stack: loc,
				timestamp: origin.capturedAt,
			}))
			flat = origin.frames.join('\n')
			requestId = origin.requestId
			capturedAt = origin.capturedAt
		} else {
			const local = capture()
			frames = local.frames
			flat = local.flat
			requestId = randomUUID()
			capturedAt = Date.now()
		}
		const structured: CapturedStackTrace = {
			stacks: frames,
			requestId,
			capturedAt,
			apiMethod: origin?.apiMethod,
		}
		return {
			...base,
			context: {
				...(base.context ?? {}),
				stack: flat,
				__stackTrace: structured,
			},
		}
	}

	const httpVerbs = new Set([
		'get',
		'post',
		'put',
		'patch',
		'delete',
		'head',
		'options',
		'trace',
	])

	const proxy = new Proxy(gotInstance as unknown as Got, {
		apply(target, thisArg, argArray) {
			const [url, options] = argArray as [string | URL, Options | undefined]
			const enhanced = withStackContext(options)
			// eslint-disable-next-line @typescript-eslint/ban-types
			return Reflect.apply(target as unknown as Function, thisArg, [
				url,
				enhanced,
			])
		},
		get(target, prop, receiver) {
			if (prop === 'extend') {
				return (...extendArgs: unknown[]) => {
					// @ts-expect-error dynamic call
					const extended = target.extend(...extendArgs)
					return createTrackedGot(extended)
				}
			}
			if (httpVerbs.has(String(prop))) {
				const original = Reflect.get(target, prop, receiver)
				if (typeof original === 'function') {
					return (...methodArgs: unknown[]) => {
						if (methodArgs.length === 0) return original()
						const lastIndex = methodArgs.length - 1
						const last = methodArgs.at(lastIndex)
						if (last && typeof last === 'object' && !Array.isArray(last)) {
							methodArgs[lastIndex] = withStackContext(last as Options)
						} else {
							methodArgs.push(withStackContext())
						}
						return original(...methodArgs)
					}
				}
			}
			return Reflect.get(target, prop, receiver)
		},
	})

	return proxy
}
