import { vi } from 'vitest'

// Simulate a lossless-json version (e.g. 4.3.x) whose parser keeps `__proto__` as an own
// enumerable property, so the DTO guard is exercised independently of the installed version.
vi.mock('lossless-json', async (importActual) => {
	const actual = await importActual<typeof import('lossless-json')>()
	return { ...actual, parse: (text: string) => JSON.parse(text) }
})

import { LosslessDto, losslessParse } from '../../lib'

class ProtoDto extends LosslessDto {
	name!: string
}

test.each([
	'{"__proto__":{"injected":true},"name":"a"}',
	'{"\\u005f_proto__":{"injected":true},"name":"a"}',
])('DTO prototype survives a parser that keeps own __proto__: %s', (json) => {
	const dto = losslessParse(json, ProtoDto)
	expect(dto).toBeInstanceOf(ProtoDto)
	expect(Object.getPrototypeOf(dto)).toBe(ProtoDto.prototype)
	expect((dto as unknown as { injected?: boolean }).injected).toBeUndefined()
	expect(dto.name).toBe('a')
})
