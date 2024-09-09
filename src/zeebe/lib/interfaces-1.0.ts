import { ClientReadableStream } from '@grpc/grpc-js'
import { Chalk } from 'chalk'
import { Response } from 'got'
import { LosslessNumber } from 'lossless-json'
import { MaybeTimeDuration } from 'typed-duration'

import { GrpcClient } from './GrpcClient'
import {
	ActivateInstruction,
	ActivateJobsRequest,
	BroadcastSignalRequest,
	BroadcastSignalResponse,
	CompleteJobRequest,
	CreateProcessInstanceRequest,
	CreateProcessInstanceResponse,
	CreateProcessInstanceWithResultRequest,
	CreateProcessInstanceWithResultResponseOnWire,
	DeleteResourceRequest,
	DeployResourceRequest,
	DeployResourceResponse,
	EvaluateDecisionRequest,
	EvaluateDecisionResponse,
	FailJobRequest,
	MigrateProcessInstanceRequest,
	MigrateProcessInstanceResponse,
	MigrationPlan,
	ModifyProcessInstanceRequest,
	ModifyProcessInstanceResponse,
	ProcessInstanceCreationStartInstruction,
	PublishMessageRequest,
	PublishMessageResponse,
	ResolveIncidentRequest,
	SetVariablesRequestOnTheWire,
	StreamActivatedJobsRequest,
	TerminateInstruction,
	ThrowErrorRequest,
	TopologyResponse,
	UpdateJobRetriesRequest,
	UpdateJobTimeoutRequest,
} from './interfaces-grpc-1.0'
import { Loglevel, ZBCustomLogger } from './interfaces-published-contract'

// The JSON-stringified version of this is sent to the ZBCustomLogger
export interface ZBLogMessage {
	timestamp: Date
	context: string
	id: string
	level: Loglevel
	message: string
	time: string
}

export interface CreateProcessBaseRequest<V extends JSONDoc> {
	/**
	 * the BPMN process ID of the process definition
	 */
	bpmnProcessId: string
	/**
	 * the version of the process; if not specified it will use the latest version
	 */
	version?: number
	/**
	 * JSON document that will instantiate the variables for the root variable scope of the
	 * process instance.
	 */
	variables: V
	/** The tenantId for a multi-tenant enabled cluster. */
	tenantId?: string
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
}

export interface CreateProcessInstanceReq<V extends JSONDoc>
	extends CreateProcessBaseRequest<V> {
	/**
	 * List of start instructions. If empty (default) the process instance
	 * will start at the start event. If non-empty the process instance will apply start
	 * instructions after it has been created
	 */
	startInstructions?: ProcessInstanceCreationStartInstruction[]
}

export interface CreateProcessInstanceWithResultReq<T extends JSONDoc>
	extends CreateProcessBaseRequest<T> {
	/**
	 * timeout in milliseconds. the request will be closed if the process is not completed before the requestTimeout.
	 * if requestTimeout = 0, uses the generic requestTimeout configured in the gateway.
	 */
	requestTimeout?: number
	/**
	 * list of names of variables to be included in `CreateProcessInstanceWithResultResponse.variables`.
	 * If empty, all visible variables in the root scope will be returned.
	 */
	fetchVariables?: string[]
}

export interface OperationOptionsWithRetry {
	maxRetries: number
	retry: true
	version?: number
}

export interface OperationOptionsNoRetry {
	retry: false
	version?: number
}

export type OperationOptions =
	| OperationOptionsWithRetry
	| OperationOptionsNoRetry

export type JSON = string | number | boolean | JSON[] | JSONDoc[] | JSONDoc

export interface JSONDoc {
	[key: string]: JSON | undefined
}

export interface IInputVariables {
	[key: string]: JSON
}

export interface IProcessVariables {
	[key: string]: JSON
}

export interface IOutputVariables {
	[key: string]: JSON
}
export interface ICustomHeaders {
	[key: string]: string | number
}

export interface JobFailureConfiguration {
	errorMessage: string
	/**
	 * If not specified, the library will decrement the "current remaining retries" count by one
	 */
	retries?: number
	/**
	 * Optional backoff for subsequent retries, in milliseconds. If not specified, it is zero.
	 */
	retryBackOff?: number
	/**
	 * Optional variable update for the job
	 */
	variables?: JSONDoc
}

declare function FailureHandler(
	errorMessage: string,
	retries?: number
): Promise<JOB_ACTION_ACKNOWLEDGEMENT>

declare function FailureHandler(
	failureConfiguration: JobFailureConfiguration
): Promise<JOB_ACTION_ACKNOWLEDGEMENT>

export interface ErrorJobWithVariables {
	variables: JSONDoc
	errorCode: string
	errorMessage?: string
}

export type ErrorJobOutcome = (
	errorCode: string | ErrorJobWithVariables,
	errorMessage?: string
) => Promise<JOB_ACTION_ACKNOWLEDGEMENT>

export interface JobCompletionInterface<WorkerOutputVariables> {
	/**
	 * Cancel the workflow.
	 */
	cancelWorkflow: () => Promise<JOB_ACTION_ACKNOWLEDGEMENT>
	/**
	 * Complete the job with a success, optionally passing in a state update to merge
	 * with the process variables on the broker.
	 */
	complete: (
		updatedVariables?: WorkerOutputVariables
	) => Promise<JOB_ACTION_ACKNOWLEDGEMENT>
	/**
	 * Fail the job with an informative message as to the cause. Optionally, pass in a
	 * value remaining retries. If no value is passed for retries then the current retry
	 * count is decremented. Pass in `0`for retries to raise an incident in Operate. Optionally,
	 * specify a retry backoff period in milliseconds. Default is 0ms (immediate retry) if not
	 * specified.
	 */
	fail: typeof FailureHandler
	/**
	 * Mark this job as forwarded to another system for completion. No action is taken by the broker.
	 * This method releases worker capacity to handle another job.
	 */
	forward: () => JOB_ACTION_ACKNOWLEDGEMENT
	/**
	 *
	 * Report a business error (i.e. non-technical) that occurs while processing a job.
	 * The error is handled in the process by an error catch event.
	 * If there is no error catch event with the specified errorCode then an incident will be raised instead.
	 */
	error: ErrorJobOutcome
}

export interface JobCompletionInterfaceRest<WorkerOutputVariables> {
	/**
	 * Cancel the workflow.
	 */
	cancelWorkflow: () => Promise<JOB_ACTION_ACKNOWLEDGEMENT>
	/**
	 * Complete the job with a success, optionally passing in a state update to merge
	 * with the process variables on the broker.
	 */
	complete: (
		updatedVariables?: WorkerOutputVariables
	) => Promise<JOB_ACTION_ACKNOWLEDGEMENT>
	/**
	 * Fail the job with an informative message as to the cause. Optionally, pass in a
	 * value remaining retries. If no value is passed for retries then the current retry
	 * count is decremented. Pass in `0`for retries to raise an incident in Operate. Optionally,
	 * specify a retry backoff period in milliseconds. Default is 0ms (immediate retry) if not
	 * specified.
	 */
	fail: typeof FailureHandler
	/**
	 * Mark this job as forwarded to another system for completion. No action is taken by the broker.
	 * This method releases worker capacity to handle another job.
	 */
	forward: () => JOB_ACTION_ACKNOWLEDGEMENT
	/**
	 *
	 * Report a business error (i.e. non-technical) that occurs while processing a job.
	 * The error is handled in the process by an error catch event.
	 * If there is no error catch event with the specified errorCode then an incident will be raised instead.
	 */
	error: (error: ErrorJobWithVariables) => Promise<JOB_ACTION_ACKNOWLEDGEMENT>
	/**
	 * Extend the timeout for the job by setting a new timeout
	 */
	modifyJobTimeout: ({
		newTimeoutMs,
	}: {
		newTimeoutMs: number
	}) => Promise<Response<string>>
}

export interface ZeebeJob<
	WorkerInputVariables = IInputVariables,
	CustomHeaderShape = ICustomHeaders,
	WorkerOutputVariables = IOutputVariables,
> extends Job<WorkerInputVariables, CustomHeaderShape>,
		JobCompletionInterface<WorkerOutputVariables> {}

export interface IZBJobWorker {
	log: (msg) => void
	debug: (msg) => void
	error: (msg) => void
}

export type ZBWorkerTaskHandler<
	WorkerInputVariables = IInputVariables,
	CustomHeaderShape = ICustomHeaders,
	WorkerOutputVariables = IOutputVariables,
> = (
	job: Readonly<
		ZeebeJob<WorkerInputVariables, CustomHeaderShape, WorkerOutputVariables>
	>,
	worker: IZBJobWorker
) => MustReturnJobActionAcknowledgement

export interface ZBLoggerOptions {
	loglevel?: Loglevel
	stdout?: ZBCustomLogger
	color?: Chalk
	longPoll?: MaybeTimeDuration
	namespace: string | string[]
	pollInterval?: MaybeTimeDuration
	taskType?: string
}

export interface ZBLoggerConfig extends ZBLoggerOptions {
	id?: string
	colorise?: boolean
	_tag: 'ZBCLIENT' | 'ZBWORKER'
}

export type ConnectionErrorHandler = (error?: unknown) => void

export interface Job<
	Variables = IInputVariables,
	CustomHeaderShape = ICustomHeaders,
> {
	/** The key, a unique identifier for the job */
	readonly key: string
	/**
	 * The job type, as defined in the BPMN process (e.g. <zeebe:taskDefinition
	 * type="payment-service" />)
	 */
	readonly type: string
	/** The job's process instance key */
	readonly processInstanceKey: string
	/** The bpmn process ID of the job process definition */
	readonly bpmnProcessId: string
	/** The version of the job process definition */
	readonly processDefinitionVersion: number
	/** The associated task element ID */
	readonly elementId: string
	/**
	 * The unique key identifying the associated task, unique within the scope of the
	 * process instance
	 */
	readonly elementInstanceKey: string
	/**
	 * A set of custom headers defined during modelling
	 */
	readonly customHeaders: Readonly<CustomHeaderShape>
	/** The name of the worker that activated this job */
	readonly worker: string
	/* The amount of retries left to this job (should always be positive) */
	readonly retries: number
	// epoch milliseconds
	readonly deadline: string
	/**
	 * All visible variables in the task scope, computed at activation time.
	 */
	readonly variables: Readonly<Variables>
	/**
	 * TenantId of the job in a multi-tenant cluster
	 */
	readonly tenantId: string
}

export interface ZBWorkerOptions<InputVars = IInputVariables> {
	/**
	 * Max concurrent tasks for this worker. Default 32.
	 */
	maxJobsToActivate?: number
	/**
	 * Max seconds to allow before time out of a job given to this worker. Default: 30s.
	 * The broker checks deadline timeouts every 30 seconds, so an
	 */
	timeout?: MaybeTimeDuration
	/**
	 * Poll Interval in ms. Default 100.
	 */
	pollInterval?: MaybeTimeDuration
	/**
	 * Constrain payload to these keys only.
	 */
	fetchVariable?: (keyof InputVars)[]
	/**
	 * This handler is called when the worker cannot connect to the broker, or loses its connection.
	 */
	onConnectionErrorHandler?: ConnectionErrorHandler
	/**
	 * If a handler throws an unhandled exception, if this is set true, the process will be failed. Defaults to false.
	 */
	failProcessOnException?: boolean
	/**
	 * Enable debug tracking
	 */
	debug?: boolean
}

export const JOB_ACTION_ACKNOWLEDGEMENT = 'JOB_ACTION_ACKNOWLEDGEMENT' as const
export type JOB_ACTION_ACKNOWLEDGEMENT = typeof JOB_ACTION_ACKNOWLEDGEMENT
export type MustReturnJobActionAcknowledgement =
	| JOB_ACTION_ACKNOWLEDGEMENT
	| Promise<JOB_ACTION_ACKNOWLEDGEMENT>

export interface ZBWorkerConfig<
	WorkerInputVariables,
	CustomHeaderShape,
	WorkerOutputVariables,
> extends ZBWorkerOptions<WorkerInputVariables> {
	/**
	 * A custom id for the worker. If none is supplied, a UUID will be generated.
	 */
	id?: string

	logNamespace?: string
	/**
	 * A custom longpoll timeout. By default long polling is every 30 seconds.
	 */
	longPoll?: MaybeTimeDuration
	/**
	 * If your Grpc connection jitters, this is the window before the connectionError
	 */
	connectionTolerance?: MaybeTimeDuration
	/**
	 * A log level if you want it to differ from the ZBClient
	 */
	loglevel?: Loglevel
	/**
	 * The capacity of the worker. When it is servicing this many jobs, it will not ask for more.
	 * It will also ask for a number of jobs that is the delta between this number and its currently
	 * active jobs, when activating jobs from the broker.
	 */
	/**
	 * An implementation of the ZBCustomLogger interface for logging
	 */
	stdout?: ZBCustomLogger
	/**
	 * The task type that this worker will request jobs for.
	 */
	taskType: string
	/**
	 * A job handler - this must return a job action - e.g.: job.complete(), job.error() - in all code paths.
	 */
	taskHandler: ZBWorkerTaskHandler<
		WorkerInputVariables,
		CustomHeaderShape,
		WorkerOutputVariables
	>
	/**
	 * This handler is called when the worker (re)establishes its connection to the broker
	 */
	onReady?: () => void
	/**
	 * This handler is called when the worker cannot connect to the broker, or loses its connection.
	 */
	onConnectionError?: () => void
	/**
	 * Provide an annotated Dto class to control the serialisation of JSON numbers. This allows you to serialise
	 * numbers as strings or BigInts to avoid precision loss. This also gives you design-time type safety.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	inputVariableDto?: { new (...args: any[]): Readonly<WorkerInputVariables> }
	/**
	 * Provide an annotated Dto class to control the serialisation of JSON numbers. This allows you to serialise
	 * numbers as strings or BigInts to avoid precision loss. This also gives you design-time type safety.
	 */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	customHeadersDto?: { new (...args: any[]): Readonly<CustomHeaderShape> }
	/**
	 * An optional array of tenantIds if you want this to be a multi-tenant worker.
	 */
	tenantIds?: string[]
}

export interface BroadcastSignalReq {
	// The name of the signal
	signalName: string

	// the signal variables as a JSON document; to be valid, the root of the document must be an
	// object, e.g. { "a": "foo" }. [ "foo" ] would not be valid.
	variables?: JSONDoc

	// Optional tenantId for a multi-tenant enabled cluster. This could also be supplied via environment variable.
	tenantId?: string
}

export interface BroadcastSignalRes {
	// the unique ID of the signal that was broadcasted.
	key: string
}

export interface ResolveIncidentReq {
	readonly incidentKey: string
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
}

export interface UpdateJobRetriesReq {
	readonly jobKey: string
	retries: number
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
}

export interface UpdateJobTimeoutReq {
	readonly jobKey: string
	/** the duration of the new timeout in ms, starting from the current moment */
	timeout: number
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
}

export interface ModifyProcessInstanceReq {
	/** the key of the process instance that should be modified */
	processInstanceKey: string
	/**
	 * instructions describing which elements should be activated in which scopes,
	 * and which variables should be created
	 */
	activateInstructions?: ActivateInstruction[]
	/** instructions describing which elements should be terminated */
	terminateInstructions?: TerminateInstruction[]
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
}

export interface MigrateProcessInstanceReq {
	// key of the process instance to migrate
	processInstanceKey: string
	// the migration plan that defines target process and element mappings
	migrationPlan: MigrationPlan
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: string
}

export interface ZBGrpc extends GrpcClient {
	completeJobSync: (req: CompleteJobRequest) => Promise<void>
	activateJobsStream: (
		req: ActivateJobsRequest
	) => ClientReadableStream<unknown>
	publishMessageSync(
		publishMessageRequest: PublishMessageRequest
	): Promise<PublishMessageResponse>
	throwErrorSync(throwErrorRequest: ThrowErrorRequest): Promise<void>
	topologySync(): Promise<TopologyResponse>
	updateJobRetriesSync(
		updateJobRetriesRequest: UpdateJobRetriesRequest
	): Promise<void>
	updateJobTimeoutSync(
		updateJobTimeoutRequest: UpdateJobTimeoutRequest
	): Promise<void>
	deleteResourceSync: (
		deleteResourceRequest: DeleteResourceRequest
	) => Promise<Record<string, never>>
	deployResourceSync<T>(
		resource: DeployResourceRequest
	): Promise<DeployResourceResponse<T>>
	evaluateDecisionSync(
		evaluateDecisionRequest: EvaluateDecisionRequest
	): Promise<EvaluateDecisionResponse>
	failJobSync(failJobRequest: FailJobRequest): Promise<void>
	createProcessInstanceSync(
		createProcessInstanceRequest: CreateProcessInstanceRequest
	): Promise<CreateProcessInstanceResponse>
	createProcessInstanceWithResultSync(
		createProcessInstanceWithResultRequest: CreateProcessInstanceWithResultRequest
	): Promise<CreateProcessInstanceWithResultResponseOnWire>
	cancelProcessInstanceSync(processInstanceKey: {
		processInstanceKey: string | number
		operationReference?: string
	}): Promise<void>
	migrateProcessInstanceSync(
		request: MigrateProcessInstanceRequest
	): Promise<MigrateProcessInstanceResponse>
	modifyProcessInstanceSync(
		request: ModifyProcessInstanceRequest
	): Promise<ModifyProcessInstanceResponse>
	setVariablesSync(request: SetVariablesRequestOnTheWire): Promise<void>
	streamActivatedJobsStream: (
		req: StreamActivatedJobsRequest
	) => Promise<ClientReadableStream<unknown>>
	resolveIncidentSync(
		resolveIncidentRequest: ResolveIncidentRequest
	): Promise<void>
	broadcastSignalSync(
		signal: BroadcastSignalRequest
	): Promise<BroadcastSignalResponse>
}
