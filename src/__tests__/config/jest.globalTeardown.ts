import { cleanUp, restoreZeebeLogging } from './globalSetup'

export default async () => {
	console.log('Running global teardown...')
	restoreZeebeLogging()
	await cleanUp()
	console.log('Global teardown complete.')
}
