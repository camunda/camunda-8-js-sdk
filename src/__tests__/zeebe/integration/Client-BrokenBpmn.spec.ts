import { matrix } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'

const zbc = new ZeebeGrpcClient()

afterAll(async () => {
	await zbc.close() // Makes sure we don't forget to close connection
})

test.runIf(
	matrix({
		include: {},
		exclude: [
			{
				deployment: 'unit-test',
			},
		],
	})
)('does not retry the deployment of a broken BPMN file', async () => {
	expect.assertions(1)
	try {
		await zbc.deployResource({
			processFilename: './src/__tests__/testdata/Client-BrokenBpmn.bpmn',
		})
	} catch (e: unknown) {
		expect((e as Error).message.indexOf('3 INVALID_ARGUMENT:')).toBe(0)
	}
})
