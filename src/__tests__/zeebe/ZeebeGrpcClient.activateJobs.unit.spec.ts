import { EventEmitter } from 'events'

import { afterEach, describe, expect, it, vi } from 'vitest'

import type * as ZB from '../../zeebe/lib/interfaces-1.0'
import { ZeebeGrpcClient } from '../../zeebe/zb/ZeebeGrpcClient'

type MutableClient = {
	grpc: Promise<ZB.ZBGrpc>
	tenantId?: string
}

/**
 * Creates a stream stub that immediately ends with no jobs, so `activateJobs`
 * resolves without touching the network.
 */
function makeEmptyStream() {
	const stream = new EventEmitter() as EventEmitter & { error?: Error }
	setImmediate(() => stream.emit('end'))
	return stream
}

function makeClientWithStubbedGrpc(tenantId?: string) {
	const activateJobsStream = vi.fn<
		(
			req: Parameters<ZB.ZBGrpc['activateJobsStream']>[0]
		) => Promise<EventEmitter>
	>(async () => makeEmptyStream())
	const client = new ZeebeGrpcClient({
		config: {
			CAMUNDA_OAUTH_DISABLED: true,
			ZEEBE_GRPC_ADDRESS: 'localhost:26500',
			zeebeGrpcSettings: { ZEEBE_CLIENT_LOG_LEVEL: 'NONE' },
		},
	})
	const mutable = client as unknown as MutableClient
	// The constructor eagerly creates a real gRPC client. Retain its promise so
	// teardown can close the underlying channel instead of leaking it.
	const realGrpc = mutable.grpc
	// Set the configured tenant explicitly so the test is independent of the
	// environment's CAMUNDA_TENANT_ID default.
	mutable.tenantId = tenantId
	mutable.grpc = Promise.resolve({
		activateJobsStream,
		close: async () => undefined,
		removeAllListeners: () => undefined,
	} as unknown as ZB.ZBGrpc)
	return { client, activateJobsStream, realGrpc }
}

describe('ZeebeGrpcClient.activateJobs tenantIds', () => {
	let client: ZeebeGrpcClient | undefined
	let realGrpc: Promise<ZB.ZBGrpc> | undefined

	afterEach(async () => {
		if (client) {
			await client.close().catch(() => undefined)
			client = undefined
		}
		if (realGrpc) {
			// Close the real gRPC client the constructor created so its channel
			// and pending waitForReady connection attempt do not leak.
			await realGrpc.then((grpc) => grpc.close()).catch(() => undefined)
			realGrpc = undefined
		}
	})

	it('forwards the caller-supplied tenantIds', async () => {
		const stub = makeClientWithStubbedGrpc('configured-tenant')
		client = stub.client
		realGrpc = stub.realGrpc

		await client.activateJobs({
			type: 'test-job',
			maxJobsToActivate: 1,
			timeout: 1000,
			requestTimeout: 1000,
			worker: 'test',
			tenantIds: ['tenant-a', 'tenant-b'],
		})

		expect(stub.activateJobsStream).toHaveBeenCalledTimes(1)
		expect(stub.activateJobsStream.mock.calls[0][0].tenantIds).toEqual([
			'tenant-a',
			'tenant-b',
		])
	})

	it('falls back to the configured tenantId when none is supplied', async () => {
		const stub = makeClientWithStubbedGrpc('configured-tenant')
		client = stub.client
		realGrpc = stub.realGrpc

		await client.activateJobs({
			type: 'test-job',
			maxJobsToActivate: 1,
			timeout: 1000,
			requestTimeout: 1000,
			worker: 'test',
		})

		expect(stub.activateJobsStream.mock.calls[0][0].tenantIds).toEqual([
			'configured-tenant',
		])
	})

	it('sends an empty array when no tenant is configured or supplied', async () => {
		const stub = makeClientWithStubbedGrpc(undefined)
		client = stub.client
		realGrpc = stub.realGrpc

		await client.activateJobs({
			type: 'test-job',
			maxJobsToActivate: 1,
			timeout: 1000,
			requestTimeout: 1000,
			worker: 'test',
		})

		expect(stub.activateJobsStream.mock.calls[0][0].tenantIds).toEqual([])
	})
})
