import { EventEmitter } from 'node:events'
import path from 'node:path'

import { Duration } from 'typed-duration'
import debug from 'debug'
import { describe, expect, it, vi } from 'vitest'

import { CamundaSDKConfiguration } from '../../lib/Configuration'
import type { IHeadersProvider } from '../../oauth'
import { GrpcClient, MiddlewareSignals } from '../../zeebe/lib/GrpcClient'
import { StatefulLogInterceptor } from '../../zeebe/lib/StatefulLogInterceptor'

describe('GrpcClient auth failure logging', () => {
	it('redacts token endpoint credentials from application log events', async () => {
		const tokenError = Object.assign(
			new Error(
				'Error requesting token for Client Id zeebe: ' +
					'client_secret=grpc-token-secret'
			),
			{ code: 16 }
		)
		const oAuth: IHeadersProvider = {
			getHeaders: vi.fn().mockRejectedValue(tokenError),
		}
		const client = new GrpcClient({
			config: CamundaSDKConfiguration,
			connectionTolerance: Duration.milliseconds.of(0),
			host: '127.0.0.1:1',
			loglevel: 'ERROR',
			namespace: 'security-test',
			oAuth,
			options: {},
			packageName: 'gateway_protocol',
			protoPath: path.resolve(__dirname, '../../proto/zeebe.proto'),
			service: 'Gateway',
			stdout: {
				debug: vi.fn(),
				info: vi.fn(),
				error: vi.fn(),
			},
			useTLS: false,
		})
		const loggedErrors: unknown[] = []
		client.on(MiddlewareSignals.Log.Error, (message) => {
			loggedErrors.push(message)
		})

		try {
			const activateJobsStream = Reflect.get(client, 'activateJobsStream') as (
				request: Record<string, unknown>
			) => Promise<unknown>
			await activateJobsStream({})

			expect(loggedErrors).toHaveLength(1)
			expect(loggedErrors[0]).toEqual(expect.stringContaining('[REDACTED]'))
			expect(loggedErrors.join('\n')).not.toContain('grpc-token-secret')
		} finally {
			await client.close()
		}
	})

	it('redacts synchronous RPC errors from debug output', async () => {
		const tokenError = Object.assign(
			new Error('client_secret=sync-token-secret'),
			{ code: 14 }
		)
		const oAuth: IHeadersProvider = {
			getHeaders: vi.fn().mockResolvedValue({}),
		}
		const client = new GrpcClient({
			config: CamundaSDKConfiguration,
			connectionTolerance: Duration.milliseconds.of(0),
			host: '127.0.0.1:1',
			loglevel: 'ERROR',
			namespace: 'security-test',
			oAuth,
			options: {},
			packageName: 'gateway_protocol',
			protoPath: path.resolve(__dirname, '../../proto/zeebe.proto'),
			service: 'Gateway',
			stdout: {
				debug: vi.fn(),
				info: vi.fn(),
				error: vi.fn(),
			},
			useTLS: false,
		})
		const methodName = client
			.listMethods()
			.find((name) => name.toLowerCase() === 'topology')
		if (!methodName) {
			throw new Error('Gateway Topology RPC was not loaded')
		}
		Reflect.set(
			client.client,
			methodName,
			(
				_request: unknown,
				_metadata: unknown,
				callback: (error: Error, response?: unknown) => void
			) => callback(tokenError)
		)

		const previousNamespaces = debug.disable()
		const stderrWrite = vi
			.spyOn(process.stderr, 'write')
			.mockImplementation(() => true)
		debug.enable('camunda:grpc')
		try {
			const topologySync = Reflect.get(client, `${methodName}Sync`) as (
				request: Record<string, unknown>
			) => Promise<unknown>
			await expect(topologySync({})).rejects.toBe(tokenError)

			const output = stderrWrite.mock.calls
				.map(([chunk]) => chunk.toString())
				.join('')
			expect(output).not.toContain('sync-token-secret')
			expect(output).toContain('[REDACTED]')
		} finally {
			stderrWrite.mockRestore()
			debug.enable(previousNamespaces)
			await client.close()
		}
	})

	it('redacts streamed gRPC status details and metadata from debug output', async () => {
		const oAuth: IHeadersProvider = {
			getHeaders: vi.fn().mockResolvedValue({}),
		}
		const client = new GrpcClient({
			config: CamundaSDKConfiguration,
			connectionTolerance: Duration.milliseconds.of(0),
			host: '127.0.0.1:1',
			loglevel: 'ERROR',
			namespace: 'security-test',
			oAuth,
			options: {},
			packageName: 'gateway_protocol',
			protoPath: path.resolve(__dirname, '../../proto/zeebe.proto'),
			service: 'Gateway',
			stdout: {
				debug: vi.fn(),
				info: vi.fn(),
				error: vi.fn(),
			},
			useTLS: false,
		})
		const stream = Object.assign(new EventEmitter(), { destroy: vi.fn() })
		const methodName = client
			.listMethods()
			.find((name) => name.toLowerCase() === 'activatejobs')
		if (!methodName) {
			throw new Error('Gateway ActivateJobs RPC was not loaded')
		}
		Reflect.set(client.client, methodName, () => stream)

		const debugOutput: string[] = []
		const log = new StatefulLogInterceptor({
			characteristics: { _tag: 'VANILLA', startupTime: 0 },
			logConfig: {
				_tag: 'GRPCMIDDLEWARE',
				colorise: false,
				loglevel: 'DEBUG',
				namespace: 'security-test',
				stdout: {
					debug: vi.fn(),
					info: (message: string) => debugOutput.push(message),
					error: vi.fn(),
				},
			},
		})
		client.on(MiddlewareSignals.Log.Debug, log.logDebug)

		try {
			const activateJobsStream = Reflect.get(client, `${methodName}Stream`) as (
				request: Record<string, unknown>
			) => Promise<unknown>
			await activateJobsStream({})
			stream.emit('metadata', {
				authorization: 'Bearer metadata-token-secret',
			})
			stream.emit('status', {
				code: 14,
				details: 'client_secret=status-token-secret',
				metadata: {},
			})

			const output = debugOutput.join('\n')
			expect(output).not.toContain('metadata-token-secret')
			expect(output).not.toContain('status-token-secret')
			expect(output).toContain('[REDACTED]')
		} finally {
			log.close()
			await client.close()
		}
	})
})
