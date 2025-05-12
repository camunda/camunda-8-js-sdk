import debug from 'debug'

import { CamundaEnvironmentVariableDictionary } from '.'

const trace = debug('test:config')
export type EnvironmentStorage = Record<string, string | undefined>
const storage: EnvironmentStorage = {}

function wipeEnv() {
	CamundaEnvironmentVariableDictionary.forEach((key) => {
		trace('wiping', key, process.env[key])
		delete process.env[key]
	})
	trace('Environment wiped')
}

/** Store all env vars, then wipe them in the environment */
function storeEnv() {
	CamundaEnvironmentVariableDictionary.forEach((key) => {
		storage[key] = process.env[key]
		trace('storing', key, process.env[key])
	})

	trace('storage', storage)
	return storage
}

/** Restore all env vars, and wipe storage */
function restoreEnv(storage: EnvironmentStorage) {
	CamundaEnvironmentVariableDictionary.forEach(
		(key) => (process.env[key] = storage[key])
	)
	trace('restoring', storage)
	Object.keys(storage).forEach((key) => delete storage[key])
}

export const EnvironmentSetup = {
	wipeEnv,
	storeEnv,
	restoreEnv,
}
