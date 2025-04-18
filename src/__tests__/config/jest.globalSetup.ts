import { cleanUp } from './jest.cleanup'

export default async () => {
	console.log('Running global setup...')
	await cleanUp()
	console.log('Global setup complete.')
}
