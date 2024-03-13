import { CamundaEnvironmentVariableDictionary } from '.'

const storage: Record<string, string | undefined> = {}
let envStored = false

function wipeEnv() {
	if (!envStored) {
		throw new Error('Environment not stored. Refusing to wipe.')
	}
	CamundaEnvironmentVariableDictionary.forEach((key) => delete process.env[key])
}

/** Store all env vars, then wipe them in the environment */
function storeEnv() {
	if (envStored) {
		throw new Error('Environment already stored. Refusing to store again.')
	}
	CamundaEnvironmentVariableDictionary.forEach(
		(key) => (storage[key] = process.env[key])
	)
	envStored = true
}

/** Restore all env vars, and wipe storage */
function restoreEnv() {
	if (!envStored) {
		throw new Error('Environment not stored. Refusing to restore.')
	}
	CamundaEnvironmentVariableDictionary.forEach(
		(key) => (process.env[key] = storage[key])
	)
	Object.keys(storage).forEach((key) => delete storage[key])
	envStored = false
}

export const EnvironmentSetup = {
	wipeEnv,
	storeEnv,
	restoreEnv,
}
