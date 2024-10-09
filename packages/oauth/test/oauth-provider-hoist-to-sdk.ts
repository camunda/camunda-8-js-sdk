/* eslint-disable ava/no-skip-test */
/* eslint-disable @typescript-eslint/naming-convention */
import {execSync} from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'ava'
import {OAuthProvider} from '../source/index.js'

function removeCacheDirectory(dirpath: string) {
	if (fs.existsSync(dirpath)) {
		fs.rmSync(dirpath, {
			recursive: true,
			force: true,
		})
	}
}

// @Move to sdk (FileCache test)
test.skip('Gets the token cache dir from the environment', t => {
	const tokenCacheDirectory = path.join(import.meta.dirname, '.token-cache')
	removeCacheDirectory(tokenCacheDirectory)
	t.is(fs.existsSync(tokenCacheDirectory), false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDirectory

	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId3',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})
	t.is(Boolean(o), true)
	const exists = fs.existsSync(tokenCacheDirectory)
	t.is(exists, true)
	removeCacheDirectory(tokenCacheDirectory)

	t.is(fs.existsSync(tokenCacheDirectory), false)
})

// @Move to sdk (FileCache test)
test.skip('Creates the token cache dir if it does not exist', t => {
	const tokenCacheDirectory = path.join(import.meta.dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDirectory
	removeCacheDirectory(tokenCacheDirectory)

	t.is(fs.existsSync(tokenCacheDirectory), false)

	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId4',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	t.is(Boolean(o), true)
	t.is(fs.existsSync(tokenCacheDirectory), true)
	removeCacheDirectory(tokenCacheDirectory)

	t.is(fs.existsSync(tokenCacheDirectory), false)
})

// @Move to sdk
test.skip('Throws in the constructor if the token cache is not writable', t => {
	const tokenCacheDirectory = path.join(import.meta.dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDirectory
	removeCacheDirectory(tokenCacheDirectory)

	t.is(fs.existsSync(tokenCacheDirectory), false)
	if (os.platform() === 'win32') {
		fs.mkdirSync(tokenCacheDirectory)
		t.is(fs.existsSync(tokenCacheDirectory), true)
		// Make the directory read-only on Windows
		// Note that this requires administrative privileges
		execSync(`icacls ${tokenCacheDirectory} /deny Everyone:(OI)(CI)W /inheritance:r`)
	} else {
		// Make the directory read-only on Unix
		fs.mkdirSync(tokenCacheDirectory, 0o400)
		t.is(fs.existsSync(tokenCacheDirectory), true)
	}

	let thrown = false
	try {
		const o = new OAuthProvider({
			configuration: {
				CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
				ZEEBE_CLIENT_ID: 'clientId5',
				ZEEBE_CLIENT_SECRET: 'clientSecret',
				CAMUNDA_OAUTH_URL: 'url',
			},
		})
		t.is(Boolean(o), true)
	} catch {
		thrown = true
	}

	// Make the directory writeable on Windows, so it can be deleted
	// Note that this requires administrative privileges
	if (os.platform() === 'win32') {
		execSync(`icacls ${tokenCacheDirectory} /grant Everyone:(OI)(CI)(F)`)
	}

	removeCacheDirectory(tokenCacheDirectory)
	t.is(thrown, true)
	t.is(fs.existsSync(tokenCacheDirectory), false)
})

// @Move to sdk - Filecache test
test.skip('Creates the token cache dir if it does not exist 1', t => {
	const tokenCache = path.join(import.meta.dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}

	t.is(fs.existsSync(tokenCache), false)

	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_CACHE_DIR: tokenCache,
			ZEEBE_CLIENT_ID: 'clientId12',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	t.is(Boolean(o), true)
	t.is(fs.existsSync(tokenCache), true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}

	t.is(fs.existsSync(tokenCache), false)
})

// @Move to sdk - File cache test
test.skip('Gets the token cache dir from the environment 1', t => {
	const tokenCache = path.join(import.meta.dirname, '.token-cache')
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}

	t.is(fs.existsSync(tokenCache), false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId13',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	t.is(Boolean(o), true)
	t.is(fs.existsSync(tokenCache), true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}

	t.is(fs.existsSync(tokenCache), false)
})

// @Move to sdk - File cache test
test.skip('Uses an explicit token cache over the environment', t => {
	const tokenCache1 = path.join(import.meta.dirname, '.token-cache1')
	const tokenCache2 = path.join(import.meta.dirname, '.token-cache2');
	for (const tokenCache of [tokenCache1, tokenCache2]) {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}

		t.is(fs.existsSync(tokenCache), false)
	}

	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCache1
	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			CAMUNDA_TOKEN_CACHE_DIR: tokenCache2,
			ZEEBE_CLIENT_ID: 'clientId14',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	t.is(Boolean(o), true)
	t.is(fs.existsSync(tokenCache2), true)
	t.is(fs.existsSync(tokenCache1), false);
	for (const tokenCache of [tokenCache1, tokenCache2]) {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}

		t.is(fs.existsSync(tokenCache), false)
	}
})
