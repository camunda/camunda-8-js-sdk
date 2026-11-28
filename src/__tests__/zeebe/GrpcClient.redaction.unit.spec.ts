import path from 'node:path'

import d from 'debug'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CamundaEnvironmentConfigurator } from '../../lib/Configuration'
import { MockStdOut } from '../../zeebe/lib/MockStdOut'
import { GrpcClient, MiddlewareSignals } from '../../zeebe/lib/GrpcClient'

const protoPath = path.join(__dirname, '..', '..', 'proto', 'zeebe.proto')

function createTestGrpcClient(
	getHeaders: () => Promise<Record<string, string>>
) {
	const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
		CAMUNDA_OAUTH_DISABLED: false,
		ZEEBE_GRPC_ADDRESS: 'localhost:26500',
	})
	return new GrpcClient({
		config,
		connectionTolerance: 1000,
		host: 'localhost:26500',
		loglevel: 'NONE',
		namespace: 'ZEEBE',
		oAuth: { getHeaders },
		options: {},
		packageName: 'gateway_protocol',
		protoPath,
		service: 'Gateway',
		stdout: new MockStdOut(),
		useTLS: false,
	})
}

describe('GrpcClient error redaction', () => {
	const clients: GrpcClient[] = []

	afterEach(async () => {
		for (const client of clients) {
			await client.close().catch(() => undefined)
		}
		clients.length = 0
		vi.restoreAllMocks()
		d.disable()
	})

	it('redacts OAuth header-retrieval errors on activateJobsStream while returning the original error', async () => {
		const secretError = new Error(
			'OAuth token fetch failed: ZEEBE_CLIENT_SECRET=oauth-stream-secret Bearer oauth-stream-bearer'
		)
		const client = createTestGrpcClient(() => Promise.reject(secretError))
		clients.push(client)

		const emittedErrors: unknown[] = []
		client.on(MiddlewareSignals.Log.Error, (err) => emittedErrors.push(err))

		const debugLines: string[] = []
		d.enable('camunda:grpc')
		vi.spyOn(d, 'log').mockImplementation((...args: unknown[]) => {
			debugLines.push(args.map((arg) => String(arg)).join(' '))
		})

		const activateJobsStream = (
			client as unknown as {
				activateJobsStream: (req: unknown) => Promise<{ error?: unknown }>
			}
		).activateJobsStream

		const result = await activateJobsStream({
			type: 'test-job',
			worker: 'test-worker',
			maxJobsToActivate: 1,
			timeout: 1000,
			requestTimeout: 1000,
		})

		expect(result.error).toBe(secretError)
		expect(emittedErrors).toHaveLength(1)
		const emittedText = JSON.stringify(emittedErrors[0])
		expect(emittedText).not.toContain('oauth-stream-secret')
		expect(emittedText).not.toContain('oauth-stream-bearer')
		expect(emittedText).toContain('[REDACTED]')

		const streamDebug = debugLines.find((line) =>
			line.includes('activateJobsStream error')
		)
		expect(streamDebug).toBeDefined()
		expect(streamDebug).not.toContain('oauth-stream-secret')
		expect(streamDebug).not.toContain('oauth-stream-bearer')
		expect(streamDebug).toContain('[REDACTED]')
	})

	it('redacts unary callback errors in debug logs while rejecting with the original error', async () => {
		const client = createTestGrpcClient(async () => ({}))
		clients.push(client)

		const callbackError = Object.assign(
			new Error(
				'16 UNAUTHENTICATED: client_secret=unary-secret Bearer unary-bearer'
			),
			{ code: 16 }
		)
		const underlying = client.client as unknown as {
			topology: (
				req: unknown,
				md: unknown,
				cb: (err: unknown, res?: unknown) => void
			) => void
		}
		underlying.topology = (_req, _md, cb) => cb(callbackError)

		const debugLines: string[] = []
		d.enable('camunda:grpc')
		vi.spyOn(d, 'log').mockImplementation((...args: unknown[]) => {
			debugLines.push(args.map((arg) => String(arg)).join(' '))
		})

		const topologySync = (
			client as unknown as {
				topologySync: (req: Record<string, never>) => Promise<unknown>
			}
		).topologySync

		await expect(topologySync({})).rejects.toBe(callbackError)

		const joinedDebug = debugLines.join('\n')
		expect(joinedDebug).toContain('topologySync error: 16')
		expect(joinedDebug).not.toContain('unary-secret')
		expect(joinedDebug).not.toContain('unary-bearer')
		expect(joinedDebug).toContain('[REDACTED]')
	})
})
