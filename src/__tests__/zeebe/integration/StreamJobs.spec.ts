import { allowAny } from '../../../test-support/testTags'
import { ZeebeGrpcClient } from '../../../zeebe'
import { cancelProcesses } from '../../../zeebe/lib/cancelProcesses'

process.env.ZEEBE_NODE_LOG_LEVEL = process.env.ZEEBE_NODE_LOG_LEVEL || 'NONE'
vi.setConfig({ testTimeout: 25_000 })

let bpmnProcessId: string
let processDefinitionKey: string

beforeAll(async () => {
	const zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })
	;({ bpmnProcessId, processDefinitionKey } = (
		await zbc.deployResource({
			processFilename: './src/__tests__/testdata/StreamJobs.bpmn',
		})
	).deployments[0].process)
	await cancelProcesses(processDefinitionKey)
	await zbc.close()
})

afterEach(async () => {
	await cancelProcesses(processDefinitionKey)
})

afterAll(async () => {
	await cancelProcesses(processDefinitionKey)
})

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Backward compat: streams jobs created after the worker starts',
	async () => {
		const zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })

		await new Promise((resolve) => {
			let counter = 0
			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					counter++
					expect(job.variables.foo).toBe('bar')
					const res = job.complete({})
					if (counter === 3) {
						zbc.close()
						resolve(null)
					}
					return res
				},
				inputVariableDto: class {
					foo!: string
				},
				fetchVariables: [],
				timeout: 30000,
			})
			// Wait two seconds to ensure the stream is active
			new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
				zbc.createProcessInstance({
					bpmnProcessId,
					variables: { foo: 'bar' },
				})
				zbc.createProcessInstance({
					bpmnProcessId,
					variables: { foo: 'bar' },
				})
				zbc.createProcessInstance({
					bpmnProcessId,
					variables: { foo: 'bar' },
				})
			})
		})
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Initial poll picks up jobs created before the stream opens',
	async () => {
		const zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })

		// Create 2 process instances BEFORE the stream worker starts.
		// Without the initial poll these would be missed.
		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})
		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})

		await new Promise((resolve) => {
			let counter = 0
			const expectedTotal = 3 // 2 pre-existing + 1 created after stream opens

			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					counter++
					expect(job.variables.foo).toBe('bar')
					const res = job.complete({})
					if (counter === expectedTotal) {
						zbc.close()
						resolve(null)
					}
					return res
				},
				inputVariableDto: class {
					foo!: string
				},
				fetchVariables: [],
				timeout: 30000,
			})

			// Create 1 more after the stream is open to prove streaming still works
			new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
				zbc.createProcessInstance({
					bpmnProcessId,
					variables: { foo: 'bar' },
				})
			})
		})
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'Sidecar poll is accepted and worker still handles jobs',
	async () => {
		const zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })

		// Create a process instance BEFORE the stream worker starts so the
		// initial backfill poll picks it up.
		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})

		await new Promise((resolve) => {
			let counter = 0
			const expectedTotal = 2 // 1 pre-existing + 1 created after stream opens

			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					counter++
					expect(job.variables.foo).toBe('bar')
					const res = job.complete({})
					if (counter === expectedTotal) {
						zbc.close()
						resolve(null)
					}
					return res
				},
				inputVariableDto: class {
					foo!: string
				},
				fetchVariables: [],
				timeout: 30000,
				// Explicitly set sidecar poll parameters
				pollMaxJobsToActivate: 10,
				pollInterval: 3000,
			})

			// Create 1 more after the stream is open
			new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
				zbc.createProcessInstance({
					bpmnProcessId,
					variables: { foo: 'bar' },
				})
			})
		})
	}
)

test.runIf(allowAny([{ deployment: 'saas' }, { deployment: 'self-managed' }]))(
	'A failed complete command rejects instead of resolving as an acknowledgement',
	async () => {
		const zbc = new ZeebeGrpcClient({ config: { CAMUNDA_LOG_LEVEL: 'none' } })

		let alreadyActivated = false
		let threw = false
		const jobTimeout = 10000 // The job is made available for reactivation after this time
		const jobDuration = 15000 // The first invocation takes this long before completing
		// The second invocation completes shortly after the job has been redelivered,
		// by which time the first invocation has already completed it -> NOT_FOUND.
		const secondWorkerDuration = jobDuration - jobTimeout + 5000

		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})

		await new Promise<void>((resolve, reject) => {
			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: async (job) => {
					const delay = alreadyActivated ? secondWorkerDuration : jobDuration
					const shouldThrow = alreadyActivated
					alreadyActivated = true
					try {
						await new Promise((r) => setTimeout(r, delay))
						const res = await job.complete({})
						if (shouldThrow) {
							// Under streaming this used to resolve instead of reject,
							// swallowing the failed complete command.
							reject(new Error('Second complete should have thrown NOT_FOUND'))
						}
						return res
					} catch (e: unknown) {
						expect((e as Error).message.includes('NOT_FOUND')).toBe(true)
						threw = true
						resolve()
						return job.fail({ retries: 0, errorMessage: (e as Error).message })
					}
				},
				inputVariableDto: class {
					foo!: string
				},
				fetchVariables: [],
				timeout: jobTimeout,
			})
		}).finally(() => zbc.close())

		expect(threw).toBe(true)
	},
	40_000
)
