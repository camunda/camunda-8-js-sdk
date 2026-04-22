import fs from 'fs'
import http from 'http'
import { AddressInfo } from 'net'
import os from 'os'
import path from 'path'

import jwt from 'jsonwebtoken'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { EnvironmentSetup } from '../../lib/EnvironmentSetup'

/**
 * Class-of-defect regression tests for issue #737: OAuthProvider must write
 * its on-disk token cache so it is readable only by the current user.
 *
 * Cached OAuth bearer tokens are confidentiality-class secrets (anyone
 * holding one can call Camunda APIs as the principal until expiry). Files
 * written under the cache dir must therefore have POSIX mode bits with no
 * group or other access (mode & 0o077 === 0). The cache dir itself must be
 * similarly restricted so an attacker cannot list and target the files.
 *
 * The breadth of the assertion (every file in cacheDir, not one named path)
 * is intentional: it catches future code paths that write tokens through a
 * different filename or via another fs API.
 *
 * POSIX-only: skipped on Windows because Node largely ignores the mode
 * argument there.
 */

const skipOnWindows = process.platform === 'win32'

let tmpDirs: string[] = []

beforeEach(() => {
	vi.resetModules()
	EnvironmentSetup.wipeEnv()
})

afterEach(() => {
	for (const dir of tmpDirs) {
		try {
			fs.rmSync(dir, { recursive: true, force: true })
		} catch {
			/* ignore */
		}
	}
	tmpDirs = []
})

function makeTmpDirPath(prefix: string): string {
	// Reserve a unique name but do NOT create the directory — we want to
	// observe how OAuthProvider creates it.
	const dir = path.join(
		os.tmpdir(),
		`${prefix}${Date.now()}-${Math.random().toString(36).slice(2)}`
	)
	tmpDirs.push(dir)
	return dir
}

function startTokenServer(): {
	url: string
	close: () => Promise<void>
} {
	const server = http.createServer((req, res) => {
		if (req.method !== 'POST') {
			res.statusCode = 405
			return res.end()
		}
		let body = ''
		req.on('data', (chunk) => {
			body += chunk.toString()
		})
		req.on('end', () => {
			const audienceMatch = /audience=([^&]+)/.exec(body)
			const audience = audienceMatch ? audienceMatch[1] : ''
			const token = jwt.sign({ id: 1, aud: audience }, 'test-secret', {
				expiresIn: 60,
			})
			res.writeHead(200, { 'Content-Type': 'application/json' })
			res.end(JSON.stringify({ access_token: token, expires_in: 60 }))
		})
	})
	server.listen()
	const port = (server.address() as AddressInfo).port
	return {
		url: `http://127.0.0.1:${port}`,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	}
}

async function waitForFile(file: string, timeoutMs = 2000): Promise<void> {
	const start = Date.now()
	while (Date.now() - start < timeoutMs) {
		if (fs.existsSync(file)) return
		await new Promise((r) => setTimeout(r, 25))
	}
	throw new Error(`Timed out waiting for ${file}`)
}

describe.skipIf(skipOnWindows)(
	'OAuthProvider on-disk cache file permissions (#737)',
	() => {
		it('creates the cache directory with no group/other access', async () => {
			const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				OAuthProvider: any
			}
			const cacheDir = makeTmpDirPath('oauth-perms-mkdir-')

			new OAuthProvider({
				config: {
					CAMUNDA_OAUTH_URL: 'http://127.0.0.1:1',
					ZEEBE_CLIENT_ID: 'zeebe-client',
					ZEEBE_CLIENT_SECRET: 'zeebe-secret',
					CAMUNDA_TOKEN_CACHE_DIR: cacheDir,
				},
			})

			expect(fs.existsSync(cacheDir)).toBe(true)
			const dirMode = fs.statSync(cacheDir).mode
			expect(
				dirMode & 0o077,
				`cacheDir ${cacheDir} must not be accessible to group/other (mode=${(
					dirMode & 0o777
				).toString(8)})`
			).toBe(0)
		})

		it('writes every cached token file with no group/other access', async () => {
			const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				OAuthProvider: any
			}
			const cacheDir = makeTmpDirPath('oauth-perms-write-')
			const server = startTokenServer()

			try {
				const o = new OAuthProvider({
					config: {
						CAMUNDA_OAUTH_URL: server.url,
						ZEEBE_CLIENT_ID: 'zeebe-client',
						ZEEBE_CLIENT_SECRET: 'zeebe-secret',
						CAMUNDA_CONSOLE_CLIENT_ID: 'console-client',
						CAMUNDA_CONSOLE_CLIENT_SECRET: 'console-secret',
						CAMUNDA_CONSOLE_OAUTH_AUDIENCE: 'api.cloud.camunda.io',
						CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'zeebe.camunda.io',
						CAMUNDA_TOKEN_CACHE_DIR: cacheDir,
					},
				})
				;(o as unknown as { isCamundaSaaS: boolean }).isCamundaSaaS = true

				await o.getHeaders('ZEEBE')
				await o.getHeaders('CONSOLE')

				// sendToFileCache writes asynchronously via fs.writeFile.
				const expectedZeebe = path.join(
					cacheDir,
					'oauth-token-zeebe-client-ZEEBE.json'
				)
				const expectedConsole = path.join(
					cacheDir,
					'oauth-token-console-client-CONSOLE.json'
				)
				await waitForFile(expectedZeebe)
				await waitForFile(expectedConsole)

				const tokenFiles = fs
					.readdirSync(cacheDir)
					.filter((f) => f.startsWith('oauth-token-') && f.endsWith('.json'))

				expect(tokenFiles.length).toBeGreaterThanOrEqual(2)

				for (const f of tokenFiles) {
					const full = path.join(cacheDir, f)
					const mode = fs.statSync(full).mode
					expect(
						mode & 0o077,
						`token file ${f} must not be accessible to group/other (mode=${(
							mode & 0o777
						).toString(8)})`
					).toBe(0)
				}
			} finally {
				await server.close()
			}
		})

		it('tightens permissions on a pre-existing world-readable token file', async () => {
			const { OAuthProvider } = (await vi.importActual('../../oauth')) as {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				OAuthProvider: any
			}
			const cacheDir = makeTmpDirPath('oauth-perms-existing-')
			fs.mkdirSync(cacheDir, { recursive: true, mode: 0o755 })

			// Simulate a token file written by an older SDK with default umask.
			const stale = path.join(cacheDir, 'oauth-token-zeebe-client-ZEEBE.json')
			fs.writeFileSync(
				stale,
				JSON.stringify({
					access_token: 'stale',
					expires_in: 60,
					expiry: Math.floor(Date.now() / 1000) + 60,
				}),
				{ mode: 0o644 }
			)
			// Sanity: confirm we set up the bad mode the test wants to fix.
			expect(fs.statSync(stale).mode & 0o077).not.toBe(0)

			const server = startTokenServer()
			try {
				const o = new OAuthProvider({
					config: {
						CAMUNDA_OAUTH_URL: server.url,
						ZEEBE_CLIENT_ID: 'zeebe-client',
						ZEEBE_CLIENT_SECRET: 'zeebe-secret',
						CAMUNDA_TOKEN_CACHE_DIR: cacheDir,
					},
				})
				await o.getHeaders('ZEEBE')
				await waitForFile(stale)

				const mode = fs.statSync(stale).mode
				expect(
					mode & 0o077,
					`pre-existing token file must be tightened (mode=${(
						mode & 0o777
					).toString(8)})`
				).toBe(0)
			} finally {
				await server.close()
			}
		})
	}
)
