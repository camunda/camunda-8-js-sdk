import { EnvironmentSetup, EnvironmentStorage } from '../../lib'
import { ZeebeGrpcClient } from '../../zeebe'

let storage: EnvironmentStorage = {}

beforeAll(() => (storage = EnvironmentSetup.storeEnv()))
beforeEach(() => {
	EnvironmentSetup.wipeEnv()
})
afterAll(() => {
	EnvironmentSetup.restoreEnv(storage)
})

jest.setTimeout(13000)

test('ZeebeGrpcClient constructor throws an exception when there is no broker and retry is false', async () => {
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			ZEEBE_ADDRESS: 'localhoster',
			zeebeGrpcSettings: {
				ZEEBE_GRPC_CLIENT_RETRY: false,
			},
		},
	})
	expect.assertions(1)
	try {
		await zbc.deployResource({
			processFilename: './src/__tests__/testdata/hello-world.bpmn',
		})
	} catch (e: unknown) {
		expect((e as Error).message.indexOf('14 UNAVAILABLE:')).toEqual(0)
	}
	await zbc.close()
})

test('cancelProcessInstance throws an exception when workflowInstanceKey is malformed', async () => {
	const zbc = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			ZEEBE_ADDRESS: 'localhoster',
			zeebeGrpcSettings: { ZEEBE_GRPC_CLIENT_RETRY: false },
		},
	})
	expect.assertions(1)
	try {
		await zbc.cancelProcessInstance('hello-world')
	} catch (e: unknown) {
		expect(e).toMatchSnapshot()
	}
	await zbc.close()
})
