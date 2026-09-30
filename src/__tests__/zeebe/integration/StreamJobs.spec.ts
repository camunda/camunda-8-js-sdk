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
			const completions: Promise<unknown>[] = []
			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					counter++
					expect(job.variables.foo).toBe('bar')
					const res = job.complete({})
					completions.push(res)
					if (counter === 3) {
						// Wait for every completion to reach the broker before closing,
						// otherwise the client shuts down with jobs still active and
						// they leak into later tests.
						Promise.all(completions)
							.then(() => zbc.close())
							.then(() => resolve(null))
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
			const completions: Promise<unknown>[] = []
			const expectedTotal = 3 // 2 pre-existing + 1 created after stream opens

			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					counter++
					expect(job.variables.foo).toBe('bar')
					const res = job.complete({})
					completions.push(res)
					if (counter === expectedTotal) {
						// Wait for every completion to reach the broker before closing,
						// otherwise the client shuts down with jobs still active and
						// they leak into later tests.
						Promise.all(completions)
							.then(() => zbc.close())
							.then(() => resolve(null))
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
			const completions: Promise<unknown>[] = []
			const expectedTotal = 2 // 1 pre-existing + 1 created after stream opens

			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: (job) => {
					counter++
					expect(job.variables.foo).toBe('bar')
					const res = job.complete({})
					completions.push(res)
					if (counter === expectedTotal) {
						// Wait for every completion to reach the broker before closing,
						// otherwise the client shuts down with jobs still active and
						// they leak into later tests.
						Promise.all(completions)
							.then(() => zbc.close())
							.then(() => resolve(null))
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

		await zbc.createProcessInstance({
			bpmnProcessId,
			variables: { foo: 'bar' },
		})

		const secondComplete = await new Promise<unknown>((resolve, reject) => {
			zbc.streamJobs({
				type: 'stream-job',
				worker: 'test-worker',
				tenantIds: ['<default>'],
				taskHandler: async (job) => {
					const res = await job.complete({})
					// The job no longer exists on the broker, so completing it again
					// must reject with NOT_FOUND. Under streaming this used to resolve
					// as an acknowledgement, swallowing the failed complete command.
					try {
						await job.complete({})
						reject(new Error('Second complete should have thrown NOT_FOUND'))
					} catch (e: unknown) {
						resolve(e)
					}
					return res
				},
				inputVariableDto: class {
					foo!: string
				},
				fetchVariables: [],
				timeout: 30000,
			})
		}).finally(() => zbc.close())

		expect((secondComplete as Error).message).toContain('NOT_FOUND')
	}
)
