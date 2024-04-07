import { AdminApiClient } from '../admin'
import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
} from '../lib'
import { ModelerApiClient } from '../modeler'
import { OAuthProvider } from '../oauth'
import { OperateApiClient } from '../operate'
import { OptimizeApiClient } from '../optimize'
import { TasklistApiClient } from '../tasklist'
import { ZeebeGrpcClient } from '../zeebe'

/**
 * A single point of configuration for all Camunda Platform 8 clients.
 *
 * This class is a facade for all the clients in the Camunda Platform 8 SDK.
 *
 * @example
 * ```typescript
 * import { Camunda8 } from '@camunda8/sdk'
 *
 * const c8 = new Camunda8()
 * const zeebe = c8.getZeebeGrpcClient()
 * const operate = c8.getOperateApiClient()
 * const optimize = c8.getOptimizeApiClient()
 * const tasklist = c8.getTasklistApiClient()
 * const modeler = c8.getModelerApiClient()
 * const admin = c8.getAdminApiClient()
 * ```
 */
export class Camunda8 {
	private operateApiClient?: OperateApiClient
	private adminApiClient?: AdminApiClient
	private modelerApiClient?: ModelerApiClient
	private optimizeApiClient?: OptimizeApiClient
	private tasklistApiClient?: TasklistApiClient
	private zeebeGrpcClient?: ZeebeGrpcClient
	private configuration: CamundaPlatform8Configuration
	private oAuthProvider?: OAuthProvider

	constructor(config: DeepPartial<CamundaPlatform8Configuration> = {}) {
		this.configuration =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config)
		// Respect Oauth disabled flag
		if (!this.configuration.CAMUNDA_OAUTH_DISABLED) {
			this.oAuthProvider = new OAuthProvider({ config: this.configuration })
		}
	}

	public getOperateApiClient(): OperateApiClient {
		if (!this.operateApiClient) {
			this.operateApiClient = new OperateApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.operateApiClient
	}

	public getAdminApiClient(): AdminApiClient {
		if (!this.adminApiClient) {
			this.adminApiClient = new AdminApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.adminApiClient
	}

	public getModelerApiClient(): ModelerApiClient {
		if (!this.modelerApiClient) {
			this.modelerApiClient = new ModelerApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.modelerApiClient
	}

	public getOptimizeApiClient(): OptimizeApiClient {
		if (!this.optimizeApiClient) {
			this.optimizeApiClient = new OptimizeApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.optimizeApiClient
	}

	public getTasklistApiClient(): TasklistApiClient {
		if (!this.tasklistApiClient) {
			this.tasklistApiClient = new TasklistApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.tasklistApiClient
	}

	public getZeebeGrpcApiClient(): ZeebeGrpcClient {
		if (!this.zeebeGrpcClient) {
			this.zeebeGrpcClient = new ZeebeGrpcClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.zeebeGrpcClient
	}
}
