import { CamundaEnvironmentConfigurator } from '../../../lib/Configuration'
import { allowAny } from '../../../test-support/testTags'
import { buildGrpcChannelOptions } from '../../../zeebe/lib/GrpcClient'

import { streamConformanceRegistry } from './registry'
import { ScenarioName, runScenario, scenarios } from './scenarios'

/**
 * Conformance suite for every streaming operation of the Zeebe client.
 *
 * The registry is typed so that it has exactly one entry per streaming
 * operation (see registry.ts); this file runs the shared scenarios against each
 * entry. A stream whose failure is not observable by the caller and recovered
 * does not pass.
 */
describe.runIf(allowAny([{ deployment: 'unit-test' }]))(
	'stream conformance',
	() => {
		describe.each(Object.entries(streamConformanceRegistry))(
			'%s',
			(_op, testCase) => {
				test.each(Object.keys(scenarios) as ScenarioName[])(
					'%s',
					async (name) => {
						await runScenario(name, testCase)
					}
				)

				test('silent hang: detected by HTTP/2 keepalive pings, which are configured', () => {
					// A connection that goes silent produces no stream event, so no
					// handler can see it. The transport has to notice: the SDK sets
					// HTTP/2 keepalive pings on every channel, and a connection that
					// does not acknowledge a ping is closed, which then arrives as a
					// stream `error`, which the other scenarios cover.
					expect(testCase.hang.mechanism).toBe('grpc-keepalive')
					const { zeebeGrpcSettings } =
						CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({})
					const options = buildGrpcChannelOptions(zeebeGrpcSettings)
					expect(options['grpc.keepalive_time_ms']).toBeGreaterThan(0)
					expect(options['grpc.keepalive_timeout_ms']).toBeGreaterThan(0)
					expect(options['grpc.keepalive_permit_without_calls']).toBe(1)
				})
			}
		)
	}
)
