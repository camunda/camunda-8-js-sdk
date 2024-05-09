import { X509Certificate } from 'crypto'
import fs from 'fs'
import path from 'path'

import { debug } from 'debug'

import { CamundaPlatform8Configuration } from './Configuration'
import { getSystemCertificates } from './GetSystemCertificates'

const trace = debug('camunda:certificate')

export async function GetCustomCertificateBuffer(
	config: CamundaPlatform8Configuration
): Promise<Buffer | undefined> {
	trace(config)
	const customRootCertPath = config.CAMUNDA_CUSTOM_ROOT_CERT_PATH
	const customRootCert = config.CAMUNDA_CUSTOM_ROOT_CERT_STRING

	if (!customRootCertPath && !customRootCert) {
		trace(`No custom root certificate configured`)
		return undefined
	}
	const rootCerts: string[] = []

	if (customRootCertPath) {
		trace(`Using custom root certificate from file: ${customRootCertPath}`)
		const cert = readRootCertificate(customRootCertPath)

		if (cert) {
			rootCerts.push(cert)
		}
	} else if (customRootCert) {
		trace(`Using custom root certificate from string`)
		rootCerts.push(customRootCert)
	}

	// (2) use certificates from OS keychain
	const systemCertificates = await getSystemCertificates()
	rootCerts.push(...systemCertificates)

	if (!rootCerts.length) {
		trace(`No custom root certificates found`)
		return undefined
	}

	return Buffer.from(rootCerts.join('\n'))
}

function readRootCertificate(certPath) {
	let cert

	try {
		const absolutePath = path.isAbsolute(certPath)
			? certPath
			: path.join(process.cwd(), certPath)

		cert = fs.readFileSync(absolutePath)
	} catch (err) {
		console.error('Failed to read custom SSL certificate:', err)

		return
	}

	let parsed
	try {
		parsed = new X509Certificate(cert)
	} catch (err) {
		console.warn('Failed to parse custom SSL certificate:', err)
	}

	if (parsed && parsed.issuer !== parsed.subject) {
		console.warn('Custom SSL certificate appears to be not a root certificate')
	}

	return cert
}
