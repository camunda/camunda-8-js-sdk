import { cleanUp, restoreZeebeLogging } from './jest.cleanup'

export default async () => {
	console.log('Running global teardown...')
	restoreZeebeLogging()
	await cleanUp()
	console.log('Global teardown complete.')
}
