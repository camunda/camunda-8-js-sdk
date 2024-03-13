import { ConsoleApiClient } from 'c8console'
import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
} from 'lib'
import { ModelerApiClient } from 'modeler'
import { OAuthProvider } from 'oauth'
import { OperateApiClient } from 'operate'
import { OptimizeApiClient } from 'optimize'
import { TasklistApiClient } from 'tasklist'
import { ZeebeGrpcClient } from 'zeebe'

export class Camunda8 {
	private operateApiClient?: OperateApiClient
	private consoleApiClient?: ConsoleApiClient
	private modelerApiClient?: ModelerApiClient
	private optimizeApiClient?: OptimizeApiClient
	private tasklistApiClient?: TasklistApiClient
	private zeebeGrpcClient?: ZeebeGrpcClient
	private configuration: CamundaPlatform8Configuration
	private oAuthProvider: OAuthProvider

	constructor(config: Partial<CamundaPlatform8Configuration> = {}) {
		this.configuration =
			CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(config)

		this.oAuthProvider = new OAuthProvider({ config: this.configuration })
	}

	public _getOperateApiClient(): OperateApiClient {
		if (!this.operateApiClient) {
			this.operateApiClient = new OperateApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.operateApiClient
	}

	public _getConsoleApiClient(): ConsoleApiClient {
		if (!this.consoleApiClient) {
			this.consoleApiClient = new ConsoleApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.consoleApiClient
	}

	public _getModelerApiClient(): ModelerApiClient {
		if (!this.modelerApiClient) {
			this.modelerApiClient = new ModelerApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.modelerApiClient
	}

	public _getOptimizeApiClient(): OptimizeApiClient {
		if (!this.optimizeApiClient) {
			this.optimizeApiClient = new OptimizeApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.optimizeApiClient
	}

	public _getTasklistApiClient(): TasklistApiClient {
		if (!this.tasklistApiClient) {
			this.tasklistApiClient = new TasklistApiClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.tasklistApiClient
	}

	public _getZeebeApiClient(): ZeebeGrpcClient {
		if (!this.zeebeGrpcClient) {
			this.zeebeGrpcClient = new ZeebeGrpcClient({
				config: this.configuration,
				oAuthProvider: this.oAuthProvider,
			})
		}
		return this.zeebeGrpcClient
	}
}
