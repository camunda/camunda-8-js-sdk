import { LosslessNumber } from 'lossless-json'
import { MaybeTimeDuration } from 'typed-duration'

import { IInputVariables, IProcessVariables, JSONDoc } from './interfaces-1.0'

export interface StreamActivatedJobsRequest {
	/**
	 * the job type, as defined in the BPMN process (e.g. <zeebe:taskDefinition type="payment-service" />)
	 */
	type: string
	/**
	 * the name of the worker activating the jobs, mostly used for logging purposes
	 */
	worker: string
	/**
	 * a job returned after this call will not be activated by another call until the
	 * timeout (in ms) has been reached
	 */
	timeout: MaybeTimeDuration
	/**
	 * a list of variables to fetch as the job variables; if empty, all visible variables at
	 * the time of activation for the scope of the job will be returned
	 */
	fetchVariable?: string[]
	/**
	 * a list of identifiers of tenants for which to stream jobs
	 */
	tenantIds: string[]
	/**
	 * the tenant filtering strategy — determines whether to use provided tenant IDs
	 * or assigned tenant IDs. Defaults to PROVIDED.
	 */
	tenantFilter?: TenantFilter
}

/**
 * Request object to send the broker to request jobs for the worker.
 */
export interface ActivateJobsRequest {
	/**
	 * The job type, as defined in the BPMN process (e.g. <zeebe:taskDefinition
	 * type="payment-service" />)
	 */
	type: string
	/** The name of the worker activating the jobs, mostly used for logging purposes */
	worker: string
	/**
	 * The duration the broker allows for jobs activated by this call to complete
	 * before timing them out releasing them for retry on the broker.
	 * The broker checks time outs every 30 seconds, so the broker timeout is guaranteed in at-most timeout + 29s
	 * be guaranteed.
	 */
	timeout: MaybeTimeDuration
	/**
	 * The maximum jobs to activate by this request
	 */
	maxJobsToActivate: number
	/**
	 * A list of variables to fetch as the job variables; if empty, all visible variables at
	 * the time of activation for the scope of the job will be returned
	 */
	fetchVariable?: string[]
	/**
	 * The request will be completed when atleast one job is activated or after the requestTimeout.
	 * if the requestTimeout = 0, the request will be completed after a default configured timeout in the broker.
	 * To immediately complete the request when no job is activated set the requestTimeout to a negative value
	 *
	 */
	requestTimeout?: MaybeTimeDuration
	/**
	 * a list of IDs of tenants for which to activate jobs
	 */
	tenantIds?: string[]
	/**
	 * the tenant filtering strategy — determines whether to use provided tenant IDs
	 * or assigned tenant IDs. Defaults to PROVIDED.
	 */
	tenantFilter?: TenantFilter
}

export interface ActivatedJob {
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
	/** The key of the job process definition */
	readonly processDefinitionKey: string
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
	readonly customHeaders: string
	/** The name of the worker that activated this job */
	readonly worker: string
	/* The amount of retries left to this job (should always be positive) */
	readonly retries: number
	/**
	 * When the job will timeout on the broker if it is not completed by this worker.
	 * In epoch milliseconds
	 */
	readonly deadline: string
	/**
	 * All visible variables in the task scope, computed at activation time, constrained by any
	 * fetchVariables value in the ActivateJobRequest.
	 */
	readonly variables: string
	/**
	 * the id of the tenant that owns the job
	 */
	readonly tenantId: string
	/** Contains user task properties if the job is of kind TASK_LISTENER */
	readonly userTask?: UserTaskProperties
	/** the kind of the job */
	readonly kind?: JobKind
	/** the listener event type of the job */
	readonly listenerEventType?: ListenerEventType
	/** the list of tags */
	readonly tags?: string[]
}

export interface ActivateJobsResponse {
	jobs: ActivatedJob[]
}

export interface CreateProcessInstanceBaseRequest {
	/** the unique key identifying the process definition (alternative to bpmnProcessId+version) */
	processDefinitionKey?: string
	/** the BPMN process ID of the process definition */
	bpmnProcessId: string
	/** the version of the process; if not specified it will use the latest version */
	version?: number
	/**
	 * JSON document that will instantiate the variables for the root variable scope of the
	 * process instance.
	 */
	variables: string
	/**
	 * the tenant id of the process definition
	 */
	tenantId?: string
}

export interface CreateProcessInstanceRequest
	extends CreateProcessInstanceBaseRequest {
	/**
	 * List of start instructions. If empty (default) the process instance
	 * will start at the start event. If non-empty the process instance will apply start
	 * instructions after it has been created
	 */
	startInstructions: ProcessInstanceCreationStartInstruction[]
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: string
	/**
	 * a list of runtime instructions that can modify the behavior of the process
	 * instance during its execution. If empty (default), the process instance will
	 * be executed normally.
	 */
	runtimeInstructions?: ProcessInstanceCreationRuntimeInstruction[]
	/** a list of tags that can be attached as meta-data to process instances */
	tags?: string[]
	/**
	 * an optional, user-defined string identifier that identifies the process
	 * instance within the scope of the process definition (scoped by tenant). If
	 * provided and uniqueness enforcement is enabled, the engine will reject
	 * creation if another root process instance with the same business id is
	 * already active for the same process definition.
	 */
	businessId?: string
}

export interface ProcessInstanceCreationStartInstruction {
	/**
	 * future extensions might include
	 * - different types of start instructions
	 * - ability to set local variables for different flow scopes
	 * for now, however, the start instruction is implicitly a
	 * "startBeforeElement" instruction
	 */
	elementId: string
}

export interface CreateProcessInstanceResponse {
	/**
	 * The unique key identifying the process definition (e.g. returned from a process
	 * in the DeployResourceResponse message)
	 */
	readonly processDefinitionKey: string
	/**
	 * The BPMN process ID of the process definition
	 */
	readonly bpmnProcessId: string
	/**
	 * The version of the process; set to -1 to use the latest version
	 */
	readonly version: number
	/**
	 * Stringified JSON document that will instantiate the variables for the root variable scope of the
	 * process instance; it must be a JSON object, as variables will be mapped in a
	 * key-value fashion. e.g. { "a": 1, "b": 2 } will create two variables, named "a" and
	 * "b" respectively, with their associated values. [{ "a": 1, "b": 2 }] would not be a\
	 * valid argument, as the root of the JSON document is an array and not an object.
	 */
	readonly processInstanceKey: string
	/**
	 * the tenant identifier of the created process instance
	 */
	readonly tenantId: string
	/** tags attached to the process instance */
	readonly tags?: string[]
	/** the business id of the created process instance */
	readonly businessId?: string
}

export interface CreateProcessInstanceWithResultRequest {
	request: CreateProcessInstanceBaseRequest
	/**
	 * timeout in milliseconds. the request will be closed if the process is not completed before the requestTimeout.
	 * if requestTimeout = 0, uses the generic requestTimeout configured in the gateway.
	 */
	requestTimeout: number
	/**
	 * list of names of variables to be included in `CreateProcessInstanceWithResultResponse.variables`.
	 * If empty, all visible variables in the root scope will be returned.
	 */
	fetchVariables?: string[]
}

interface CreateProcessInstanceWithResultResponseBase {
	/**
	 * the key of the process definition which was used to create the process instance
	 */
	readonly processDefinitionKey: string
	/**
	 * the BPMN process ID of the process definition which was used to create the process
	 * instance
	 */
	readonly bpmnProcessId: string
	/**
	 * the version of the process definition which was used to create the process instance
	 */
	readonly version: number
	/**
	 * the unique identifier of the created process instance; to be used wherever a request
	 * needs a process instance key (e.g. CancelProcessInstanceRequest)
	 */
	readonly processInstanceKey: string
	/**
	 * the tenant identifier of the process definition
	 */
	readonly tenantId: string
	/** tags attached to the process instance */
	readonly tags?: string[]
	/** the business id of the created process instance */
	readonly businessId?: string
}

export interface CreateProcessInstanceWithResultResponse<Result>
	extends CreateProcessInstanceWithResultResponseBase {
	/**
	 * consisting of all visible variables to the root scope
	 */
	readonly variables: Result
}

export interface CreateProcessInstanceWithResultResponseOnWire
	extends CreateProcessInstanceWithResultResponseBase {
	/**
	 * consisting of all visible variables to the root scope
	 */
	readonly variables: string
}

/**
 * Describes the Raft role of the broker for a given partition
 */
export enum PartitionBrokerRole {
	LEADER = 'LEADER',
	FOLLOWER = 'FOLLOWER',
	INACTIVE = 'INACTIVE',
}

/**
 * Describes the current health of the partition
 */
export enum PartitionBrokerHealth {
	HEALTHY = 'HEALTHY',
	UNHEALTHY = 'UNHEALTHY',
	DEAD = 'DEAD',
}

export interface Partition {
	partitionId: number
	/** the role of the broker for this partition */
	role: PartitionBrokerRole
	/** the health of this partition */
	health: PartitionBrokerHealth
}

export interface BrokerInfo {
	nodeId: number
	host: string
	port: number
	partitions: Partition[]
	/** broker version */
	version?: string
}

export interface TopologyResponse {
	readonly brokers: BrokerInfo[]
	readonly clusterSize: number
	readonly partitionsCount: number
	readonly replicationFactor: number
	readonly gatewayVersion: string
	/** the cluster's unique ID */
	readonly clusterId?: string
}

export interface ProcessRequestObject {
	name?: string
	definition: Buffer // bytes, actually
}

export interface ProcessMetadata {
	/**
	 * the bpmn process ID, as parsed during deployment; together with the version forms a
	 * unique identifier for a specific process definition
	 */
	readonly bpmnProcessId: string
	/** the assigned process version */
	readonly version: number
	/** the assigned key, which acts as a unique identifier for this process */
	readonly processDefinitionKey: string
	/**
	 * the resource name (see: ProcessRequestObject.name) from which this process was
	 * parsed
	 */
	readonly resourceName: string
	/**
	 * the tenant identifier of the deployed process
	 */
	tenantId: string
}

export interface DecisionMetadata {
	/**
	 * the dmn decision ID, as parsed during deployment; together with the
	 * versions forms a unique identifier for a specific decision
	 */
	dmnDecisionId: string
	/** the dmn name of the decision, as parsed during deployment */
	dmnDecisionName: string
	/** the assigned decision version */
	version: number
	/**
	 * the assigned decision key, which acts as a unique identifier for this
	 * decision
	 */
	decisionKey: string
	/**
	 * the dmn ID of the decision requirements graph that this decision is part
	 * of, as parsed during deployment
	 */
	dmnDecisionRequirementsId: string
	/**
	 * the assigned key of the decision requirements graph that this decision is
	 * part of
	 */
	decisionRequirementsKey: string
	/** the tenant id of the deployed decision */
	tenantId: string
}

export interface DecisionRequirementsMetadata {
	/**
	 * the dmn decision requirements ID, as parsed during deployment; together
	 * with the versions forms a unique identifier for a specific decision
	 */
	dmnDecisionRequirementsId: string
	/** the dmn name of the decision requirements, as parsed during deployment */
	dmnDecisionRequirementsName: string
	/** the assigned decision requirements version */
	version: number
	/**
	 * the assigned decision requirements key, which acts as a unique identifier
	 * for this decision requirements
	 */
	decisionRequirementsKey: string
	/**
	 * the resource name (see: Resource.name) from which this decision
	 * requirements was parsed
	 */
	resourceName: string
	/** the tenant id of the deployed decision requirements */
	tenantId: string
}

export interface FormMetadata {
	/**
	 * the form ID, as parsed during deployment; together with the
	 * versions forms a unique identifier for a specific form
	 */
	readonly formId: string
	/** the assigned form version */
	readonly version: number
	/** the assigned key, which acts as a unique identifier for this form */
	readonly formKey: string
	/** the resource name */
	readonly resourceName: string
	/** the tenant id of the deployed form */
	readonly tenantId: string
}

export interface ProcessDeployment {
	process: ProcessMetadata
}
export interface DecisionDeployment {
	decision: DecisionMetadata
}
export interface DecisionRequirementsDeployment {
	decisionRequirements: DecisionRequirementsMetadata
}

export interface FormDeployment {
	form: FormMetadata
}

export type Deployment =
	| ProcessDeployment
	| DecisionDeployment
	| DecisionRequirementsDeployment
	| FormDeployment

export interface DeployResourceResponse<T> {
	/** the unique key identifying the deployment */
	readonly key: string
	/** a list of deployed resources, e.g. processes */
	readonly deployments: T[]
	/** the tenant id of the deployed resources */
	tenantId: string
}

export interface DeployResourceRequest {
	/** list of resources to deploy */
	resources: Resource[]
	/**
	 * the tenant id of the resources to deploy
	 */
	tenantId?: string
}

export interface Resource {
	/** the resource name, e.g. myProcess.bpmn or myDecision.dmn */
	name: string
	/** the file content as a UTF8-encoded string */
	content: Buffer
}

export interface ListProcessResponse {
	readonly processes: ProcessMetadata[]
}

export interface PublishMessageRequest<Variables = IInputVariables> {
	/** Should match the "Message Name" in a BPMN Message Catch  */
	name: string
	/** The value to match with the field specified as "Subscription Correlation Key" in BPMN */
	correlationKey: string
	/** The number of seconds for the message to buffer on the broker, awaiting correlation. Omit or set to zero for no buffering. */
	timeToLive?: MaybeTimeDuration
	/** Unique ID for this message */
	messageId?: string
	variables?: Variables
	/** the tenantId of the message */
	tenantId?: string
}

export interface PublishMessageResponse {
	/** the unique ID of the message that was published */
	key: string
	/** the tenantId of the message */
	tenantId: string
}

export interface PublishStartMessageRequest<Variables = IProcessVariables> {
	/** Should match the "Message Name" in a BPMN Message Catch  */
	name: string
	/**
	 * The number of seconds for the message to buffer on the broker, awaiting correlation.
	 * Omit or set to zero for no buffering.
	 */
	timeToLive: MaybeTimeDuration
	/** Unique ID for this message */
	messageId?: string
	correlationKey?: string
	variables: Variables
	/** the tenantId for the message */
	tenantId?: string
}

export interface UpdateJobRetriesRequest {
	readonly jobKey: string
	retries: number
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: string
}

export interface UpdateJobTimeoutRequest {
	readonly jobKey: string
	/** the duration of the new timeout in ms, starting from the current moment */
	timeout: number
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: string
}

export interface FailJobRequest {
	readonly jobKey: string
	retries: number
	errorMessage: string
	retryBackOff: number
	variables?: JSONDoc
}

export interface ThrowErrorRequest {
	/** the unique job identifier, as obtained when activating the job */
	jobKey: string
	/** the error code that will be matched with an error catch event */
	errorCode: string
	/** an optional error message that provides additional context */
	errorMessage?: string
	/**
	 * JSON document that will instantiate the variables at the local scope of the error catch
	 * event that catches the thrown error; it must be a JSON object, as variables will be mapped in a
	 * key-value fashion. e.g. { "a": 1, "b": 2 } will create two variables, named "a" and
	 * "b" respectively, with their associated values. [{ "a": 1, "b": 2 }] would not be a
	 * valid argument, as the root of the JSON document is an array and not an object.
	 */
	variables?: JSONDoc
}

export interface CompleteJobRequest<Variables = IProcessVariables> {
	readonly jobKey: string
	variables: Variables
	/**
	 * The result of the completed job as determined by the worker.
	 * This functionality is currently supported only by user task listeners
	 * and ad-hoc subprocess workers.
	 */
	result?: JobResult
}

interface SetVariablesRequestBase {
	/*
	The unique identifier of a particular element; can be the process instance key (as
	obtained during instance creation), or a given element, such as a service task (see
	elementInstanceKey on the Job message)
	*/
	readonly elementInstanceKey: string
	/**
	 *  if true, the variables will be merged strictly into the local scope (as indicated by
	 *  elementInstanceKey); this means the variables is not propagated to upper scopes.
	 *  for example, let's say we have two scopes, '1' and '2', with each having effective variables as:
	 * 1 => `{ "foo" : 2 }`, and 2 => `{ "bar" : 1 }`. if we send an update request with
	 * elementInstanceKey = 2, variables `{ "foo" : 5 }`, and local is true, then scope 1 will
	 * be unchanged, and scope 2 will now be `{ "bar" : 1, "foo" 5 }`. if local was false, however,
	 * then scope 1 would be `{ "foo": 5 }`, and scope 2 would be `{ "bar" : 1 }`.
	 */
	local: boolean
}
export interface SetVariablesRequest<Variables = IProcessVariables>
	extends SetVariablesRequestBase {
	variables: Partial<Variables>
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
}

export interface SetVariablesRequestOnTheWire extends SetVariablesRequestBase {
	variables: string
	operationReference?: string
}

export interface ResolveIncidentRequest {
	readonly incidentKey: string
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: string
}

export interface ActivateInstruction {
	/** the id of the element that should be activated */
	elementId: string
	/**
	 * the key of the ancestor scope the element instance should be created in;
	 * set to -1 to create the new element instance within an existing element
	 * instance of the flow scope
	 */
	ancestorElementInstanceKey: string
	/** instructions describing which variables should be created */
	variableInstructions: VariableInstruction[]
}

export interface VariableInstruction {
	/**
	 * JSON document that will instantiate the variables for the root variable scope of the
	 * process instance; it must be a JSON object, as variables will be mapped in a
	 * key-value fashion. e.g. { "a": 1, "b": 2 } will create two variables, named "a" and
	 * "b" respectively, with their associated values. [{ "a": 1, "b": 2 }] would not be a
	 * valid argument, as the root of the JSON document is an array and not an object.
	 */
	variables: JSONDoc
	/**
	 * the id of the element in which scope the variables should be created;
	 * leave empty to create the variables in the global scope of the process instance
	 */
	scopeId: string
}

export interface TerminateInstruction {
	/** the id of the element that should be terminated */
	elementInstanceKey: string
}

export interface ModifyProcessInstanceRequest {
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
	operationReference?: string
	/** instructions describing which elements should be moved from one scope to another */
	moveInstructions?: MoveInstruction[]
}

export type ModifyProcessInstanceResponse = Record<string, never>

export interface MigrateProcessInstanceRequest {
	// key of the process instance to migrate
	processInstanceKey: string
	// the migration plan that defines target process and element mappings
	migrationPlan: MigrationPlan
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: string
}

export interface MigrationPlan {
	// the key of process definition to migrate the process instance to
	targetProcessDefinitionKey: string
	// the mapping instructions describe how to map elements from the source process definition to the target process definition
	mappingInstructions: MappingInstruction[]
}

export interface MappingInstruction {
	// the element id to migrate from
	sourceElementId: string
	// the element id to migrate into
	targetElementId: string
}

export type MigrateProcessInstanceResponse = Record<string, never>

export type EvaluateDecisionRequest =
	| {
			/**
			 * the unique key identifying the decision to be evaluated (e.g. returned
			 * from a decision in the DeployResourceResponse message)
			 */
			decisionKey: string
			/**
			 * JSON document that will instantiate the variables for the decision to be
			 * evaluated; it must be a JSON object, as variables will be mapped in a
			 * key-value fashion, e.g. { "a": 1, "b": 2 } will create two variables,
			 * named "a" and "b" respectively, with their associated values.
			 * [{ "a": 1, "b": 2 }] would not be a valid argument, as the root of the
			 * JSON document is an array and not an object.
			 */
			variables: JSONDoc
			/**
			 * the tenant identifier of the decision
			 */
			tenantId?: string
	  }
	| {
			/** the ID of the decision to be evaluated */
			decisionId: string
			/**
			 * JSON document that will instantiate the variables for the decision to be
			 * evaluated; it must be a JSON object, as variables will be mapped in a
			 * key-value fashion, e.g. { "a": 1, "b": 2 } will create two variables,
			 * named "a" and "b" respectively, with their associated values.
			 * [{ "a": 1, "b": 2 }] would not be a valid argument, as the root of the
			 * JSON document is an array and not an object.
			 */
			variables: JSONDoc
			/**
			 * the tenant identifier of the decision
			 */
			tenantId?: string
	  }

export interface EvaluateDecisionResponse {
	/**
	 * the unique key identifying the decision which was evaluated (e.g. returned
	 * from a decision in the DeployResourceResponse message)
	 */
	decisionKey: string
	/** the ID of the decision which was evaluated */
	decisionId: string
	/** the name of the decision which was evaluated */
	decisionName: string
	/** the version of the decision which was evaluated */
	decisionVersion: number
	/**
	 * the ID of the decision requirements graph that the decision which was
	 * evaluated is part of.
	 */
	decisionRequirementsId: string
	/**
	 * the unique key identifying the decision requirements graph that the
	 * decision which was evaluated is part of.
	 */
	decisionRequirementsKey: string
	/**
	 * JSON document that will instantiate the result of the decision which was
	 * evaluated; it will be a JSON object, as the result output will be mapped
	 * in a key-value fashion, e.g. { "a": 1 }.
	 */
	decisionOutput: string
	/** a list of decisions that were evaluated within the requested decision evaluation */
	evaluatedDecisions: EvaluatedDecision[]
	/**
	 * an optional string indicating the ID of the decision which
	 * failed during evaluation
	 */
	failedDecisionId: string
	/** an optional message describing why the decision which was evaluated failed */
	failureMessage: string
	/** the tenant identifier of the decision */
	tenantId?: string
	/**
	 * the unique key identifying this decision evaluation.
	 * @deprecated please refer to decisionEvaluationKey
	 */
	decisionInstanceKey?: string
	/** the unique key identifying this decision evaluation */
	decisionEvaluationKey?: string
}

export interface EvaluatedDecision {
	/**
	 * the unique key identifying the decision which was evaluated (e.g. returned
	 * from a decision in the DeployResourceResponse message)
	 */
	decisionKey: string
	/** the ID of the decision which was evaluated */
	decisionId: string
	/** the name of the decision which was evaluated */
	decisionName: string
	/** the version of the decision which was evaluated */
	decisionVersion: number
	/** the type of the decision which was evaluated */
	decisionType: string
	/**
	 * JSON document that will instantiate the result of the decision which was
	 * evaluated; it will be a JSON object, as the result output will be mapped
	 * in a key-value fashion, e.g. { "a": 1 }.
	 */
	decisionOutput: string
	/** the decision rules that matched within this decision evaluation */
	matchedRules: MatchedDecisionRule[]
	/** the decision inputs that were evaluated within this decision evaluation */
	evaluatedInputs: EvaluatedDecisionInput[]
	/** the tenant identifier of the evaluated decision */
	tenantId: string
	/** the key of the decision evaluation instance */
	decisionEvaluationInstanceKey?: string
}

export interface EvaluatedDecisionInput {
	/** the id of the evaluated decision input */
	inputId: string
	/** the name of the evaluated decision input */
	inputName: string
	/** the value of the evaluated decision input */
	inputValue: string
}

export interface EvaluatedDecisionOutput {
	/** the id of the evaluated decision output */
	outputId: string
	/** the name of the evaluated decision output */
	outputName: string
	/** the value of the evaluated decision output */
	outputValue: string
}

export interface MatchedDecisionRule {
	/** the id of the matched rule */
	ruleId: string
	/** the index of the matched rule */
	ruleIndex: number
	/** the evaluated decision outputs */
	evaluatedOutputs: EvaluatedDecisionOutput[]
}

export interface DeleteResourceRequest {
	/**
	 * The key of the resource that should be deleted. This can either be the key
	 * of a process definition, the key of a decision requirements definition or the key of a form.
	 */
	resourceKey: string
	/** a reference key chosen by the user and will be part of all records resulted from this operation */
	operationReference?: number | LosslessNumber
	/**
	 * Indicates if the historic data of a process resource should be deleted via
	 * a batch operation asynchronously. Only effective for process resources.
	 */
	deleteHistory?: boolean
}

export interface BroadcastSignalRequest {
	/** The name of the signal */
	signalName: string

	/**
	 * the signal variables as a JSON document; to be valid, the root of the document must be an
	 * object, e.g. { "a": "foo" }. [ "foo" ] would not be valid.
	 */
	variables: string
	/** the id of the tenant that owns the signal. */
	tenantId?: string
}

export interface BroadcastSignalResponse {
	/** the unique ID of the signal that was broadcasted. */
	key: string
	/** the tenant id of the signal that was broadcasted. */
	tenantId?: string
}

// -- Added in 8.9 ------------------------------------------------------------
// The following types mirror additive surfaces from gateway.proto. New fields
// on existing types are spliced into their existing interfaces above; new
// top-level types are appended here.

/**
 * Describes the tenant filtering strategy for job activation.
 * - `PROVIDED` (default): use the tenant IDs in `tenantIds`
 * - `ASSIGNED`: use the tenant IDs assigned to the authenticated identity
 */
export enum TenantFilter {
	PROVIDED = 'PROVIDED',
	ASSIGNED = 'ASSIGNED',
}

/** Describes the kind of job. */
export enum JobKind {
	BPMN_ELEMENT = 'BPMN_ELEMENT',
	EXECUTION_LISTENER = 'EXECUTION_LISTENER',
	TASK_LISTENER = 'TASK_LISTENER',
	AD_HOC_SUB_PROCESS = 'AD_HOC_SUB_PROCESS',
}

/** Describes the listener event type of the job. */
export enum ListenerEventType {
	ASSIGNING = 'ASSIGNING',
	CANCELING = 'CANCELING',
	COMPLETING = 'COMPLETING',
	CREATING = 'CREATING',
	END = 'END',
	START = 'START',
	UNSPECIFIED = 'UNSPECIFIED',
	UPDATING = 'UPDATING',
}

/**
 * User task properties attached to an ActivatedJob when the job is of kind
 * TASK_LISTENER.
 */
export interface UserTaskProperties {
	/** The action performed on the user task (e.g., "claim", "update", "complete"). */
	readonly action?: string
	/** The user assigned to the task. */
	readonly assignee?: string
	/** The list of candidate groups for the user task. */
	readonly candidateGroups?: string[]
	/** The list of candidate users for the user task. */
	readonly candidateUsers?: string[]
	/** The list of attributes that were changed in the user task. */
	readonly changedAttributes?: string[]
	/** The due date of the user task in ISO 8601 format. */
	readonly dueDate?: string
	/** The follow-up date of the user task in ISO 8601 format. */
	readonly followUpDate?: string
	/** The key of the form associated with the user task. */
	readonly formKey?: string
	/** The priority of the user task (0-100). */
	readonly priority?: number
	/** The unique key identifying the user task. */
	readonly userTaskKey?: string
}

/**
 * The result of a completed job as determined by the worker. Currently
 * supported only by user task listeners (set `type: 'userTask'`) and ad-hoc
 * subprocess workers (set `type: 'adHocSubProcess'`).
 */
export interface JobResult {
	/**
	 * Indicates whether the worker denies the work, i.e. explicitly does not
	 * approve it. For example, a user task listener can deny the completion of a
	 * user task by setting this flag to true. As a result, the completion
	 * request is rejected and the task remains active. Defaults to false.
	 */
	denied?: boolean
	/** Attributes that were corrected by the worker. */
	corrections?: JobResultCorrections
	/** The reason provided by the user task listener for denying the work. */
	deniedReason?: string
	/**
	 * Used to distinguish between different types of job results.
	 * Must be one of `"userTask"` | `"adHocSubProcess"`. Defaults to `"userTask"`.
	 */
	type?: 'userTask' | 'adHocSubProcess'
	/**
	 * The list of elements that should be activated after the job is completed.
	 * Only relevant for ad-hoc subprocesses.
	 */
	activateElements?: JobResultActivateElement[]
	/**
	 * Indicates whether the completion condition of the job is fulfilled.
	 * Only relevant for ad-hoc subprocesses.
	 */
	isCompletionConditionFulfilled?: boolean
	/**
	 * Indicates whether active instances of the ad-hoc subprocess should be
	 * cancelled. Only relevant for ad-hoc subprocesses.
	 */
	isCancelRemainingInstances?: boolean
}

/**
 * Attributes that can be corrected by a user task listener worker. Omitting
 * any attribute preserves the persisted value.
 */
export interface JobResultCorrections {
	/** The assignee of the task. Provide an empty string to clear. */
	assignee?: string
	/** The due date of the task. Provide an empty string to clear. */
	dueDate?: string
	/** The follow-up date of the task. Provide an empty string to clear. */
	followUpDate?: string
	/** The list of candidate users of the task. Provide an empty list to clear. */
	candidateUsers?: StringList
	/** The list of candidate groups of the task. Provide an empty list to clear. */
	candidateGroups?: StringList
	/** The priority of the task. 0-100, default 50. */
	priority?: number
}

/** A wrapper for a list of strings (mirrors the proto `StringList` message). */
export interface StringList {
	values: string[]
}

/**
 * An element to activate after a job is completed. Only relevant for ad-hoc
 * subprocess workers.
 */
export interface JobResultActivateElement {
	/** The id of the element to activate. */
	elementId: string
	/**
	 * JSON document of variables that will be created on the scope of the
	 * activated element. The root must be a JSON object.
	 */
	variables: string
}

/**
 * Runtime instructions that can modify process-instance behaviour during
 * execution.
 */
export interface ProcessInstanceCreationRuntimeInstruction {
	/** Terminate-after-element instruction. */
	terminate?: TerminateProcessInstanceInstruction
}

export interface TerminateProcessInstanceInstruction {
	/**
	 * The ID of the process element after which the process instance should be
	 * terminated.
	 */
	afterElementId: string
}

/**
 * Move-instruction for ModifyProcessInstance. Allows moving an active element
 * instance from one scope to another.
 */
export interface MoveInstruction {
	/** the key of the element instance that should be moved */
	sourceElementInstanceKey: string
	/** the id of the elements that should be moved */
	sourceElementId: string
	/** the id of the element scope that the elements should be moved to */
	targetElementId: string
	/** instructions describing which variables should be created */
	variableInstructions?: VariableInstruction[]
	/**
	 * the key of the ancestor scope the element instance should be created in;
	 * set to `-1` to create the new element instance within an existing element
	 * instance of the flow scope
	 */
	ancestorElementInstanceKey?: string
	/**
	 * whether to use the source element hierarchy to infer the ancestor element
	 * instance key
	 */
	inferAncestorScopeFromSourceHierarchy?: boolean
	/**
	 * whether to use the source's direct parent key as the ancestor scope key;
	 * a simpler alternative to `inferAncestorScopeFromSourceHierarchy` that
	 * skips hierarchy traversal.
	 */
	useSourceParentKeyAsAncestorScopeKey?: boolean
}

export interface SetVariablesResponse {
	/** the unique key of the set variables command */
	readonly key: string
}

/** Batch-operation types created by the engine for asynchronous operations. */
export enum BatchOperationTypeEnum {
	ADD_VARIABLE = 'ADD_VARIABLE',
	CANCEL_PROCESS_INSTANCE = 'CANCEL_PROCESS_INSTANCE',
	DELETE_DECISION_DEFINITION = 'DELETE_DECISION_DEFINITION',
	DELETE_PROCESS_DEFINITION = 'DELETE_PROCESS_DEFINITION',
	DELETE_PROCESS_INSTANCE = 'DELETE_PROCESS_INSTANCE',
	MIGRATE_PROCESS_INSTANCE = 'MIGRATE_PROCESS_INSTANCE',
	MODIFY_PROCESS_INSTANCE = 'MODIFY_PROCESS_INSTANCE',
	RESOLVE_INCIDENT = 'RESOLVE_INCIDENT',
	UPDATE_VARIABLE = 'UPDATE_VARIABLE',
	DELETE_DECISION_INSTANCE = 'DELETE_DECISION_INSTANCE',
}

/** Result handle for an asynchronous batch operation created by the engine. */
export interface BatchOperationCreatedResult {
	/** The batch operation key created by the engine. */
	readonly batchOperationKey: string
	/** The kind of batch operation that was created. */
	readonly batchOperationType: BatchOperationTypeEnum
}

/**
 * Response shape for `DeleteResource`. Prior to 8.9 this RPC returned an empty
 * message; from 8.9 it includes the resource key and, when `deleteHistory` was
 * requested for a process resource, a `BatchOperationCreatedResult` handle.
 */
export interface DeleteResourceResponse {
	/** The system-assigned key for this resource, requested to be deleted. */
	readonly resourceKey: string
	/**
	 * The batch operation created for asynchronously deleting the historic
	 * data. Only populated when the request set `deleteHistory: true` and the
	 * resource is a process definition. Absent for other resource types
	 * (decisions, forms, generic resources).
	 */
	readonly batchOperation?: BatchOperationCreatedResult
}

/**
 * Request to evaluate root-level conditional start events for a tenant.
 *
 * Only root-level conditional start events of process definitions belonging
 * to the given tenant are considered. Optionally restrict to a single process
 * definition by `processDefinitionKey`.
 */
export interface EvaluateConditionalRequest {
	/**
	 * Tenant whose process definitions are considered for evaluation. Only
	 * root-level conditional start events of process definitions belonging to
	 * this tenant are evaluated.
	 */
	tenantId: string
	/**
	 * Restrict evaluation to root-level conditional start events of the
	 * process definition with the given key.
	 */
	processDefinitionKey?: string
	/**
	 * Serialised JSON object representing the variables to use for evaluation
	 * of the conditions and to pass to the process instances that are
	 * triggered.
	 */
	variables: string
}

/** A handle to a process instance created by an EvaluateConditional call. */
export interface ProcessInstanceReference {
	/** The key of the process definition. */
	readonly processDefinitionKey: string
	/** The key of the created process instance. */
	readonly processInstanceKey: string
}

/**
 * Response from `EvaluateConditional`. If no root-level conditional start
 * event evaluates to true, `processInstances` is empty.
 */
export interface EvaluateConditionalResponse {
	/** Process instances created by the evaluation. */
	readonly processInstances: ProcessInstanceReference[]
	/** The unique key of the conditional evaluation operation. */
	readonly conditionalEvaluationKey: string
	/** The tenant ID of the conditional evaluation operation. */
	readonly tenantId: string
}
