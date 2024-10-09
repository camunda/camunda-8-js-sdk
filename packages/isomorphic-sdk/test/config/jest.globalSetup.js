// require('ts-node').register({
// 	transpileOnly: true,
// 	project: 'src/__tests__/tsconfig.json',
// })
const { cleanUp } = require('./jest.cleanup.js')

module.exports.default = async () => {
	await cleanUp()
}
