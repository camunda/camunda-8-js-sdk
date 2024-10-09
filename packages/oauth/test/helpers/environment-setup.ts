import process from 'node:process'
import {CamundaEnvironmentVariableDictionary} from '../../source/lib/get-environment.js'

const storage: Map<string, string | undefined> = new Map<string, string | undefined>()
let envStored = false

function wipeEnv() {
	if (!envStored) {
		throw new Error('Environment not stored. Refusing to wipe.')
	}

	for (const key of CamundaEnvironmentVariableDictionary) {
		delete process.env[key] // eslint-disable-line @typescript-eslint/no-dynamic-delete
	}
}

/** Store all env vars, then wipe them in the environment */
function storeEnv() {
	if (envStored) {
		throw new Error('Environment already stored. Refusing to store again.')
	}

	for (const key of CamundaEnvironmentVariableDictionary) {
		storage.set(key, process.env[key])
	}

	envStored = true
}

/** Restore all env vars, and wipe storage */
function restoreEnv() {
	if (!envStored) {
		throw new Error('Environment not stored. Refusing to restore.')
	}

	for (const key of CamundaEnvironmentVariableDictionary) {
		(process.env[key] = storage.get(key))
	}

	for (const key of Object.keys(storage)) {
		storage.delete(key)
	}

	envStored = false
}

export const environmentSetup = {
	wipeEnv,
	storeEnv,
	restoreEnv,
}
