import tls from 'tls'

const originalPlatform = process.platform

function setPlatform(platform: NodeJS.Platform) {
	Object.defineProperty(process, 'platform', { value: platform })
}

afterEach(() => {
	setPlatform(originalPlatform)
	vi.restoreAllMocks()
	vi.resetModules()
})

test('reads the Windows certificate store via tls.getCACertificates', async () => {
	setPlatform('win32')
	const pems = [
		'-----BEGIN CERTIFICATE-----\nAAAA\n-----END CERTIFICATE-----\n',
	]
	const getCACertificates = vi
		.spyOn(tls, 'getCACertificates')
		.mockReturnValue(pems)

	const { getSystemCertificates } = await import(
		'../../lib/GetSystemCertificates'
	)

	expect(await getSystemCertificates()).toEqual(pems)
	expect(getCACertificates).toHaveBeenCalledWith('system')
})
