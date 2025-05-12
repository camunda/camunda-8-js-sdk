import { cleanUp, suppressZeebeLogging } from './jest.cleanup'

export default async () => {
	console.log('Running global setup...')
	suppressZeebeLogging()
	await cleanUp()
	console.log('Global setup complete.')
}
