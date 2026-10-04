import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { Readable } from 'node:stream'

import { afterEach, describe, expect, test } from 'vitest'

import {
	fileNameFromStream,
	readStreamToBlob,
	resolveContentType,
} from '../../c8/lib/CamundaRestClient'

const tempFiles: string[] = []
afterEach(() => {
	for (const f of tempFiles.splice(0)) {
		try {
			fs.rmSync(f)
		} catch {
			/* ignore */
		}
	}
})

function writeTempFile(name: string, contents: string): string {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'c8-upload-'))
	const filePath = path.join(dir, name)
	fs.writeFileSync(filePath, contents)
	tempFiles.push(filePath)
	return filePath
}

describe('resolveContentType', () => {
	test('uses the explicit content type when provided', () => {
		expect(resolveContentType('application/pdf', 'README.md')).toBe(
			'application/pdf'
		)
	})

	test('infers the MIME type from the file name, as form-data did', () => {
		expect(resolveContentType(undefined, 'README.md')).toBe('text/markdown')
		expect(resolveContentType(undefined, 'data.json')).toBe('application/json')
		expect(resolveContentType(undefined, 'page.html')).toBe('text/html')
	})

	test('returns undefined when there is no type and no file name', () => {
		expect(resolveContentType(undefined, undefined)).toBeUndefined()
	})

	test('returns undefined when the file name has no recognizable type', () => {
		expect(resolveContentType(undefined, 'noextension')).toBeUndefined()
	})
})

describe('fileNameFromStream', () => {
	test('derives the basename from an fs.ReadStream-like path', () => {
		expect(fileNameFromStream({ path: '/tmp/some/dir/file.txt' })).toBe(
			'file.txt'
		)
		expect(fileNameFromStream({})).toBeUndefined()
	})
})

describe('readStreamToBlob', () => {
	test('streams a real fs.ReadStream from disk without buffering (file-backed Blob)', async () => {
		const filePath = writeTempFile('doc.txt', 'hello streaming world')
		const stream = fs.createReadStream(filePath)
		const blob = await readStreamToBlob(stream, 'text/plain')
		expect(blob.type).toBe('text/plain')
		expect(blob.size).toBe('hello streaming world'.length)
		expect(await blob.text()).toBe('hello streaming world')
		// The passed stream is not consumed because we read from disk directly.
		expect(stream.bytesRead).toBe(0)
		stream.destroy()
	})

	test('buffers a non-file in-memory stream that only exposes a path for filename inference', async () => {
		const stream = Readable.from([Buffer.from('in-'), Buffer.from('memory')])
		// A fake path (as documented for in-memory uploads) is NOT a real file.
		;(stream as unknown as { path: string }).path = 'virtual.txt'
		const blob = await readStreamToBlob(stream, 'text/plain')
		expect(blob.type).toBe('text/plain')
		expect(await blob.text()).toBe('in-memory')
	})

	test('buffers a ranged fs.ReadStream (start/end) so only the requested bytes are sent', async () => {
		const filePath = writeTempFile('range.txt', '0123456789')
		const stream = fs.createReadStream(filePath, { start: 2, end: 5 })
		const blob = await readStreamToBlob(stream, 'text/plain')
		expect(await blob.text()).toBe('2345')
		stream.destroy()
	})

	test('produces a typeless Blob when no type is supplied', async () => {
		const stream = Readable.from([Buffer.from('raw')])
		const blob = await readStreamToBlob(stream)
		expect(blob.type).toBe('')
		expect(await blob.text()).toBe('raw')
	})
})
