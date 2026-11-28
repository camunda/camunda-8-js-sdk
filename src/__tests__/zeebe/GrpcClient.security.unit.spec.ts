import path from 'node:path'

import { Duration } from 'typed-duration'
import { describe, expect, it, vi } from 'vitest'

import { CamundaSDKConfiguration } from '../../lib/Configuration'
import type { IHeadersProvider } from '../../oauth'
import { GrpcClient, MiddlewareSignals } from '../../zeebe/lib/GrpcClient'

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
})
