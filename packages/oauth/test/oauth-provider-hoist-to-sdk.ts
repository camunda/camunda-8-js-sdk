import test from 'ava'
import { execSync } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { OAuthProvider } from '../source/index.js'

function removeCacheDir(dirpath: string) {
	if (fs.existsSync(dirpath)) {
		fs.rmSync(dirpath, {
			recursive: true,
			force: true,
		})
	}
}

// @Move to sdk (FileCache test)
test.skip('Gets the token cache dir from the environment', (t) => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	removeCacheDir(tokenCacheDir)
	t.is(fs.existsSync(tokenCacheDir), false)
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir

	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId3',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})
	t.is(!!o, true)
	const exists = fs.existsSync(tokenCacheDir)
	t.is(exists, true)
	removeCacheDir(tokenCacheDir)

	t.is(fs.existsSync(tokenCacheDir), false)
})

// @Move to sdk (FileCache test)
test.skip('Creates the token cache dir if it does not exist', (t) => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	removeCacheDir(tokenCacheDir)

	t.is(fs.existsSync(tokenCacheDir), false)

	const o = new OAuthProvider({
		configuration: {
			CAMUNDA_ZEEBE_OAUTH_AUDIENCE: 'token',
			ZEEBE_CLIENT_ID: 'clientId4',
			ZEEBE_CLIENT_SECRET: 'clientSecret',
			CAMUNDA_OAUTH_URL: 'url',
		},
	})

	t.is(!!o, true)
	t.is(fs.existsSync(tokenCacheDir), true)
	removeCacheDir(tokenCacheDir)

	t.is(fs.existsSync(tokenCacheDir), false)
})

// @Move to sdk
test.skip('Throws in the constructor if the token cache is not writable', (t) => {
	const tokenCacheDir = path.join(__dirname, '.token-cache')
	process.env.CAMUNDA_TOKEN_CACHE_DIR = tokenCacheDir
	removeCacheDir(tokenCacheDir)

	t.is(fs.existsSync(tokenCacheDir), false)
	if (os.platform() === 'win32') {
		fs.mkdirSync(tokenCacheDir)
		t.is(fs.existsSync(tokenCacheDir), true)
		// Make the directory read-only on Windows
		// Note that this requires administrative privileges
		execSync(`icacls ${tokenCacheDir} /deny Everyone:(OI)(CI)W /inheritance:r`)
	} else {
		// Make the directory read-only on Unix
		fs.mkdirSync(tokenCacheDir, 0o400)
		t.is(fs.existsSync(tokenCacheDir), true)
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
		t.is(!!o, true)
	} catch {
		thrown = true
	}

	// Make the directory writeable on Windows, so it can be deleted
	// Note that this requires administrative privileges
	if (os.platform() === 'win32') {
		execSync(`icacls ${tokenCacheDir} /grant Everyone:(OI)(CI)(F)`)
	}
	removeCacheDir(tokenCacheDir)
	t.is(thrown, true)
	t.is(fs.existsSync(tokenCacheDir), false)
})

//@Move to sdk - Filecache test
test.skip('Creates the token cache dir if it does not exist 1', (t) => {
	const tokenCache = path.join(__dirname, '.token-cache')
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

	t.is(!!o, true)
	t.is(fs.existsSync(tokenCache), true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	t.is(fs.existsSync(tokenCache), false)
})

// @Move to sdk - File cache test
test.skip('Gets the token cache dir from the environment 1', (t) => {
	const tokenCache = path.join(__dirname, '.token-cache')
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

	t.is(!!o, true)
	t.is(fs.existsSync(tokenCache), true)
	if (fs.existsSync(tokenCache)) {
		fs.rmdirSync(tokenCache)
	}
	t.is(fs.existsSync(tokenCache), false)
})

// @Move to sdk - File cache test
test.skip('Uses an explicit token cache over the environment', (t) => {
	const tokenCache1 = path.join(__dirname, '.token-cache1')
	const tokenCache2 = path.join(__dirname, '.token-cache2')
	;[tokenCache1, tokenCache2].forEach((tokenCache) => {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}
		t.is(fs.existsSync(tokenCache), false)
	})
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

	t.is(!!o, true)
	t.is(fs.existsSync(tokenCache2), true)
	t.is(fs.existsSync(tokenCache1), false)
	;[tokenCache1, tokenCache2].forEach((tokenCache) => {
		if (fs.existsSync(tokenCache)) {
			fs.rmdirSync(tokenCache)
		}
		t.is(fs.existsSync(tokenCache), false)
	})
})
