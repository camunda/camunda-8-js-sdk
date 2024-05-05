import { readFileSync } from 'fs'
import * as path from 'path'

import chalk from 'chalk'
import d from 'debug'
import promiseRetry from 'promise-retry'
import { Duration, MaybeTimeDuration } from 'typed-duration'
import { v4 as uuid } from 'uuid'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	LosslessDto,
	RequireConfiguration,
	constructOAuthProvider,
	losslessStringify,
} from '../../lib'
import { IOAuthProvider } from '../../oauth'
import {
	BpmnParser,
	parseVariables,
	parseVariablesAndCustomHeadersToJSON,
	stringifyVariables,
} from '../lib'
import { ConnectionFactory } from '../lib/ConnectionFactory'
import { ConnectionStatusEvent } from '../lib/ConnectionStatusEvent'
import { CustomSSL } from '../lib/GrpcClient'
import { GrpcError } from '../lib/GrpcError'
import { ZBSimpleLogger } from '../lib/SimpleLogger'
import { StatefulLogInterceptor } from '../lib/StatefulLogInterceptor'
import { TypedEmitter } from '../lib/TypedEmitter'
import { ZBJsonLogger } from '../lib/ZBJsonLogger'
import * as ZB from '../lib/interfaces-1.0'
import * as Grpc from '../lib/interfaces-grpc-1.0'
import {
	Loglevel,
	ZBClientOptions,
	ZBCustomLogger,
} from '../lib/interfaces-published-contract'
import { Utils } from '../lib/utils'

import { ZBWorker } from './ZBWorker'

const debug = d('camunda:zeebeclient')

const idColors = [
	chalk.yellow,
	chalk.green,
	chalk.cyan,
	chalk.magenta,
	chalk.blue,
]

/**
 * @description A client for interacting with a Zeebe broker. With the connection credentials set in the environment, you can use a "zero-conf" constructor with no arguments.
 * @example
 * ```
 * const zbc = new ZeebeGrpcClient()
 * zbc.topology().then(info =>
 *     console.log(JSON.stringify(info, null, 2))
 * )
 * ```
 */
export class ZeebeGrpcClient extends TypedEmitter<
	typeof ConnectionStatusEvent
> {
	public connectionTolerance: MaybeTimeDuration
	public connected?: boolean = undefined
	public readied = false
	public gatewayAddress: string
	public loglevel: Loglevel
	public onReady?: () => void
	public onConnectionError?: (err: Error) => void
	private logger: StatefulLogInterceptor
	private closePromise?: Promise<null>
	private closing = false
	// A gRPC channel for the ZBClient to execute commands on
	private grpc: ZB.ZBGrpc
	private options: ZBClientOptions
	private workerCount = 0
	private workers: ZBWorker<any, any, any>[] = // eslint-disable-line @typescript-eslint/no-explicit-any
		[]
	private retry: boolean
	private maxRetries: number
	private maxRetryTimeout: MaybeTimeDuration
	private oAuthProvider: IOAuthProvider
	private useTLS: boolean
	private stdout: ZBCustomLogger
	private customSSL?: CustomSSL
	private tenantId?: string
	private config: CamundaPlatform8Configuration

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IOAuthProvider
	}) {
		super()
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.config = config
		this.options = {} as ZBClientOptions

		this.options.longPoll = Duration.seconds.of(
			config.zeebeGrpcSettings.ZEEBE_GRPC_WORKER_LONGPOLL_SECONDS
		)

		this.options.pollInterval = Duration.milliseconds.of(
			config.zeebeGrpcSettings.ZEEBE_GRPC_WORKER_POLL_INTERVAL_MS
		)

		this.retry = config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_RETRY

		this.options.retry = this.retry

		this.loglevel = config.zeebeGrpcSettings.ZEEBE_CLIENT_LOG_LEVEL as Loglevel
		this.options.loglevel = this.loglevel

		const logTypeFromEnvironment = () =>
			({
				JSON: ZBJsonLogger,
				SIMPLE: ZBSimpleLogger,
			})[config.zeebeGrpcSettings.ZEEBE_CLIENT_LOG_TYPE ?? 'NONE']

		this.stdout = logTypeFromEnvironment() ?? ZBSimpleLogger

		this.options.tenantId = config.CAMUNDA_TENANT_ID

		this.tenantId = this.options.tenantId

		this.gatewayAddress = RequireConfiguration(
			config.ZEEBE_ADDRESS,
			'ZEEBE_ADDRESS'
		)

		debug('Gateway address: ', this.gatewayAddress)

		this.useTLS = config.CAMUNDA_SECURE_CONNECTION
		const certChainPath = config.CAMUNDA_CUSTOM_CERT_CHAIN_PATH
		const rootCertsPath = config.CAMUNDA_CUSTOM_ROOT_CERT_PATH
		const privateKeyPath = config.CAMUNDA_CUSTOM_PRIVATE_KEY_PATH
		const customSSL = {
			certChain: certChainPath ? readFileSync(certChainPath) : undefined,
			privateKey: privateKeyPath ? readFileSync(privateKeyPath) : undefined,
			rootCerts: rootCertsPath ? readFileSync(rootCertsPath) : undefined,
		}

		this.customSSL = customSSL
		this.options.customSSL = customSSL

		this.connectionTolerance = Duration.milliseconds.of(
			config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_CONNECTION_TOLERANCE_MS
		)

		this.onConnectionError = this.options.onConnectionError
		this.onReady = this.options.onReady
		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)

		const { grpcClient, log } = this.constructGrpcClient({
			grpcConfig: {
				namespace: this.options.logNamespace || 'ZBClient',
			},
			logConfig: {
				_tag: 'ZBCLIENT',
				loglevel: this.loglevel,
				longPoll: Duration.milliseconds.from(this.options.longPoll),
				namespace: this.options.logNamespace || 'ZBClient',
				pollInterval: Duration.milliseconds.from(this.options.pollInterval),
				stdout: this.stdout,
			},
		})

		grpcClient.on(ConnectionStatusEvent.connectionError, (err: Error) => {
			if (this.connected !== false) {
				this.onConnectionError?.(err)
				this.emit(ConnectionStatusEvent.connectionError)
			}
			this.connected = false
			this.readied = false
		})
		grpcClient.on(ConnectionStatusEvent.ready, () => {
			if (!this.readied) {
				this.onReady?.()
				this.emit(ConnectionStatusEvent.ready)
			}
			this.connected = true
			this.readied = true
		})
		this.grpc = grpcClient
		this.logger = log

		this.maxRetries = config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_MAX_RETRIES

		this.maxRetryTimeout = Duration.seconds.of(
			config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_MAX_RETRY_TIMEOUT_SECONDS
		)

		// Send command to broker to eagerly fail / prove connection.
		// This is useful for, for example: the Node-Red client, which wants to
		// display the connection status.
		const eagerConnection =
			config.zeebeGrpcSettings.ZEEBE_GRPC_CLIENT_EAGER_CONNECT
		if (eagerConnection ?? false) {
			this.topology()
				.then((res) => {
					this.logger.logDirect(chalk.blueBright('Zeebe cluster topology:'))
					this.logger.logDirect(res.brokers)
				})
				.catch((e) => {
					// Swallow exception to avoid throwing if retries are off
					if (e.thisWillNeverHappenYo) {
						this.emit(ConnectionStatusEvent.unknown)
					}
				})
		}
	}

	/**
	 * @description activateJobs allows you to manually activate jobs, effectively building a worker; rather than using the ZBWorker class.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 * zbc.activateJobs({
	 *   maxJobsToActivate: 5,
	 *   requestTimeout: 6000,
	 *   timeout: 5 * 60 * 1000,
	 *   type: 'process-payment',
	 *   worker: 'my-worker-uuid'
	 * }).then(jobs =>
	 * 	 jobs.forEach(job =>
	 *     // business logic
	 *     zbc.completeJob({
	 *       jobKey: job.key,
	 *       variables: {}
	 *     ))
	 *   )
	 * })
	 * ```
	 */
	public activateJobs<
		Variables = ZB.IInputVariables,
		CustomHeaders = ZB.ICustomHeaders,
	>(
		request: Grpc.ActivateJobsRequest & {
			inputVariableDto?: {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				new (...args: any[]): Readonly<Variables>
			}
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			customHeadersDto?: { new (...args: any[]): Readonly<CustomHeaders> }
		}
	): Promise<ZB.Job<Variables, CustomHeaders>[]> {
		const { inputVariableDto, customHeadersDto, ...req } = request
		const inputVariableDtoToUse =
			inputVariableDto ??
			(LosslessDto as {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				new (obj: any): Variables
			})
		const customHeadersDtoToUse =
			customHeadersDto ??
			(LosslessDto as {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				new (obj: any): CustomHeaders
			})
		// eslint-disable-next-line no-async-promise-executor
		return new Promise(async (resolve, reject) => {
			try {
				const stream = await this.grpc.activateJobsStream(req)
				stream.on('data', (res: Grpc.ActivateJobsResponse) => {
					const jobs = res.jobs.map((job) =>
						parseVariablesAndCustomHeadersToJSON<Variables, CustomHeaders>(
							job,
							inputVariableDtoToUse,
							customHeadersDtoToUse
						)
					)

					resolve(jobs)
				})
			} catch (e: unknown) {
				reject(e)
			}
		})
	}

	/**
	 *
	 * @description Broadcast a Signal
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.broadcastSignal({
	 *   signalName: 'my-signal',
	 *   variables: { reasonCode: 3 }
	 * })
	 */
	public async broadcastSignal(
		req: ZB.BroadcastSignalReq
	): Promise<ZB.BroadcastSignalRes> {
		const request = {
			signalName: req.signalName,
			variables: JSON.stringify(req.variables ?? {}),
			tenantId: req.tenantId ?? this.tenantId,
		}
		return this.executeOperation('broadcastSignal', () =>
			this.grpc.broadcastSignalSync(request)
		)
	}

	/**
	 *
	 * @description Cancel a process instance by process instance key.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.cancelProcessInstance(processInstanceId)
	 * 	.catch(
	 * 		(e: any) => console.log(`Error cancelling instance: ${e.message}`)
	 * )
	 * ```
	 */
	public async cancelProcessInstance(
		processInstanceKey: string | number
	): Promise<void> {
		Utils.validateNumber(processInstanceKey, 'processInstanceKey')
		return this.executeOperation('cancelProcessInstance', () =>
			this.grpc.cancelProcessInstanceSync({
				processInstanceKey,
			})
		)
	}

	/**
	 *
	 * @description Create a worker that polls the gateway for jobs and executes a job handler when units of work are available.
	 * @example
	 * ```
	 * const zbc = new ZB.ZeebeGrpcClient()
	 *
	 * const zbWorker = zbc.createWorker({
	 *   taskType: 'demo-service',
	 *   taskHandler: myTaskHandler,
	 * })
	 *
	 * // A job handler must return one of job.complete, job.fail, job.error, or job.forward
	 * // Note: unhandled exceptions in the job handler cause the library to call job.fail
	 * async function myTaskHandler(job) {
	 *   zbWorker.log('Task variables', job.variables)
	 *
	 *   // Task worker business logic goes here
	 *   const updateToBrokerVariables = {
	 *     updatedProperty: 'newValue',
	 *   }
	 *
	 *   const res = await callExternalSystem(job.variables)
	 *
	 *   if (res.code === 'SUCCESS') {
	 *     return job.complete({
	 *        ...updateToBrokerVariables,
	 *        ...res.values
	 *     })
	 *   }
	 *   if (res.code === 'BUSINESS_ERROR') {
	 *     return job.error({
	 *       code: res.errorCode,
	 *       message: res.message
	 *     })
	 *   }
	 *   if (res.code === 'ERROR') {
	 *     return job.fail({
	 *        errorMessage: res.message,
	 *        retryBackOff: 2000
	 *     })
	 *   }
	 * }
	 * ```
	 */
	public createWorker<
		WorkerInputVariables = ZB.IInputVariables,
		CustomHeaderShape = ZB.ICustomHeaders,
		WorkerOutputVariables = ZB.IOutputVariables,
	>(
		config: ZB.ZBWorkerConfig<
			WorkerInputVariables,
			CustomHeaderShape,
			WorkerOutputVariables
		>
	): ZBWorker<WorkerInputVariables, CustomHeaderShape, WorkerOutputVariables> {
		debug(`Creating worker for task type ${config.taskType}`)
		if (this.closing) {
			throw new Error('Client is closing. No worker creation allowed!')
		}
		const idColor = idColors[this.workerCount++ % idColors.length]

		// Merge parent client options with worker override
		const options = {
			...this.options,
			onConnectionError: undefined, // Do not inherit client handler
			onReady: undefined, // Do not inherit client handler
			...config,
		}

		// Give worker its own gRPC connection
		const { grpcClient: workerGRPCClient, log } = this.constructGrpcClient({
			grpcConfig: {
				namespace: 'ZBWorker',
				tasktype: config.taskType,
			},
			logConfig: {
				_tag: 'ZBWORKER',
				colorise: true,
				id: config.id!,
				loglevel: options.loglevel,
				namespace: ['ZBWorker', options.logNamespace].join(' ').trim(),
				pollInterval: options.longPoll,
				stdout: options.stdout,
				taskType: config.taskType,
			},
		})
		const worker = new ZBWorker<
			WorkerInputVariables,
			CustomHeaderShape,
			WorkerOutputVariables
		>({
			grpcClient: workerGRPCClient,
			id: config.id || null,
			idColor,
			log,
			options: { ...this.options, ...options },
			taskHandler: config.taskHandler,
			taskType: config.taskType,
			zbClient: this,
		})
		this.workers.push(worker)
		return worker
	}

	/**
	 * @description Gracefully shut down all workers, draining existing tasks, and return when it is safe to exit.
	 *
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.createWorker({
	 *   taskType:
	 * })
	 *
	 * setTimeout(async () => {
	 *   await zbc.close()
	 *   console.log('All work completed.')
	 * }),
	 *   5 * 60 * 1000 // 5 mins
	 * )
	 * ```
	 */
	public async close(timeout?: number): Promise<null> {
		this.closePromise =
			this.closePromise ||
			new Promise((resolve) => {
				// Prevent the creation of more workers
				this.closing = true
				Promise.all(this.workers.map((w) => w.close(timeout)))
					.then(() => this.grpc.close(timeout))
					.then(() => {
						this.emit(ConnectionStatusEvent.close)
						this.grpc.removeAllListeners()
						this.removeAllListeners()
						resolve(null)
					})
			})
		return this.closePromise
	}

	/**
	 *
	 * @description Explicitly complete a job. The method is useful for manually constructing a worker.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 * zbc.activateJobs({
	 *   maxJobsToActivate: 5,
	 *   requestTimeout: 6000,
	 *   timeout: 5 * 60 * 1000,
	 *   type: 'process-payment',
	 *   worker: 'my-worker-uuid'
	 * }).then(jobs =>
	 * 	 jobs.forEach(job =>
	 *     // business logic
	 *     zbc.completeJob({
	 *       jobKey: job.key,
	 *       variables: {}
	 *     ))
	 *   )
	 * })
	 * ```
	 */
	public completeJob(
		completeJobRequest: Grpc.CompleteJobRequest
	): Promise<void> {
		const withStringifiedVariables = stringifyVariables(completeJobRequest)
		this.logger.logDebug(withStringifiedVariables)
		return this.executeOperation('completeJob', () =>
			this.grpc.completeJobSync(withStringifiedVariables).catch((e) => {
				if (e.code === GrpcError.NOT_FOUND) {
					e.details +=
						'. The process may have been cancelled, the job cancelled by an interrupting event, or the job already completed.' +
						' For more detail, see: https://forum.zeebe.io/t/command-rejected-with-code-complete/908/17'
				}
				throw e
			})
		)
	}

	// tslint:disable: no-object-literal-type-assertion
	/**
	 *
	 * @description Create a new process instance. Asynchronously returns a process instance id.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.createProcessInstance({
	 *   bpmnProcessId: 'onboarding-process',
	 *   variables: {
	 *     customerId: 'uuid-3455'
	 *   },
	 *   version: 5 // optional, will use latest by default
	 * }).then(res => console.log(JSON.stringify(res, null, 2)))
	 *
	 * zbc.createProcessInstance({
	 *   bpmnProcessId: 'SkipFirstTask',
	 *   variables: { id: random },
	 *   startInstructions: [{elementId: 'second_service_task'}]
	 * }).then(res => (id = res.processInstanceKey))
	 * ```
	 */
	public createProcessInstance<
		Variables extends ZB.JSONDoc = ZB.IProcessVariables,
	>(
		config: ZB.CreateProcessInstanceReq<Variables>
	): Promise<Grpc.CreateProcessInstanceResponse> {
		const request: ZB.CreateProcessInstanceReq<Variables> = {
			bpmnProcessId: config.bpmnProcessId,
			variables: config.variables,
			version: config.version || -1,
			startInstructions: config.startInstructions || [],
		}

		const createProcessInstanceRequest: Grpc.CreateProcessInstanceRequest =
			stringifyVariables({
				...request,
				startInstructions: request.startInstructions!,
				tenantId: config.tenantId ?? this.tenantId,
			})

		return this.executeOperation('createProcessInstance', () =>
			this.grpc.createProcessInstanceSync(createProcessInstanceRequest)
		)
	}

	/**
	 *
	 * @description Create a process instance, and return a Promise that returns the outcome of the process.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.createProcessInstanceWithResult({
	 *   bpmnProcessId: 'order-process',
	 *   variables: {
	 *     customerId: 123,
	 *     invoiceId: 567
	 *   }
	 * })
	 *   .then(console.log)
	 * ```
	 */
	public createProcessInstanceWithResult<
		Variables extends ZB.JSONDoc = ZB.IProcessVariables,
		Result = ZB.IOutputVariables,
	>(
		config: ZB.CreateProcessInstanceWithResultReq<Variables>
	): Promise<Grpc.CreateProcessInstanceWithResultResponse<Result>> {
		const request = {
			bpmnProcessId: config.bpmnProcessId,
			fetchVariables: config.fetchVariables,
			requestTimeout: config.requestTimeout || 0,
			variables: config.variables,
			version: config.version || -1,
			tenantId: config.tenantId ?? this.tenantId,
		}

		const createProcessInstanceRequest: Grpc.CreateProcessInstanceBaseRequest =
			stringifyVariables({
				bpmnProcessId: request.bpmnProcessId,
				variables: request.variables,
				version: request.version,
				tenantId: request.tenantId ?? this.tenantId,
			})

		return this.executeOperation('createProcessInstanceWithResult', () =>
			this.grpc.createProcessInstanceWithResultSync({
				fetchVariables: request.fetchVariables,
				request: createProcessInstanceRequest,
				requestTimeout: request.requestTimeout,
			})
		).then((res) =>
			parseVariables<
				Grpc.CreateProcessInstanceWithResultResponseOnWire,
				Result
			>(res)
		)
	}

	/**
	 * Delete a resource.
	 * @param resourceId - The key of the resource that should be deleted. This can either be the key of a process definition, the key of a decision requirements definition or the key of a form.
	 * @returns
	 */
	deleteResource({
		resourceKey,
	}: {
		resourceKey: string
	}): Promise<Record<string, never>> {
		return this.executeOperation('deleteResourceSync', () =>
			this.grpc.deleteResourceSync({ resourceKey })
		)
	}

	/**
	 *
	 * @description Deploys one or more resources (e.g. processes or decision models) to Zeebe.
	 * Note that this is an atomic call, i.e. either all resources are deployed, or none of them are.
	 *
	 * Errors:
	 * PERMISSION_DENIED:
	 *   - if a deployment to an unauthorized tenant is performed
	 * INVALID_ARGUMENT:
	 *   - no resources given.
	 *   - if at least one resource is invalid. A resource is considered invalid if:
	 *     - the content is not deserializable (e.g. detected as BPMN, but it's broken XML)
	 *     - the content is invalid (e.g. an event-based gateway has an outgoing sequence flow to a task)
	 *   - if multi-tenancy is enabled, and:
	 *     - a tenant id is not provided
	 *     - a tenant id with an invalid format is provided
	 *   - if multi-tenancy is disabled and a tenant id is provided
	 * @example
	 * ```
	 * import {join} from 'path'
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.deployResource({ processFilename: join(process.cwd(), 'bpmn', 'onboarding.bpmn' })
	 * zbc.deployResource({ decisionFilename: join(process.cwd(), 'dmn', 'approval.dmn')})
	 * ```
	 */
	public async deployResource(
		resource:
			| { processFilename: string; tenantId?: string }
			| { name: string; process: Buffer; tenantId?: string }
	): Promise<Grpc.DeployResourceResponse<Grpc.ProcessDeployment>>
	public async deployResource(
		resource:
			| { decisionFilename: string; tenantId?: string }
			| { name: string; decision: Buffer; tenantId?: string }
	): Promise<Grpc.DeployResourceResponse<Grpc.DecisionDeployment>>
	public async deployResource(
		resource:
			| { formFilename: string; tenantId?: string }
			| { name: string; form: Buffer; tenantId?: string }
	): Promise<Grpc.DeployResourceResponse<Grpc.FormDeployment>>
	async deployResource(
		resource:
			| { name: string; process: Buffer; tenantId?: string }
			| { processFilename: string; tenantId?: string }
			| { name: string; decision: Buffer; tenantId?: string }
			| { decisionFilename: string; tenantId?: string }
			| { name: string; form: Buffer; tenantId?: string }
			| { formFilename: string; tenantId?: string }
	): Promise<
		Grpc.DeployResourceResponse<
			| Grpc.ProcessDeployment
			| Grpc.DecisionDeployment
			| Grpc.DecisionRequirementsDeployment
			| Grpc.FormDeployment
		>
	> {
		const isProcess = (
			maybeProcess: any // eslint-disable-line @typescript-eslint/no-explicit-any
		): maybeProcess is { process: Buffer; name: string } =>
			!!maybeProcess.process
		const isProcessFilename = (
			maybeProcessFilename: any // eslint-disable-line @typescript-eslint/no-explicit-any
		): maybeProcessFilename is { processFilename: string } =>
			!!maybeProcessFilename.processFilename
		const isDecision = (
			maybeDecision: any // eslint-disable-line @typescript-eslint/no-explicit-any
		): maybeDecision is { decision: Buffer; name: string } =>
			!!maybeDecision.decision
		const isDecisionFilename = (
			maybeDecisionFilename: any // eslint-disable-line @typescript-eslint/no-explicit-any
		): maybeDecisionFilename is { decisionFilename: string } =>
			!!maybeDecisionFilename.decisionFilename
		// default fall-through
		/* const isForm = ( maybeForm: any ): maybeForm is { form: Buffer; name: string } =>
			!!maybeForm.form
			*/
		const isFormFilename = (
			maybeFormFilename: any // eslint-disable-line @typescript-eslint/no-explicit-any
		): maybeFormFilename is { formFilename: string } =>
			!!maybeFormFilename.formFilename

		if (isProcessFilename(resource)) {
			const filename = resource.processFilename
			const process = readFileSync(filename)
			return this.executeOperation('deployResource', () =>
				this.grpc.deployResourceSync({
					resources: [
						{
							name: filename,
							content: process,
						},
					],
					tenantId: resource.tenantId ?? this.tenantId,
				})
			)
		} else if (isProcess(resource)) {
			return this.executeOperation('deployResource', () =>
				this.grpc.deployResourceSync({
					resources: [
						{
							name: resource.name,
							content: resource.process,
						},
					],
					tenantId: resource.tenantId ?? this.tenantId,
				})
			)
		} else if (isDecisionFilename(resource)) {
			const filename = resource.decisionFilename
			const decision = readFileSync(filename)
			return this.executeOperation('deployResource', () =>
				this.grpc.deployResourceSync({
					resources: [
						{
							name: filename,
							content: decision,
						},
					],
					tenantId: resource.tenantId ?? this.tenantId,
				})
			)
		} else if (isDecision(resource)) {
			return this.executeOperation('deployResource', () =>
				this.grpc.deployResourceSync({
					resources: [
						{
							name: resource.name,
							content: resource.decision,
						},
					],
					tenantId: resource.tenantId ?? this.tenantId,
				})
			)
		} else if (isFormFilename(resource)) {
			const filename = resource.formFilename
			const form = readFileSync(filename)
			return this.executeOperation('deployResource', () =>
				this.grpc.deployResourceSync({
					resources: [
						{
							name: filename,
							content: form,
						},
					],
					tenantId: resource.tenantId ?? this.tenantId,
				})
			)
		} /* if (isForm(resource)) */ else {
			// default fall-through
			return this.executeOperation('deployResource', () =>
				this.grpc.deployResourceSync({
					resources: [
						{
							name: resource.name,
							content: resource.form,
						},
					],
					tenantId: resource.tenantId ?? this.tenantId,
				})
			)
		}
	}

	/**
	 *
	 * @description Evaluates a decision. The decision to evaluate can be specified either by using its unique key (as returned by DeployResource), or using the decision ID. When using the decision ID, the latest deployed version of the decision is used.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 * zbc.evaluateDecision({
	 *   decisionId: 'my-decision',
	 *   variables: { season: "Fall" }
	 * }).then(res => console.log(JSON.stringify(res, null, 2)))
	 */
	public evaluateDecision(
		evaluateDecisionRequest: Grpc.EvaluateDecisionRequest
	): Promise<Grpc.EvaluateDecisionResponse> {
		// the gRPC API call needs a JSON string, but we accept a JSON object, so we transform it here
		const variables = losslessStringify(
			evaluateDecisionRequest.variables
		) as unknown as ZB.JSONDoc
		return this.executeOperation('evaluateDecision', () =>
			this.grpc.evaluateDecisionSync({
				...evaluateDecisionRequest,
				variables,
				tenantId: evaluateDecisionRequest.tenantId ?? this.tenantId,
			})
		)
	}

	/**
	 *
	 * @description Fail a job. This is useful if you are using the decoupled completion pattern or building your own worker.
	 * For the retry count, the current count is available in the job metadata.
	 *
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 * zbc.failJob( {
	 *   jobKey: '345424343451',
	 *   retries: 3,
	 *   errorMessage: 'Could not get a response from the order invoicing API',
	 *   retryBackOff: 30 * 1000 // optional, otherwise available for reactivation immediately
	 * })
	 * ```
	 */
	public failJob(failJobRequest: Grpc.FailJobRequest): Promise<void> {
		return this.executeOperation('failJob', () =>
			this.grpc.failJobSync(failJobRequest)
		)
	}

	/**
	 * @description Return an array of task types contained in a BPMN file or array of BPMN files. This can be useful, for example, to do
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 * zbc.getServiceTypesFromBpmn(['bpmn/onboarding.bpmn', 'bpmn/process-sale.bpmn'])
	 *   .then(tasktypes => console.log('The task types are:', tasktypes))
	 *
	 * ```
	 */
	public getServiceTypesFromBpmn(files: string | string[]) {
		const fileArray = typeof files === 'string' ? [files] : files
		return BpmnParser.getTaskTypes(BpmnParser.parseBpmn(fileArray))
	}

	/**
	 *
	 * @description Modify a running process instance. This allows you to move the execution tokens, and change the variables. Added in 8.1.
	 * See the [gRPC protocol documentation](https://docs.camunda.io/docs/apis-clients/grpc/#modifyprocessinstance-rpc).
	 * @example
	 * ```
	 * zbc.createProcessInstance('SkipFirstTask', {}).then(res =>
	 *   zbc.modifyProcessInstance({
	 *     processInstanceKey: res.processInstanceKey,
	 *     activateInstructions: [{
	 *       elementId: 'second_service_task',
	 *       ancestorElementInstanceKey: "-1",
	 *       variableInstructions: [{
	 *         scopeId: '',
	 *         variables: { second: 1}
	 *       }]
	 *     }]
	 *   })
	 * )
	 * ```
	 */
	public modifyProcessInstance(
		modifyProcessInstanceRequest: Grpc.ModifyProcessInstanceRequest
	): Promise<Grpc.ModifyProcessInstanceResponse> {
		return this.executeOperation('modifyProcessInstance', () => {
			// We accept JSONDoc for the variableInstructions, but the actual gRPC call needs stringified JSON, so transform it with a mutation
			const req = Utils.deepClone(modifyProcessInstanceRequest)
			req?.activateInstructions?.forEach((a) =>
				a.variableInstructions.forEach(
					(v) => (v.variables = losslessStringify(v.variables))
				)
			)
			return this.grpc.modifyProcessInstanceSync({
				...req,
			})
		})
	}

	/**
	 *
	 * @since 8.5.0
	 */
	public migrateProcessInstance(
		migrateProcessInstanceRequest: Grpc.MigrateProcessInstanceRequest
	): Promise<Grpc.MigrateProcessInstanceResponse> {
		return this.executeOperation('migrateProcessInstance', () =>
			this.grpc.migrateProcessInstanceSync(migrateProcessInstanceRequest)
		)
	}

	/**
	 * @description Publish a message to the broker for correlation with a workflow instance. See [this tutorial](https://docs.camunda.io/docs/guides/message-correlation/) for a detailed description of message correlation.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.publishMessage({
	 *   // Should match the "Message Name" in a BPMN Message Catch
	 *   name: 'order_status',
	 *   correlationKey: 'uuid-124-532-5432',
	 *   variables: {
	 *     event: 'PROCESSED'
	 *   }
	 * })
	 * ```
	 */
	public publishMessage<
		ProcessVariables extends {
			[key: string]: ZB.JSON
		} = ZB.IProcessVariables,
	>(
		publishMessageRequest: Grpc.PublishMessageRequest<ProcessVariables>
	): Promise<Grpc.PublishMessageResponse> {
		return this.executeOperation('publishMessage', () =>
			this.grpc.publishMessageSync(
				stringifyVariables({
					...publishMessageRequest,
					variables: publishMessageRequest.variables,
					tenantId: publishMessageRequest.tenantId ?? this.tenantId,
				})
			)
		)
	}

	/**
	 * @description Publish a message to the broker for correlation with a workflow message start event.
	 * For a message targeting a start event, the correlation key is not needed to target a specific running process instance.
	 * However, the hash of the correlationKey is used to determine the partition where this workflow will start.
	 * So we assign a random uuid to balance workflow instances created via start message across partitions.
	 *
	 * We make the correlationKey optional, because the caller can specify a correlationKey + messageId
	 * to guarantee an idempotent message.
	 *
	 * Multiple messages with the same correlationKey + messageId combination will only start a workflow once.
	 * See: https://github.com/zeebe-io/zeebe/issues/1012 and https://github.com/zeebe-io/zeebe/issues/1022
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 * zbc.publishStartMessage({
	 *   name: 'Start_New_Onboarding_Flow',
	 *   variables: {
	 *     customerId: 'uuid-348-234-8908'
	 *   }
	 * })
	 *
	 * // To do the same in an idempotent fashion - note: only idempotent during the lifetime of the created instance.
	 * zbc.publishStartMessage({
	 *   name: 'Start_New_Onboarding_Flow',
	 *   messageId: 'uuid-348-234-8908', // use customerId to make process idempotent per customer
	 *   variables: {
	 *     customerId: 'uuid-348-234-8908'
	 *   }
	 * })
	 * ```
	 */
	public publishStartMessage<
		ProcessVariables extends ZB.IInputVariables = ZB.IProcessVariables,
	>(
		publishStartMessageRequest: Grpc.PublishStartMessageRequest<ProcessVariables>
	): Promise<Grpc.PublishMessageResponse> {
		/**
		 * The hash of the correlationKey is used to determine the partition where this workflow will start.
		 * So we assign a random uuid to balance workflow instances created via start message across partitions.
		 *
		 * We make the correlationKey optional, because the caller can specify a correlationKey + messageId
		 * to guarantee an idempotent message.
		 *
		 * Multiple messages with the same correlationKey + messageId combination will only start a workflow once.
		 * See: https://github.com/zeebe-io/zeebe/issues/1012 and https://github.com/zeebe-io/zeebe/issues/1022
		 */

		const publishMessageRequest: Grpc.PublishMessageRequest = {
			correlationKey: uuid(),
			...publishStartMessageRequest,
			tenantId: publishStartMessageRequest.tenantId ?? this.tenantId,
		}
		return this.executeOperation('publishStartMessage', () =>
			this.grpc.publishMessageSync(
				stringifyVariables({
					...publishMessageRequest,
					variables: publishMessageRequest.variables || {},
				})
			)
		)
	}

	/**
	 *
	 * @description Resolve an incident by incident key.
	 * @example
	 * ```
	 * type JSONObject = {[key: string]: string | number | boolean | JSONObject}
	 *
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * async updateAndResolveIncident({
	 *   processInstanceId,
	 *   incidentKey,
	 *   variables
	 * } : {
	 *   processInstanceId: string,
	 *   incidentKey: string,
	 *   variables: JSONObject
	 * }) {
	 *   await zbc.setVariables({
	 *     elementInstanceKey: processInstanceId,
	 *     variables
	 *   })
	 *   await zbc.updateRetries()
	 *   zbc.resolveIncident({
	 *     incidentKey
	 *   })
	 *   zbc.resolveIncident(incidentKey)
	 * }
	 *
	 * ```
	 */
	public resolveIncident(
		resolveIncidentRequest: Grpc.ResolveIncidentRequest
	): Promise<void> {
		return this.executeOperation('resolveIncident', () =>
			this.grpc.resolveIncidentSync(resolveIncidentRequest)
		)
	}

	/**
	 *
	 * @description Directly modify the variables is a process instance. This can be used with `resolveIncident` to update the process and resolve an incident.
	 * @example
	 * ```
	 * type JSONObject = {[key: string]: string | number | boolean | JSONObject}
	 *
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * async function updateAndResolveIncident({
	 *   incidentKey,
	 *   processInstanceKey,
	 *   jobKey,
	 *   variableUpdate
	 * } : {
	 *   incidentKey: string
	 *   processInstanceKey: string
	 *   jobKey: string
	 *   variableUpdate: JSONObject
	 * }) {
	 *   await zbc.setVariables({
	 *     elementInstanceKey: processInstanceKey,
	 *     variables: variableUpdate
	 *   })
	 *   await zbc.updateJobRetries({
	 *     jobKey,
	 *     retries: 1
	 *   })
	 *   return zbc.resolveIncident({
	 *     incidentKey
	 *   })
	 * }
	 * ```
	 */
	public setVariables<Variables = ZB.IProcessVariables>(
		request: Grpc.SetVariablesRequest<Variables>
	): Promise<void> {
		/*
		We allow developers to interact with variables as a native JS object, but the Zeebe server needs it as a JSON document
		So we stringify it here.
		*/
		const variables =
			typeof request.variables === 'object'
				? losslessStringify(request.variables)
				: request.variables

		return this.executeOperation('setVariables', () =>
			this.grpc.setVariablesSync({ ...request, variables })
		)
	}

	/**
	 *
	 * @description Fail a job by throwing a business error (i.e. non-technical) that occurs while processing a job.
	 * The error is handled in the workflow by an error catch event.
	 * If there is no error catch event with the specified `errorCode` then an incident will be raised instead.
	 * This method is useful when building a worker, for example for the decoupled completion pattern.
	 * @example
	 * ```
	 * type JSONObject = {[key: string]: string | number | boolean | JSONObject}
	 *
	 * interface errorResult {
	 *   resultType: 'ERROR' as 'ERROR'
	 * 	 errorCode: string
	 *   errorMessage: string
	 * }
	 *
	 * interface successResult {
	 *   resultType: 'SUCCESS' as 'SUCCESS'
	 *   variableUpdate: JSONObject
	 * }
	 *
	 * type Result = errorResult | successResult
	 *
	 * const zbc = new ZeebeGrpcClient()
	 *
	 *
	 * // This could be a listener on a return queue from an external system
	 * async function handleJob(jobKey: string, result: Result) {
	 *   if (resultType === 'ERROR') {
	 *     const { errorMessage, errorCode } = result
	 * 		zbc.throwError({
	 *        jobKey,
	 *        errorCode,
	 * 		  errorMessage
	 *     })
	 *   } else {
	 *     zbc.completeJob({
	 *       jobKey,
	 *       variables: result.variableUpdate
	 *     })
	 *   }
	 * }
	 * ```
	 */
	public throwError(throwErrorRequest: Grpc.ThrowErrorRequest) {
		const req = stringifyVariables({
			...throwErrorRequest,
			variables: throwErrorRequest.variables ?? {},
		})
		return this.executeOperation('throwError', () =>
			this.grpc.throwErrorSync(req)
		)
	}

	/**
	 * @description Return the broker cluster topology.
	 * @example
	 * ```
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * zbc.topology().then(res => console.res(JSON.stringify(res, null, 2)))
	 * ```
	 */
	public topology(): Promise<Grpc.TopologyResponse> {
		return this.executeOperation('topology', this.grpc.topologySync)
	}

	/**
	 *
	 * @description Update the number of retries for a Job. This is useful if a job has zero remaining retries and fails, raising an incident.
	 * @example
	 * ```
	 * type JSONObject = {[key: string]: string | number | boolean | JSONObject}
	 *
	 * const zbc = new ZeebeGrpcClient()
	 *
	 * async function updateAndResolveIncident({
	 *   incidentKey,
	 *   processInstanceKey,
	 *   jobKey,
	 *   variableUpdate
	 * } : {
	 *   incidentKey: string
	 *   processInstanceKey: string
	 *   jobKey: string
	 *   variableUpdate: JSONObject
	 * }) {
	 *   await zbc.setVariables({
	 *     elementInstanceKey: processInstanceKey,
	 *     variables: variableUpdate
	 *   })
	 *   await zbc.updateJobRetries({
	 *     jobKey,
	 *     retries: 1
	 *   })
	 *   return zbc.resolveIncident({
	 *     incidentKey
	 *   })
	 * }
	 * ```
	 */
	public updateJobRetries(
		updateJobRetriesRequest: Grpc.UpdateJobRetriesRequest
	): Promise<void> {
		return this.executeOperation('updateJobRetries', () =>
			this.grpc.updateJobRetriesSync(updateJobRetriesRequest)
		)
	}

	private constructGrpcClient({
		grpcConfig,
		logConfig,
	}: {
		grpcConfig: {
			onReady?: () => void
			onConnectionError?: () => void
			tasktype?: string
			namespace: string
		}
		logConfig: ZB.ZBLoggerConfig
	}) {
		const { grpcClient, log } = ConnectionFactory.getGrpcClient({
			grpcConfig: {
				config: this.config,
				connectionTolerance: Duration.milliseconds.from(
					this.connectionTolerance
				),
				customSSL: this.customSSL,
				host: this.gatewayAddress,
				loglevel: this.loglevel,
				namespace: grpcConfig.namespace,
				oAuth: this.oAuthProvider,
				options: {
					longPoll: this.options.longPoll
						? Duration.milliseconds.from(this.options.longPoll)
						: undefined,
				},
				packageName: 'gateway_protocol',
				protoPath: path.join(__dirname, '../../proto/zeebe.proto'),
				service: 'Gateway',
				stdout: this.stdout,
				tasktype: grpcConfig.tasktype,
				useTLS: this.useTLS,
			},
			logConfig,
		})
		if (grpcConfig.onConnectionError) {
			grpcClient.on(
				ConnectionStatusEvent.connectionError,
				grpcConfig.onConnectionError
			)
		}
		if (grpcConfig.onReady) {
			grpcClient.on(ConnectionStatusEvent.ready, grpcConfig.onReady)
		}
		return { grpcClient: grpcClient as ZB.ZBGrpc, log }
	}

	/**
	 * If this.retry is set true, the operation will be wrapped in an configurable retry on exceptions
	 * of gRPC error code 14 - Transient Network Failure.
	 * See: https://github.com/grpc/grpc/blob/master/doc/statuscodes.md
	 * If this.retry is false, it will be executed with no retry, and the application should handle the exception.
	 * @param operation A gRPC command operation
	 */
	private async executeOperation<T>(
		operationName: string,
		operation: () => Promise<T>,
		retries?: number
	): Promise<T> {
		return this.retry
			? this.retryOnFailure({ operationName, operation, retries })
			: this.retryOnFailure({ operationName, operation, retries: 0 })
	}

	private _onConnectionError(err: Error) {
		if (!this.connected) {
			return
		}
		this.connected = false
		// const debounce =
		// 	this.lastConnectionError &&
		// 	new Date().valueOf() - this.lastConnectionError.valueOf() >
		// 		this.connectionTolerance / 2
		// if (!debounce) {
		this.onConnectionError?.(err)
		this.emit(ConnectionStatusEvent.connectionError)
		// }
		// this.lastConnectionError = new Date()
	}

	/**
	 * This function takes a gRPC operation that returns a Promise as a function, and invokes it.
	 * If the operation throws gRPC error 14, this function will continue to try it until it succeeds
	 * or retries are exhausted.
	 * @param operation A gRPC command operation that may fail if the broker is not available
	 */
	private async retryOnFailure<T>({
		operation,
		operationName,
		retries = this.maxRetries,
	}: {
		operationName: string
		operation: () => Promise<T>
		retries?: number
	}): Promise<T> {
		let connectionErrorCount = 0
		let authFailures = 0
		return promiseRetry(
			(retry, n) => {
				if (this.closing || this.grpc.channelClosed) {
					/**
					 * Should we reject instead? The idea here is that calling ZBClient.close() will allow the application to cleanly shut down.
					 * If we reject here, any pending calls will throw errors. This is probably not what the user is expecting to see.
					 */
					return Promise.resolve(null as unknown as T)
				}
				if (n > 1) {
					this.logger.logError(
						`[${operationName}]: Attempt ${n} (max: ${this.maxRetries}).`
					)
				}
				return operation().catch((err) => {
					// This could be DNS resolution, or the gRPC gateway is not reachable yet, or Backpressure
					const isNetworkError =
						(err.message.indexOf('14') === 0 ||
							err.message.indexOf('Stream removed') !== -1) &&
						!err.message.includes('partition') // Error 14 can be host unavailable (network) or partition unavailable (not network)

					const isBackpressure =
						err.message.indexOf('8') === 0 || err.code === 8

					const isAuthError = err.message.indexOf('16') === 0

					if (isNetworkError) {
						if (connectionErrorCount < 0) {
							this._onConnectionError(err)
						}
						connectionErrorCount++
					}

					if (isNetworkError || isBackpressure) {
						this.logger.logError(`[${operationName}]: ${err.message}`)
						retry(err)
					}
					// We will retry once, and only once for an auth error. This may be due to a token
					// expiry edge-case.
					// See https://github.com/camunda/camunda-8-js-sdk/issues/125
					if (isAuthError && authFailures === 0) {
						authFailures = 1
						retry(err)
					}

					// The gRPC channel will be closed if close has been called
					if (this.grpc.channelClosed) {
						return Promise.resolve(null as unknown as T)
					}
					throw err
				})
			},
			{
				forever: retries === -1,
				maxTimeout: Duration.milliseconds.from(this.maxRetryTimeout),
				retries: retries === -1 ? undefined : retries,
			}
		)
	}
}
