import { runInNewContext } from 'node:vm'
import { setFlagsFromString } from 'node:v8'

import { parse as upstreamParse } from 'lossless-json'

import {
	Int64String,
	LosslessDto,
	losslessParse,
} from '../../lib/LosslessJsonParser'
import { parse as vendoredParse } from '../../vendor/lossless-json/parse'

/**
 * Resource regression test for the vendored lossless-json parser (#890, #897, #905).
 *
 * The heap test in LosslessJsonParser.unit.spec.ts goes through the native JSON.parse
 * fast path, so it never runs the vendored string-run code. These tests force the
 * vendored path (an int64 value beyond Number.MAX_SAFE_INTEGER makes LosslessJsonParser
 * defer to it) and measure retained heap with a real GC. The same measurement against the
 * unvendored upstream parse (lossless-json 4.3.x, which appends one character at a time)
 * shows the blow-up, so the test proves it can tell the fixed parser from the broken one.
 */

// Make `gc` available even when node runs without --expose-gc.
setFlagsFromString('--expose-gc')
const gc = runInNewContext('gc') as () => void

const STRING_LENGTH = 10_000
const COPIES = 200
// Large values with many escaped runs, plus an int64 key that the native fast path cannot
// represent losslessly.
const chunk = 'x'.repeat(100)
const longString = Array.from(
	{ length: STRING_LENGTH / 100 },
	(_, n) => `${chunk}${n % 2 ? '\n' : '"'}`
).join('')
const payload = `{"processInstanceKey":2251799813685249123,"data":${JSON.stringify(
	longString
)},"plain":${JSON.stringify('y'.repeat(STRING_LENGTH))}}`
class ResourceDto extends LosslessDto {
	@Int64String
	processInstanceKey!: string
	data!: string
	plain!: string
}

const payloadChars = 2 * STRING_LENGTH

function retainedBytesPerChar(parseFn: (text: string) => unknown): number {
	gc()
	gc()
	const baseline = process.memoryUsage().heapUsed
	const kept: unknown[] = []
	for (let i = 0; i < COPIES; i++) {
		kept.push(parseFn(payload))
	}
	gc()
	gc()
	const retained = process.memoryUsage().heapUsed - baseline
	// Keep the results live through the measurement.
	expect(kept).toHaveLength(COPIES)
	return retained / (COPIES * payloadChars)
}

describe('vendored lossless-json parse resource usage', () => {
	test('LosslessJsonParser routes int64 payloads to the vendored parser', () => {
		const parsed = losslessParse(payload, ResourceDto)
		expect(parsed.data).toBe(longString)
		expect(parsed.processInstanceKey).toBe('2251799813685249123')
		expect(parsed.plain).toBe('y'.repeat(STRING_LENGTH))
		// Same result as calling the vendored parse directly
		expect((vendoredParse(payload) as { data: string }).data).toBe(parsed.data)
	})

	test('does not retain per-character heap for long string values (contrast with upstream)', () => {
		const vendored = retainedBytesPerChar((t) => losslessParse(t, ResourceDto))
		const upstream = retainedBytesPerChar((t) => upstreamParse(t))
		// A flat one-byte string costs ~1 byte per char; the per-character rope of the
		// unfixed parser keeps ~30 bytes per char alive.
		expect(vendored).toBeLessThan(5)
		expect(upstream).toBeGreaterThan(10)
		expect(upstream).toBeGreaterThan(vendored * 4)
	})

	test('parse time scales linearly with string length', () => {
		const time = (len: number) => {
			const text = JSON.stringify(
				Array.from({ length: len / 50 }, () => `${'z'.repeat(49)}\t`).join('')
			)
			vendoredParse(text) // warm up
			const samples: number[] = []
			for (let sample = 0; sample < 5; sample++) {
				gc()
				const parsed: unknown[] = []
				const start = process.hrtime.bigint()
				for (let i = 0; i < 10; i++) parsed.push(vendoredParse(text))
				samples.push(Number(process.hrtime.bigint() - start))
				expect(parsed).toHaveLength(10)
			}
			samples.sort((a, b) => a - b)
			return samples[Math.floor(samples.length / 2)]
		}
		const small = time(200_000)
		const large = time(400_000)
		// Use a median batch so one noisy timing sample does not dominate the scaling check.
		// 2x input should take about 2x time; allow a 3x ratio with fixed timing slack.
		expect(large).toBeLessThan(small * 3 + 5_000_000)
	})
})
