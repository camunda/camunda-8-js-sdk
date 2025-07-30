import { AdminApiClient } from '../admin'
import {
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	constructOAuthProvider,
} from '../lib'
import { ModelerApiClient } from '../modeler'
import { IHeadersProvider } from '../oauth'
import { OperateApiClient } from '../operate'
import { OptimizeApiClient } from '../optimize'
import { TasklistApiClient } from '../tasklist'
import { ZeebeGrpcClient, ZeebeRestClient } from '../zeebe'

import { getLogger, Logger } from './lib/C8Logger'
import { CamundaRestClient } from './lib/CamundaRestClient'

// Union type for all API clients
type ApiClient =
	| ZeebeGrpcClient
	| CamundaRestClient
	| OperateApiClient
	| TasklistApiClient
	| OptimizeApiClient
	| AdminApiClient
	| ModelerApiClient
	| ZeebeRestClient

/** Options interface for client creation */
interface ClientOptions {
	/** Whether to cache the client instance. Overrides global default if specified. */
	cached?: boolean
}

/** Options interface for Camunda8 constructor */
interface Camunda8Options {
	/** Default caching behavior for all client methods. Default: true */
	defaultCached?: boolean
}

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
	// Enhanced configuration-based caching (new functionality)
	private zeebeGrpcApiClients = new Map<string, ZeebeGrpcClient>()
	private camundaRestClients = new Map<string, CamundaRestClient>()
	private operateApiClients = new Map<string, OperateApiClient>()
	private tasklistApiClients = new Map<string, TasklistApiClient>()
	private optimizeApiClients = new Map<string, OptimizeApiClient>()
	private adminApiClients = new Map<string, AdminApiClient>()
	private modelerApiClients = new Map<string, ModelerApiClient>()
	private zeebeRestClients = new Map<string, ZeebeRestClient>()

	// Client tracking for lifecycle management
	private createdClients = new Set<ApiClient>()

	// Private framework integration hook
	private __apiClientCreationListener?: (client: ApiClient) => void

	// Global cache configuration
	private defaultCached: boolean

	// Core configuration
	private configuration: CamundaPlatform8Configuration
	private oAuthProvider: IHeadersProvider
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
			 * An optional {@link IHeadersProvider} implementation. This can be used to add headers to REST requests made by the SDK.
			 * In most cases, you will not need to supply this. You can use `CAMUNDA_AUTH_STRATEGY` and appropriate config values to configure
			 * a preconfigured auth strategy. This configuration parameter is provided for advanced use-cases.
			 **/
			oAuthProvider?: IHeadersProvider
		} = {},
		/**
		 * Optional global configuration for the Camunda8 instance.
		 */
		options: Camunda8Options = { defaultCached: true }
	) {
		this.configuration =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config)
		// Allow custom oAuthProvider to be passed in.
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/448
		this.oAuthProvider =
			config.oAuthProvider ?? constructOAuthProvider(this.configuration)
		this.defaultCached = options.defaultCached ?? true
		this.log = getLogger(config)
		this.log.debug('Camunda8 SDK initialized')
	}

	/**
	 * @internal
	 * Private hook for framework integration. Not part of public API.
	 * Subject to change without notice. Use at your own risk.
	 */
	// @ts-expect-error - Intentionally unused, accessed via type bypass in frameworks
	private __registerApiClientCreationListener(
		callback: (client: ApiClient) => void
	): void {
		this.__apiClientCreationListener = callback
	}

	/**
	 * Creates a deterministic cache key from configuration object
	 */
	private createConfigKey(config: Camunda8ClientConfiguration): string {
		return JSON.stringify(config, Object.keys(config).sort())
	}

	/**
	 * Closes all created API clients and clears all caches
	 */
	public async closeAllClients(): Promise<void> {
		const promises = Array.from(this.createdClients).map((client) => {
			if (client instanceof ZeebeGrpcClient) {
				return client
					.close()
					.catch((err) =>
						console.warn('Failed to close ZeebeGrpc client:', err)
					)
			}
			if (client instanceof CamundaRestClient) {
				client.stopWorkers()
			}
			return Promise.resolve()
		})

		await Promise.all(promises)

		// Clear all tracking
		this.createdClients.clear()

		// Clear all configuration-based caches
		this.zeebeGrpcApiClients.clear()
		this.camundaRestClients.clear()
		this.operateApiClients.clear()
		this.tasklistApiClients.clear()
		this.optimizeApiClients.clear()
		this.adminApiClients.clear()
		this.modelerApiClients.clear()
		this.zeebeRestClients.clear()
	}

	/**
	 * Returns a client for the "Operate REST API"
	 * See: https://docs.camunda.io/docs/apis-tools/operate-api/overview/
	 */
	public getOperateApiClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): OperateApiClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewOperateApiClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.operateApiClients.has(configKey)) {
			return this.operateApiClients.get(configKey)!
		}

		const client = this.createNewOperateApiClient(config)
		this.operateApiClients.set(configKey, client)

		return client
	}

	private createNewOperateApiClient(
		config: Camunda8ClientConfiguration
	): OperateApiClient {
		const client = new OperateApiClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * Returns a client for the Administration REST API
	 * See: https://docs.camunda.io/docs/apis-tools/administration-api/administration-api-reference/
	 */
	public getAdminApiClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): AdminApiClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewAdminApiClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.adminApiClients.has(configKey)) {
			return this.adminApiClients.get(configKey)!
		}

		const client = this.createNewAdminApiClient(config)
		this.adminApiClients.set(configKey, client)

		return client
	}

	private createNewAdminApiClient(
		config: Camunda8ClientConfiguration
	): AdminApiClient {
		const client = new AdminApiClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * Returns a client for the Web Modeler REST API
	 * See: https://docs.camunda.io/docs/apis-tools/web-modeler-api/overview/
	 */
	public getModelerApiClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): ModelerApiClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewModelerApiClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.modelerApiClients.has(configKey)) {
			return this.modelerApiClients.get(configKey)!
		}

		const client = this.createNewModelerApiClient(config)
		this.modelerApiClients.set(configKey, client)

		return client
	}

	private createNewModelerApiClient(
		config: Camunda8ClientConfiguration
	): ModelerApiClient {
		const client = new ModelerApiClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * Returns a client for the Optimize REST API
	 * See: https://docs.camunda.io/docs/apis-tools/optimize-api/overview/
	 */
	public getOptimizeApiClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): OptimizeApiClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewOptimizeApiClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.optimizeApiClients.has(configKey)) {
			return this.optimizeApiClients.get(configKey)!
		}

		const client = this.createNewOptimizeApiClient(config)
		this.optimizeApiClients.set(configKey, client)

		return client
	}

	private createNewOptimizeApiClient(
		config: Camunda8ClientConfiguration
	): OptimizeApiClient {
		const client = new OptimizeApiClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * Returns a client for the Tasklist REST API
	 * See: https://docs.camunda.io/docs/apis-tools/tasklist-api-rest/tasklist-api-rest-overview/
	 */
	public getTasklistApiClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): TasklistApiClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewTasklistApiClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.tasklistApiClients.has(configKey)) {
			return this.tasklistApiClients.get(configKey)!
		}

		const client = this.createNewTasklistApiClient(config)
		this.tasklistApiClients.set(configKey, client)

		return client
	}

	private createNewTasklistApiClient(
		config: Camunda8ClientConfiguration
	): TasklistApiClient {
		const client = new TasklistApiClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * Returns a client for the Zeebe gRPC API
	 * See: https://docs.camunda.io/docs/apis-tools/zeebe-api/overview/
	 */
	public getZeebeGrpcApiClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): ZeebeGrpcClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewZeebeGrpcClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.zeebeGrpcApiClients.has(configKey)) {
			return this.zeebeGrpcApiClients.get(configKey)!
		}

		const client = this.createNewZeebeGrpcClient(config)
		this.zeebeGrpcApiClients.set(configKey, client)

		return client
	}

	private createNewZeebeGrpcClient(
		config: Camunda8ClientConfiguration
	): ZeebeGrpcClient {
		const client = new ZeebeGrpcClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * @deprecated from 8.6.0. Please use getCamundaRestClient() instead.
	 */
	public getZeebeRestClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): ZeebeRestClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewZeebeRestClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.zeebeRestClients.has(configKey)) {
			return this.zeebeRestClients.get(configKey)!
		}

		const client = this.createNewZeebeRestClient(config)
		this.zeebeRestClients.set(configKey, client)

		return client
	}

	private createNewZeebeRestClient(
		config: Camunda8ClientConfiguration
	): ZeebeRestClient {
		const client = new ZeebeRestClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}

	/**
	 * Returns a client for the Camunda 8 REST API
	 * See: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/camunda-api-rest-overview/
	 */
	public getCamundaRestClient(
		config: Camunda8ClientConfiguration = {},
		options: ClientOptions = {}
	): CamundaRestClient {
		const { cached = this.defaultCached } = options

		if (!cached) {
			return this.createNewCamundaRestClient(config)
		}

		const configKey = this.createConfigKey(config)

		if (this.camundaRestClients.has(configKey)) {
			return this.camundaRestClients.get(configKey)!
		}

		const client = this.createNewCamundaRestClient(config)
		this.camundaRestClients.set(configKey, client)

		return client
	}

	private createNewCamundaRestClient(
		config: Camunda8ClientConfiguration
	): CamundaRestClient {
		const client = new CamundaRestClient({
			config: { ...this.configuration, ...config },
			oAuthProvider: this.oAuthProvider,
		})

		this.createdClients.add(client)
		this.__apiClientCreationListener?.(client)

		return client
	}
}
