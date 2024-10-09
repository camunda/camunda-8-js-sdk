const { cleanUp } = require('./jest.cleanup')

export default async () => {
	await cleanUp()
}
