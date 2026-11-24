import { LosslessNumber, parse as upstreamParse } from 'lossless-json'

import { parse } from '../../vendor/lossless-json/parse'

/**
 * The vendored parse must be a drop-in replacement for lossless-json's: same
 * values, same LosslessNumber class, same errors. Only the way string values are
 * built in memory differs (see src/vendor/lossless-json/README.md).
 */

const outcome = (fn: () => unknown) => {
	try {
		return { value: fn() }
	} catch (e) {
		return { error: `${(e as Error).name}: ${(e as Error).message}` }
	}
}

const long = 'x'.repeat(20_000)

const valid = [
	'{}',
	'[]',
	'""',
	'"plain ascii"',
	JSON.stringify({ big: long }),
	JSON.stringify({ text: `${long}\n${long}\t"quoted"\\${long}` }),
	'"\\u00e9t\\u00e9 \\ud83d\\ude00 \\"\\\\\\/\\b\\f\\n\\r\\t"',
	JSON.stringify('été 😀 ünïcödé 日本語 ' + 'é'.repeat(5000)),
	'{"processInstanceKey":2251799813685249,"n":1.5e300,"neg":-0,"f":0.1}',
	'{"a":[1,2,{"b":"c\\u0041d"}],"e":null,"t":true,"f":false}',
	'{"dup":1,"dup":1}',
	'{"__proto__":{"polluted":true},"k":"v"}',
	'  \n\t {"ws" : [ "a" , "b" ] }  ',
	JSON.stringify({ arr: Array.from({ length: 200 }, (_, i) => `item-${i}`) }),
]

const invalid = [
	'"unterminated',
	'"bad \\x escape"',
	'"bad \\u12 unicode"',
	'"control \u0001 char"',
	'{"a":1,}',
	'{"dup":1,"dup":2}',
	'[1,2',
	'{"a" 1}',
	'tru',
	'"a" "b"',
	'',
]

describe('vendored lossless-json parse', () => {
	test.each(valid.map((text) => [text.slice(0, 60), text]))(
		'matches lossless-json on valid input %s',
		(_label, text) => {
			expect(outcome(() => parse(text))).toEqual(
				outcome(() => upstreamParse(text))
			)
		}
	)

	test.each(invalid.map((text) => [JSON.stringify(text), text]))(
		'throws the same error as lossless-json on %s',
		(_label, text) => {
			const vendored = outcome(() => parse(text))
			expect(vendored.error).toBeDefined()
			expect(vendored).toEqual(outcome(() => upstreamParse(text)))
		}
	)

	test('creates numbers with the lossless-json package LosslessNumber class', () => {
		const parsed = parse('{"key":2251799813685249}') as { key: unknown }
		expect(parsed.key).toBeInstanceOf(LosslessNumber)
		expect((parsed.key as LosslessNumber).value).toBe('2251799813685249')
	})

	test('passes reviver and number parser options through', () => {
		const text = '{"key":2251799813685249,"d":"2026-01-01T00:00:00.000Z"}'
		const reviver = (k: string, v: unknown) => (k === 'd' ? `#${v}` : v)
		expect(parse(text, reviver, (v) => BigInt(v))).toEqual(
			upstreamParse(text, reviver, (v) => BigInt(v))
		)
	})
})
