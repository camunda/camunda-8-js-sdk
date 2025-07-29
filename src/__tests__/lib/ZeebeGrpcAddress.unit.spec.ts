import { CamundaEnvironmentConfigurator } from '../../lib/Configuration'

describe('ZEEBE_GRPC_ADDRESS Support', () => {
	describe('Current behavior preservation', () => {
		it('should set default ZEEBE_GRPC_ADDRESS when neither ZEEBE_ADDRESS nor ZEEBE_GRPC_ADDRESS are set', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
				{}
			)
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpc://localhost:26500')
			expect(config.ZEEBE_ADDRESS).toBeUndefined()
		})

		it('should use ZEEBE_ADDRESS when explicitly set', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_ADDRESS: 'localhost:26500',
			})
			expect(config.ZEEBE_ADDRESS).toBe('localhost:26500')
			expect(config.ZEEBE_GRPC_ADDRESS).toBeUndefined()
		})

		it('should use ZEEBE_GRPC_ADDRESS when explicitly set', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpc://localhost:26500',
			})
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpc://localhost:26500')
		})

		it('should handle both ZEEBE_ADDRESS and ZEEBE_GRPC_ADDRESS when explicitly set', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_ADDRESS: 'address:26500',
				ZEEBE_GRPC_ADDRESS: 'grpc-address:26500',
			})
			expect(config.ZEEBE_ADDRESS).toBe('address:26500')
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpc-address:26500')
		})

		it('should handle TLS configuration with CAMUNDA_SECURE_CONNECTION', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpcs://localhost:26500',
				CAMUNDA_SECURE_CONNECTION: true,
			})
			expect(config.CAMUNDA_SECURE_CONNECTION).toBe(true)
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpcs://localhost:26500')
		})

		it('should handle TLS configuration with ZEEBE_INSECURE_CONNECTION', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpcs://localhost:26500',
				zeebeGrpcSettings: {
					ZEEBE_INSECURE_CONNECTION: true,
				},
			})
			expect(config.zeebeGrpcSettings.ZEEBE_INSECURE_CONNECTION).toBe(true)
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpcs://localhost:26500')
		})
	})

	describe('New ZEEBE_GRPC_ADDRESS validation', () => {
		it('should validate ZEEBE_GRPC_ADDRESS format with grpc:// protocol', () => {
			expect(() => {
				CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
					ZEEBE_GRPC_ADDRESS: 'grpc://localhost:26500',
				})
			}).not.toThrow()
		})

		it('should validate ZEEBE_GRPC_ADDRESS format with grpcs:// protocol', () => {
			expect(() => {
				CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
					ZEEBE_GRPC_ADDRESS: 'grpcs://localhost:26500',
				})
			}).not.toThrow()
		})

		it('should throw error for invalid ZEEBE_GRPC_ADDRESS format', () => {
			expect(() => {
				CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
					ZEEBE_GRPC_ADDRESS: 'http://localhost:26500',
				})
			}).toThrow(
				/ZEEBE_GRPC_ADDRESS must contain either grpc:\/\/ or grpcs:\/\//
			)
		})

		it('should preserve ZEEBE_GRPC_ADDRESS with protocol', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpcs://remote:26500',
			})
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpcs://remote:26500')
		})
	})

	describe('Warning system', () => {
		let consoleWarnSpy: jest.SpyInstance

		beforeEach(() => {
			consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()
		})

		afterEach(() => {
			consoleWarnSpy.mockRestore()
		})

		it('should warn when ZEEBE_GRPC_ADDRESS conflicts with legacy settings', () => {
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpcs://localhost:26500',
				ZEEBE_ADDRESS: 'localhost:26500',
				zeebeGrpcSettings: {
					ZEEBE_INSECURE_CONNECTION: true,
				},
				CAMUNDA_SECURE_CONNECTION: false,
			})

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('ZEEBE_GRPC_ADDRESS is set')
			)
		})

		it('should emit deprecation warnings for ZEEBE_INSECURE_CONNECTION', () => {
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				zeebeGrpcSettings: {
					ZEEBE_INSECURE_CONNECTION: true,
				},
			})

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('ZEEBE_INSECURE_CONNECTION is deprecated')
			)
		})

		it('should emit deprecation warnings for CAMUNDA_SECURE_CONNECTION', () => {
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				CAMUNDA_SECURE_CONNECTION: false,
			})

			expect(consoleWarnSpy).toHaveBeenCalledWith(
				expect.stringContaining('CAMUNDA_SECURE_CONNECTION is deprecated')
			)
		})
	})

	describe('Protocol-based address handling', () => {
		it('should handle grpcs:// protocol correctly', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpcs://localhost:26500',
			})
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpcs://localhost:26500')
		})

		it('should handle grpc:// protocol correctly', () => {
			const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment({
				ZEEBE_GRPC_ADDRESS: 'grpc://localhost:26500',
			})
			expect(config.ZEEBE_GRPC_ADDRESS).toBe('grpc://localhost:26500')
		})
	})
})
