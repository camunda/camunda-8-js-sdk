/**
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership.
 *
 * Camunda licenses this file to you under the MIT; you may not use this file
 * except in compliance with the MIT License.
 */

/**
 * This file contains code adapted from https://github.com/microsoft/vscode-proxy-agent
 *
 * MIT License
 *
 * Copyright (c) 2014 Nathan Rajlich &lt;nathan@tootallnate.net&gt;
 * Copyright (c) 2015 Félicien François &lt;felicien@tweakstyle.com&gt;
 * Copyright (c) Microsoft Corporation.
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * 'Software'), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
 * IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
 * CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
 * TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import cp from 'child_process'
import fs from 'fs/promises'

let _cachedCertificates

/**
 * Get certificates from the system keychain.
 *
 */
export async function getSystemCertificates(): Promise<string[]> {
	if (_cachedCertificates) {
		return _cachedCertificates
	}

	_cachedCertificates = (await readCaCertificates()) || []

	return _cachedCertificates
}

async function readCaCertificates() {
	if (process.platform === 'win32') {
		return readWindowsCaCertificates()
	}
	if (process.platform === 'darwin') {
		return readMacCaCertificates()
	}
	if (process.platform === 'linux') {
		return readLinuxCaCertificates()
	}
	throw new Error(`Unsupported platform: ${process.platform}`)
}

async function readWindowsCaCertificates() {
	const pems = await new Promise<string[]>((resolve) => {
		const list: string[] = []
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		require('win-ca/api')({
			format: 1 /* PEM-format (text, Base64-encoded) */,
			store: ['root', 'ca'],
			ondata: list,
			onend: () => resolve(list),
		})
	})
	return pems
}

async function readMacCaCertificates() {
	const args = ['find-certificate', '-a', '-p']
	const systemRootCertsPath =
		'/System/Library/Keychains/SystemRootCertificates.keychain'

	const trusted = await spawnPromise('/usr/bin/security', args)
	const systemTrusted = await spawnPromise('/usr/bin/security', [
		...args,
		systemRootCertsPath,
	])

	const certs = new Set(splitCerts(trusted).concat(splitCerts(systemTrusted)))

	return Array.from(certs)
}

const linuxCaCertificatePaths = [
	'/etc/ssl/certs/ca-certificates.crt',
	'/etc/ssl/certs/ca-bundle.crt',
]

async function readLinuxCaCertificates() {
	for (const certPath of linuxCaCertificatePaths) {
		try {
			const content = await fs.readFile(certPath, { encoding: 'utf8' })
			const certs = new Set(splitCerts(content))
			return Array.from(certs)
		} catch (err) {
			if ((err as { code?: string })?.code !== 'ENOENT') {
				throw err
			}
		}
	}
	// Return an empty array if no certificates are found
	return []
}

// helper /////////////////

function spawnPromise(command, args) {
	return new Promise((resolve, reject) => {
		const child = cp.spawn(command, args)
		const stdout: string[] = []
		child.stdout.setEncoding('utf8')
		child.stdout.on('data', (str) => stdout.push(str))
		child.on('error', reject)
		child.on('exit', (code) => (code ? reject(code) : resolve(stdout.join(''))))
	})
}

// function derToPem(blob) {
// 	const lines = ['-----BEGIN CERTIFICATE-----']
// 	const der = blob.toString('base64')
// 	for (let i = 0; i < der.length; i += 64) {
// 		lines.push(der.substr(i, 64))
// 	}
// 	lines.push('-----END CERTIFICATE-----', '')
// 	return lines.join(os.EOL)
// }

function splitCerts(certs) {
	return certs
		.split(/(?=-----BEGIN CERTIFICATE-----)/g)
		.filter((pem) => !!pem.length)
}
