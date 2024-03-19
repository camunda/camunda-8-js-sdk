import { restoreZeebeLogging, suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe'

suppressZeebeLogging()
const zbc = new ZeebeGrpcClient()

afterAll(async () => {
	await zbc.close() // Makes sure we don't forget to close connection
	restoreZeebeLogging()
})

test('does not retry the deployment of a broken BPMN file', async () => {
	expect.assertions(1)
	try {
		await zbc.deployResource({
			processFilename: './src/__tests__/testdata/Client-BrokenBpmn.bpmn',
		})
	} catch (e: unknown) {
		expect((e as Error).message.indexOf('3 INVALID_ARGUMENT:')).toBe(0)
	}
})
