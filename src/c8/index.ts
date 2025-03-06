import { AdminApiClient } from '../admin'
import {
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	constructOAuthProvider,
} from '../lib'
import { ModelerApiClient } from '../modeler'
import { IOAuthProvider } from '../oauth'
import { OperateApiClient } from '../operate'
import { OptimizeApiClient } from '../optimize'
import { TasklistApiClient } from '../tasklist'
import { ZeebeGrpcClient, ZeebeRestClient } from '../zeebe'

import { getLogger, Logger } from './lib/C8Logger'
import { CamundaRestClient } from './lib/CamundaRestClient'

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
 * const zeebe = c8.getZeebeGrpcApiClient()
 * const operate = c8.getOperateApiClient()
 * const optimize = c8.getOptimizeApiClient()
 * const tasklist = c8.getTasklistApiClient()
 * const modeler = c8.getModelerApiClient()
 * const admin = c8.getAdminApiClient()
 * const c8Rest = c8.getCamundaRestClient()
 * ```
 */
export class Camunda8 {
	private operateApiClient?: OperateApiClient
	private adminApiClient?: AdminApiClient
	private modelerApiClient?: ModelerApiClient
	private optimizeApiClient?: OptimizeApiClient
	private tasklistApiClient?: TasklistApiClient
	private zeebeGrpcApiClient?: ZeebeGrpcClient
	private zeebeRestClient?: ZeebeRestClient
	private configuration: CamundaPlatform8Configuration
	private oAuthProvider: IOAuthProvider
	private camundaRestClient?: CamundaRestClient
	public log: Logger

	/**
	 * All constructor parameters for configuration are optional. If no configuration is provided, the SDK will use environment variables to configure itself.
	 */
	constructor(config: Camunda8ClientConfiguration = {}) {
		this.configuration =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config)
		this.oAuthProvider = constructOAuthProvider(this.configuration)
		this.log = getLogger(config)
		this.log.debug('Camunda8 SDK initialized')
	}

	public getOperateApiClient(
		config: Camunda8ClientConfiguration = {}
	): OperateApiClient {
		if (!this.operateApiClient) {
			this.operateApiClient = new OperateApiClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.operateApiClient
	}

	public getAdminApiClient(
		config: Camunda8ClientConfiguration = {}
	): AdminApiClient {
		if (!this.adminApiClient) {
			this.adminApiClient = new AdminApiClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.adminApiClient
	}

	public getModelerApiClient(
		config: Camunda8ClientConfiguration = {}
	): ModelerApiClient {
		if (!this.modelerApiClient) {
			this.modelerApiClient = new ModelerApiClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.modelerApiClient
	}

	public getOptimizeApiClient(
		config: Camunda8ClientConfiguration = {}
	): OptimizeApiClient {
		if (!this.optimizeApiClient) {
			this.optimizeApiClient = new OptimizeApiClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.optimizeApiClient
	}

	public getTasklistApiClient(
		config: Camunda8ClientConfiguration = {}
	): TasklistApiClient {
		if (!this.tasklistApiClient) {
			this.tasklistApiClient = new TasklistApiClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.tasklistApiClient
	}

	public getZeebeGrpcApiClient(
		config: Camunda8ClientConfiguration = {}
	): ZeebeGrpcClient {
		if (!this.zeebeGrpcApiClient) {
			this.zeebeGrpcApiClient = new ZeebeGrpcClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.zeebeGrpcApiClient
	}

	/**
	 * @deprecated from 8.6.0. Please use getCamundaRestClient() instead.
	 */
	public getZeebeRestClient(
		config: Camunda8ClientConfiguration = {}
	): ZeebeRestClient {
		if (!this.zeebeRestClient) {
			this.zeebeRestClient = new ZeebeRestClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.zeebeRestClient
	}

	public getCamundaRestClient(
		config: Camunda8ClientConfiguration = {}
	): CamundaRestClient {
		if (!this.camundaRestClient) {
			this.camundaRestClient = new CamundaRestClient({
				config: { ...this.configuration, ...config },
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.camundaRestClient
	}
}
