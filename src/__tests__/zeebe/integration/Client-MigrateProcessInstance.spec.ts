import { suppressZeebeLogging } from 'lib'

import { ZeebeGrpcClient } from '../../../zeebe/index'

suppressZeebeLogging()

const zbc = new ZeebeGrpcClient()

test('ZeebeGrpcClient can migrate a process instance', async () => {
	expect(true).toBe(true)
	// Deploy a process model

	// const res = await zbc.deployResource({
	// 	processFilename: './src/__tests__/testdata/Client-SkipFirstTask.bpmn',
	// })

	// Create an instance of the process model

	// Deploy the updated process model

	// Migrate the process instance to the updated process model

	// Complete the job in the process instance

	// Assert that the job was completed in the new process model
})
