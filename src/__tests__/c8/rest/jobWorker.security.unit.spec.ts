import PCancelable from 'p-cancelable'
import { describe, expect, it, vi } from 'vitest'

import type { ActivatedJob } from '../../../c8/lib/C8Dto'
import type { CamundaJobWorkerConfig } from '../../../c8/lib/CamundaJobWorker'
import { CamundaRestClient } from '../../../c8/lib/CamundaRestClient'
import type { Logger } from '../../../c8/lib/C8Logger'
import { LosslessDto } from '../../../lib'

const ACKNOWLEDGEMENT = 'JOB_ACTION_ACKNOWLEDGEMENT' as const

type CapturedLog = {
	level: string
	message: string | undefined
	metadata: unknown[]
}

function createMemoryLogger() {
	const calls: CapturedLog[] = []
	const record =
		(level: CapturedLog['level']) =>
		(message: string | undefined, ...metadata: unknown[]) => {
			calls.push({ level, message, metadata })
		}
	const logger: Logger = {
		info: record('info'),
		warn: record('warn'),
		error: record('error'),
		debug: record('debug'),
		trace: record('trace'),
	}

	return { calls, logger }
}

function createJobHandlerWorker(
	logger: Logger,
	jobHandler: CamundaJobWorkerConfig<LosslessDto, LosslessDto>['jobHandler']
) {
	const restClient = new CamundaRestClient({
		config: { CAMUNDA_LOG_LEVEL: 'none' },
	})
	const worker = restClient.createJobWorker({
		type: 'test-job',
		worker: 'test-worker',
		maxJobsToActivate: 1,
		timeout: 1000,
		pollIntervalMs: 60_000,
		autoStart: false,
		jobHandler,
		logger,
	})

	return { restClient, worker }
}

function createActivatedJob() {
	const fail = vi.fn(async () => ACKNOWLEDGEMENT)
	const job: ActivatedJob<LosslessDto, LosslessDto> = {
		jobKey: 'job-1',
		type: 'test-job',
		processInstanceKey: 'process-1',
		bpmnProcessId: 'test-process',
		processDefinitionVersion: 1,
		elementId: 'service-task',
		elementInstanceKey: 'element-1',
		customHeaders: new LosslessDto(),
		worker: 'test-worker',
		retries: 3,
		deadline: '0',
		variables: new LosslessDto(),
		tenantId: 'tenant-1',
		cancelWorkflow: async () => ACKNOWLEDGEMENT,
		complete: async () => ACKNOWLEDGEMENT,
		fail,
		forward: () => ACKNOWLEDGEMENT,
		error: async () => ACKNOWLEDGEMENT,
		modifyJobTimeout: async () => '0',
	}

	return { fail, job }
}

describe('REST job worker error logging', () => {
	it('redacts handler messages and stacks while still failing the job', async () => {
		const memoryLogger = createMemoryLogger()
		const { restClient, worker } = createJobHandlerWorker(
			memoryLogger.logger,
			() => {
				throw new Error(
					'Handler failed with bearer token-value and basic credentials'
				)
			}
		)
		const { fail, job } = createActivatedJob()
		const activePoll = new PCancelable<
			ActivatedJob<LosslessDto, LosslessDto>[]
		>((resolve) => resolve([job]))
		vi.spyOn(restClient, 'activateJobs').mockReturnValue(activePoll)

		worker.start()
		try {
			await vi.waitFor(() => expect(fail).toHaveBeenCalledOnce())
			await vi.waitFor(() => expect(worker.currentlyActiveJobCount).toBe(0))

			expect(fail).toHaveBeenCalledWith({
				errorMessage: expect.stringContaining('[REDACTED]'),
				retries: 2,
			})

			const errorLog = memoryLogger.calls.find(
				(call) =>
					call.level === 'error' && call.message?.includes('Handler failed')
			)
			expect(errorLog?.message).toContain('[REDACTED]')
			expect(errorLog?.metadata[0]).toMatchObject({
				error: expect.stringContaining('[REDACTED]'),
				stack: expect.stringContaining('[REDACTED]'),
			})

			const output = JSON.stringify({
				logs: memoryLogger.calls,
				failures: fail.mock.calls,
			})
			expect(output).not.toContain('token-value')
			expect(output).not.toContain('credentials')
		} finally {
			await worker.stop()
		}
	})

	it('fails a job when its handler throws an uncoercible non-Error value', async () => {
		const memoryLogger = createMemoryLogger()
		const uncoercibleValue: object = Object.create(null)
		const { restClient, worker } = createJobHandlerWorker(
			memoryLogger.logger,
			() => {
				throw uncoercibleValue
			}
		)
		const { fail, job } = createActivatedJob()
		const activePoll = new PCancelable<
			ActivatedJob<LosslessDto, LosslessDto>[]
		>((resolve) => resolve([job]))
		vi.spyOn(restClient, 'activateJobs').mockReturnValue(activePoll)

		worker.start()
		try {
			await vi.waitFor(() => expect(fail).toHaveBeenCalledOnce())
			await vi.waitFor(() => expect(worker.currentlyActiveJobCount).toBe(0))

			expect(fail).toHaveBeenCalledWith({
				errorMessage: '[Unserializable error]',
				retries: 2,
			})
		} finally {
			await worker.stop()
		}
	})

	it('redacts cancellation failures from the log message and metadata', async () => {
		const memoryLogger = createMemoryLogger()
		const { restClient, worker } = createJobHandlerWorker(
			memoryLogger.logger,
			() => ACKNOWLEDGEMENT
		)
		const activePoll = new PCancelable<
			ActivatedJob<LosslessDto, LosslessDto>[]
		>(() => {})
		const cancellationError = new Error(
			'Cancel failed with bearer cancel-token and basic cancel-credentials'
		)
		const cancel = vi.spyOn(activePoll, 'cancel').mockImplementation(() => {
			throw cancellationError
		})
		vi.spyOn(restClient, 'activateJobs').mockReturnValue(activePoll)

		worker.start()
		await worker.stop()

		expect(cancel).toHaveBeenCalledOnce()
		const cancellationLog = memoryLogger.calls.find(
			(call) => call.message?.startsWith('Error while cancelling active poll:')
		)
		expect(cancellationLog?.message).toContain('[REDACTED]')
		expect(cancellationLog?.metadata[0]).toMatchObject({
			error: expect.stringContaining('[REDACTED]'),
		})

		const output = JSON.stringify(memoryLogger.calls)
		expect(output).not.toContain('cancel-token')
		expect(output).not.toContain('cancel-credentials')
	})
})
