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
 * This class is a factory for all the clients in the Camunda Platform 8 SDK. It allows a single point of configuration for all clients.
 *
 * @example
 * ```typescript
 * import { Camunda8 } from '@camunda8/sdk'
 *
 * const c8 = new Camunda8()
 * const c8Rest = c8.getCamundaRestClient()
 * const zeebe = c8.getZeebeGrpcApiClient()
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
	private zeebeGrpcApiClient?: ZeebeGrpcClient
	private zeebeRestClient?: ZeebeRestClient
	private configuration: CamundaPlatform8Configuration
	private oAuthProvider: IOAuthProvider
	private camundaRestClient?: CamundaRestClient
	public log: Logger

	/**
	 * All constructor parameters for configuration are optional. If no configuration is provided, the SDK will use environment variables to configure itself.
	 * See {@link CamundaSDKConfiguration} for the complete list of configuration parameters. Values can be passed in explicitly in code, or set via environment variables (recommended: separate configuration and application logic).
	 * Explicitly set values will override environment variables, which are merged into the configuration.
	 */

	constructor(
		/**
		 * Optional explicit overrides. With no configuration, the SDK will use environment variables to configure itself.
		 */
		config: Camunda8ClientConfiguration & {
			/**
			 * An optional {@link IOAuthProvider} implementation. This can be used to add headers to REST requests made by the SDK.
			 * In most cases, you will not need to supply this. You can use `CAMUNDA_AUTH_STRATEGY` and appropriate config values to configure
			 * a preconfigured auth strategy. This configuration parameter is provided for advanced use-cases.
			 **/
			oAuthProvider?: IOAuthProvider
		} = {}
	) {
		this.configuration =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config)
		// Allow custom oAuthProvider to be passed in.
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/448
		this.oAuthProvider =
			config.oAuthProvider ?? constructOAuthProvider(this.configuration)
		this.log = getLogger(config)
		this.log.debug('Camunda8 SDK initialized')
	}

	/**
	 * Returns a client for the "Operate REST API"
	 * See: https://docs.camunda.io/docs/apis-tools/operate-api/overview/
	 */
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

	/**
	 * Returns a client for the Administration REST API
	 * See: https://docs.camunda.io/docs/apis-tools/administration-api/administration-api-reference/
	 */
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

	/**
	 * Returns a client for the Web Modeler REST API
	 * See: https://docs.camunda.io/docs/apis-tools/web-modeler-api/overview/
	 */
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

	/**
	 * Returns a client for the Optimize REST API
	 * See: https://docs.camunda.io/docs/apis-tools/optimize-api/overview/
	 */
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

	/**
	 * Returns a client for the Tasklist REST API
	 * See: https://docs.camunda.io/docs/apis-tools/tasklist-api-rest/tasklist-api-rest-overview/
	 */
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

	/**
	 * Returns a client for the Zeebe gRPC API
	 * See: https://docs.camunda.io/docs/apis-tools/zeebe-api/overview/
	 */
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

	/**
	 * Returns a client for the Camunda 8 REST API
	 * See: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/camunda-api-rest-overview/
	 */
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
