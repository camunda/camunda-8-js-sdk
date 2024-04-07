import { ZeebeGrpcClient } from '../../../zeebe/index'
import { ZBWorkerTaskHandler } from '../../../zeebe/types'

jest.setTimeout(7000)

test('Has not broken any public type contracts', async () => {
	const zbc = new ZeebeGrpcClient({
		config: { zeebeGrpcSettings: { ZEEBE_CLIENT_LOG_LEVEL: 'NONE' } },
	})

	const handler: ZBWorkerTaskHandler = (job, worker) => {
		worker.log(job.bpmnProcessId)
		return job.complete()
	}
	zbc.createWorker({ taskType: 'nope', taskHandler: handler })
	await zbc.close()
	expect(true).toBeTruthy()
})
