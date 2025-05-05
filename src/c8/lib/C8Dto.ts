import { ReadStream } from 'fs'

import { LosslessNumber } from 'lossless-json'

import { ChildDto, Int64String, LosslessDto } from '../../lib'
import {
	ICustomHeaders,
	IInputVariables,
	IProcessVariables,
	JobCompletionInterfaceRest,
	JSONDoc,
} from '../../zeebe/types'

export class RestApiJob<
	Variables = LosslessDto,
	CustomHeaders = LosslessDto,
> extends LosslessDto {
	@Int64String
	jobKey!: string
	type!: string
	@Int64String
	processInstanceKey!: string
	processDefinitionId!: string
	processDefinitionVersion!: number
	@Int64String
	processDefinitionKey!: string
	elementId!: string
	@Int64String
	elementInstanceKey!: string
	customHeaders!: CustomHeaders
	worker!: string
	retries!: number
	@Int64String
	deadline!: string
	variables!: Variables
	tenantId!: string
}

/**
 * JSON object with changed task attribute values.
 */
export interface TaskChangeSet {
	/* The due date of the task. Reset by providing an empty String. */
	dueDate?: Date | string
	/* The follow-up date of the task. Reset by providing an empty String. */
	followUpDate?: Date | string
	/* The list of candidate users of the task. Reset by providing an empty list. */
	candidateUsers?: string[]
	/* The list of candidate groups of the task. Reset by providing an empty list. */
	candidateGroups?: string[]
}

/** JSON object with changed job attribute values. */
export interface JobUpdateChangeset {
	/* The new amount of retries for the job; must be a positive number. */
	retries?: number
	/**  The duration of the new timeout in ms, starting from the current moment. */
	timeout?: number
}

export interface NewUserInfo {
	password: string
	id: number
	username: string
	name: string
	email: string
	enabled: boolean
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Ctor<T> = new (obj: any) => T

export class ProcessDeployment extends LosslessDto {
	processDefinitionId!: string
	processDefinitionVersion!: number
	@Int64String
	processDefinitionKey!: string
	resourceName!: string
	tenantId!: string
}

export class DecisionDeployment extends LosslessDto {
	dmnDecisionId!: string
	version!: number
	@Int64String
	decisionKey!: string
	dmnDecisionName!: string
	tenantId!: string
	dmnDecisionRequirementsId!: string
	@Int64String
	dmnDecisionRequirementsKey!: string
}

export class DecisionRequirementsDeployment extends LosslessDto {
	dmnDecisionRequirementsId!: string
	version!: number
	dmnDecisionRequirementsName!: string
	tenantId!: string
	@Int64String
	dmnDecisionRequirementsKey!: string
	resourceName!: string
}
export class FormDeployment {
	formId!: string
	version!: number
	@Int64String
	formKey!: string
	resourceName!: string
	tenantId!: string
}

export class DeployResourceResponseDto extends LosslessDto {
	@Int64String
	deploymentKey!: string
	deployments!: (
		| { processDefinition: ProcessDeployment }
		| { decisionDefinition: DecisionDeployment }
		| { decisionRequirements: DecisionRequirementsDeployment }
		| { form: FormDeployment }
	)[]
	tenantId!: string
}

export class DeployResourceResponse extends DeployResourceResponseDto {
	processes!: ProcessDeployment[]
	decisions!: DecisionDeployment[]
	decisionRequirements!: DecisionRequirementsDeployment[]
	forms!: FormDeployment[]
}

export class CreateProcessInstanceResponse<T = Record<string, never>> {
	/**
	 * The unique key identifying the process definition (e.g. returned from a process
	 * in the DeployResourceResponse message)
	 */
	@Int64String
	readonly processDefinitionKey!: string
	/**
	 * The BPMN process ID of the process definition
	 */
	readonly processDefinitionId!: string
	/**
	 * The version of the process; set to -1 to use the latest version
	 */
	readonly version!: number
	@Int64String
	readonly processInstanceKey!: string
	/**
	 * the tenant identifier of the created process instance
	 */
	readonly tenantId!: string
	/**
	 * If `awaitCompletion` is true, this will be populated with the output variables. Otherwise, it will be an empty object.
	 */
	readonly variables!: T
}

export interface MigrationMappingInstruction {
	/** The element ID to migrate from. */
	sourceElementId: string
	/** The element ID to migrate into. */
	targetElementId: string
}

/** Migrates a process instance to a new process definition.
 * This request can contain multiple mapping instructions to define mapping between the active process instance's elements and target process definition elements.
 */
export interface MigrationRequest {
	processInstanceKey: string
	/** The key of process definition to migrate the process instance to. */
	targetProcessDefinitionKey: string
	mappingInstructions: MigrationMappingInstruction[]
	/** A reference key chosen by the user that will be part of all records resulting from this operation. Must be > 0 if provided. */
	operationReference?: number | LosslessNumber
}

/** The signal was broadcast. */
export class BroadcastSignalResponse extends LosslessDto {
	@Int64String
	/** The unique ID of the signal that was broadcast. */
	signalKey!: string
	/** The tenant ID of the signal that was broadcast. */
	tenantId!: string
}

export interface UpdateElementVariableRequest {
	/**
	 * The key of the element instance to update the variables for.
	 * This can be the process instance key (as obtained during instance creation), or a given element,
	 * such as a service task (see the elementInstanceKey on the job message). */
	elementInstanceKey: string
	variables: JSONDoc | LosslessDto
	/**
	 * Defaults to false.
	 * If set to true, the variables are merged strictly into the local scope (as specified by the elementInstanceKey). Otherwise, the variables are propagated to upper scopes and set at the outermost one.
	 * Let's consider the following example:
	 * There are two scopes '1' and '2'. Scope '1' is the parent scope of '2'. The effective variables of the scopes are: 1 => { "foo" : 2 } 2 => { "bar" : 1 }
	 * An update request with elementInstanceKey as '2', variables { "foo" : 5 }, and local set to true leaves scope '1' unchanged and adjusts scope '2' to { "bar" : 1, "foo" 5 }.
	 * By default, with local set to false, scope '1' will be { "foo": 5 } and scope '2' will be { "bar" : 1 }.
	 */
	local?: boolean
	/**
	 * A reference key chosen by the user that will be part of all records resulting from this operation.
	 * Must be > 0 if provided.
	 */
	operationReference?: number
}

export class CorrelateMessageResponse extends LosslessDto {
	/** the unique ID of the message that was published */
	@Int64String
	messageKey!: string
	/** the tenantId of the message */
	tenantId!: string
	/** The key of the first process instance the message correlated with */
	@Int64String
	processInstanceKey!: string
}

export class PublishMessageResponse extends LosslessDto {
	/** the unique ID of the message that was published */
	@Int64String
	messageKey!: string
	/** the tenantId of the message */
	tenantId!: string
}

export interface CreateProcessBaseRequest<V extends JSONDoc | LosslessDto> {
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
	/**
	 * List of start instructions. If empty (default) the process instance
	 * will start at the start event. If non-empty the process instance will apply start
	 * instructions after it has been created
	 */
	startInstructions?: ProcessInstanceCreationStartInstruction[]
	/**
	 * Wait for the process instance to complete. If the process instance completion does not occur within the requestTimeout, the request will be closed. Defaults to false.
	 */
	// This is commented out, because we used specialised methods for the two cases.
	// awaitCompletion?: boolean
	/**
	 * Timeout (in ms) the request waits for the process to complete. By default or when set to 0, the generic request timeout configured in the cluster is applied.
	 */
	requestTimeout?: number
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

export interface CreateProcessInstanceFromProcessDefinitionId<
	V extends JSONDoc | LosslessDto,
> extends CreateProcessBaseRequest<V> {
	/**
	 * the BPMN process ID of the process definition
	 */
	processDefinitionId: string
}

export interface CreateProcessInstanceFromProcessDefinition<
	V extends JSONDoc | LosslessDto,
> extends CreateProcessBaseRequest<V> {
	/**
	 * the key of the process definition
	 */
	processDefinitionKey: string
}

export type CreateProcessInstanceReq<T extends JSONDoc | LosslessDto> =
	| CreateProcessInstanceFromProcessDefinitionId<T>
	| CreateProcessInstanceFromProcessDefinition<T>

export interface PatchAuthorizationRequest {
	/** The key of the owner of the authorization. */
	ownerKey: string
	/** Indicates if permissions should be added or removed. */
	action: 'ADD' | 'REMOVE'
	/** The type of resource to add/remove perissions to/from. */
	resourceType:
		| 'AUTHORIZATION'
		| 'MESSAGE'
		| 'JOB'
		| 'APPLICATION'
		| 'TENANT'
		| 'DEPLOYMENT'
		| 'PROCESS_DEFINITION'
		| 'USER_TASK'
		| 'DECISION_REQUIREMENTS_DEFINITION'
		| 'DECISION_DEFINITION'
		| 'USER_GROUP'
		| 'USER'
		| 'ROLE'
	/** The permissions to add/remove. */
	permissions: {
		/** Specifies the type of permissions. */
		permissionType: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'
		/** A list of resource IDs the permission relates to. */
		resourceIds: []
	}[]
}

export interface RestJob<
	Variables = IInputVariables,
	CustomHeaderShape = ICustomHeaders,
> {
	/** The key, a unique identifier for the job */
	readonly jobKey: string
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
	/** Epoch milliseconds */
	readonly deadline: string
	/**
	 * All visible variables in the task scope, computed at activation time.
	 */
	readonly variables: Readonly<Variables>
	/**
	 * The `tenantId` of the job in a multi-tenant cluster
	 */
	readonly tenantId: string
}

export type JobWithMethods<VariablesDto, CustomHeadersDto> = RestJob<
	VariablesDto,
	CustomHeadersDto
> &
	JobCompletionInterfaceRest<IProcessVariables>

interface SearchPageRequestSearchAfter {
	from: number
	limit: number
	// example: [{}]. Pass in the lastSortValues from the previous response.
	searchAfter?: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

interface SearchPageRequestSearchBefore {
	from: number
	limit: number
	// example: [{}]. Pass in the lastSortValues from the previous response.
	searchBefore?: any[] // eslint-disable-line @typescript-eslint/no-explicit-any
}

export type SearchPageRequest =
	| SearchPageRequestSearchAfter
	| SearchPageRequestSearchBefore

export interface AdvancedStringFilter {
	/** Checks for equality with the provided value. */
	$eq?: string
	/** Checks for inequality with the provided value. */
	$neq?: string
	/** Checks if the current property exists. */
	$exists?: boolean
	/** Checks if the property matches any of the provided values. */
	$in: string[]
	/** Checks if the property matches the provided like value. Supported wildcard characters depend on the configured search client. */
	$like: string
}

export interface AdvancedNumberFilter {
	$eq?: number
	$neq?: number
	$exists: boolean
	$in: number[]
	$gt: number
	$gte: number
	$lt: number
	$lte: number
}

export interface SearchFilterRequest {
	/** The key for this variable. */
	variableKey?: string | AdvancedStringFilter
	/** Name of the variable. */
	name?: string | AdvancedStringFilter
	/** The value of the variable. */
	value?: string | AdvancedStringFilter
	/** The key of the scope of this variable. */
	scopeKey?: string | AdvancedStringFilter
	/** The key of the process instance of this variable. */
	processInstanceKey?: string | AdvancedStringFilter
	/** Tenant ID of this variable. */
	tenantId?: string
	/** Whether the value is truncated or not. */
	isTruncated?: boolean
}

export interface SearchSortRequest {
	field: string
	/** The order in which to sort the related field. Default value: ASC */
	order?: 'ASC' | 'DESC'
}

export interface SearchVariablesRequest {
	/** Sort field criteria. */
	sort?: SearchSortRequest
	/** Pagination criteria. */
	page?: SearchPageRequest
	/** Variable filter request. */
	filter: SearchFilterRequest
}

export interface SearchResponsePagination {
	/** Total items matching the criteria. */
	totalItems: number
	/** The sort values of the first item in the result set. Use this in the searchBefore field of an ensuing request. */
	firstSortValues: unknown[]
	/** The sort values of the last item in the result set. Use this in the searchAfter field of an ensuing request. */
	lastSortValues: unknown[]
}

export interface SearchVariablesResponse {
	/** Pagination information about the search results. */
	page: SearchResponsePagination
	/** The matching variables. */
	items: Array<{
		/** The key for this variable. */
		variableKey: string
		/** The key of the scope of this variable. */
		scopeKey: string
		/** The key of the process instance of this variable. */
		processInstanceKey: string
	}>
}

export type SearchUserTasksSortRequest = Array<{
	/** The field to sort by. */
	field:
		| 'creationDate'
		| 'completionDate'
		| 'dueDate'
		| 'followUpDate'
		| 'priority'
	/** The order in which to sort the related field. Default: asc */
	order?: 'asc' | 'desc'
}>

export interface AdvancedDateTimeFilter {
	/** Checks for equality with the provided value. */
	$eq?: string
	/** Checks for inequality with the provided value. */
	$neq?: string
	/** Checks if the current property exists. */
	$exists?: boolean
	/** Greater than comparison with the provided value. */
	$gt: string
	/** Greater than or equal comparison with the provided value. */
	$gte: string
	/** Lower than comparison with the provided value. */
	$lt: string
	/** Lower than or equal comparison with the provided value. */
	$lte: string
	/** Checks if the property matches any of the provided values. */
	$in: string[]
}

/** User task filter request. */
export interface SearchUserTasksFilter {
	/** The key for this user task. */
	userTaskKey?: string
	/** The state of the user task. */
	state?: 'CREATED' | 'COMPLETED' | 'CANCELED' | 'FAILED'
	/** The assignee of the user task. */
	assignee?: string | AdvancedStringFilter
	/** The priority of the user task. */
	priority?: number | AdvancedNumberFilter
	/** The element ID of the user task. */
	elementId?: string
	/** The candidate group for this user task. */
	candidateGroup?: string | AdvancedStringFilter
	/** The candidate user for this user task. */
	candidateUser?: string | AdvancedStringFilter
	/** The key of the process definition. */
	processDefinitionKey?: string
	/** The key of the process instance. */
	processInstanceKey?: string
	/** Tenant ID of this user task. */
	tenantId?: string
	/** The ID of the process definition. */
	processDefinitionId?: string
	/** The key of the element instance. */
	elementInstanceKey?: string
	/** The user task creation date. */
	creationDate?: string | AdvancedDateTimeFilter
	/** The user task completion date. */
	completionDate?: string | AdvancedDateTimeFilter
	/** The user task follow-up date. */
	followupDate?: string | AdvancedDateTimeFilter
	/** The user task due date. */
	dueDate?: string | AdvancedDateTimeFilter
	/** Process Instance variables associated with the user task. */
	processInstanceVariables?: Array<{
		/** Name of the variable. */
		name: string
		/** The value of the variable. If it is a string, it will be double-quoted. */
		value: string
	}>
	/** Local variables associated with the user task. */
	localVariables?: Array<{
		/** Name of the variable. */
		name: string
		/** The value of the variable. If it is a string, it will be double-quoted. */
		value: string
	}>
}

export interface SearchTasksRequest {
	/** Pagination criteria. */
	page?: SearchPageRequest
	/** Sort field criteria. */
	sort?: SearchUserTasksSortRequest
	/** User task filter request. */
	filter?: SearchUserTasksFilter
}

export interface SearchUserTasksResponse {
	page: SearchResponsePagination
	items: Array<{
		/** The key of the user task. */
		userTaskKey: string
		/** The key of the element instance. */
		elementInstanceKey: string
		/** The key of the process definition. */
		processDefinitionKey: string
		/** The key of the process instance. */
		processInstanceKey: string
		/** The key of the form. */
		formKey: string
	}>
}

export interface UserTask {
	/** The name for this user task. */
	name: string
	/** The state of the user task. Possible values: [CREATED, COMPLETED, CANCELED, FAILED] */
	state: 'CREATED' | 'COMPLETED' | 'CANCELED' | 'FAILED'
	/** The assignee of the user task. */
	assignee?: string
	/** The element ID of the user task.
	 */
	elementId: string
	/** The candidate groups for this user task. */
	candidateGroups?: string[]
	/** The candidate users for this user task. */
	candidateUsers?: string[]
	/** The ID of the process definition. */
	processDefinitionId: string
	/** The creation date of a user task. */
	creationDate: string
	/** The completion date of a user task. */
	completionDate?: string
	/** The follow date of a user task. */
	followUpDate?: string
	/** The due date of a user task. */
	dueDate?: string
	/** Tenant ID of this user task. */
	tenantId: string
	/** The external form reference. */
	externalFormReference?: string
	/** The version of the process definition. */
	processDefinitionVersion: number
	/** Custom headers for the user task. */
	customHeaders: { [key: string]: string }
	/** The priority of a user task. The higher the value the higher the priority. Possible values: <= 100. Default value: 50 */
	priority: number
	/** The key of the user task. */
	userTaskKey: string
	/** The key of the element instance. */
	elementInstanceKey: string
	/** The key of the process definition. */
	processDefinitionKey: string
	/** The key of the process instance. */
	processInstanceKey: string
	/** The key of the form. */
	formKey?: string
}

export interface AssignUserTaskRequest {
	/** The key of the user task to assign. */
	userTaskKey: string
	/** The assignee for the user task. The assignee must not be empty or null. */
	assignee: string
	/** By default, the task is reassigned if it was already assigned. Set this to false to return an error in such cases. The task must then first be unassigned to be assigned again. Use this when you have users picking from group task queues to prevent race conditions. */
	allowOverride?: boolean
	/** A custom action value that will be accessible from user task events resulting from this endpoint invocation. If not provided, it will default to "assign". */
	action?: string
}

/** Sort field criteria. */
export interface UserTaskVariablesSortRequest {
	/** The field to sort by. */
	field:
		| 'value'
		| 'name'
		| 'tenantId'
		| 'variableKey'
		| 'scopeKey'
		| 'processInstanceKey'
	/** The order in which to sort the related field. */
	order: 'ASC' | 'DESC'
}

export interface UserTaskVariablesRequest {
	userTaskKey: string
	/** Pagination criteria. */
	page?: SearchPageRequest
	/** Sort field criteria. */
	sort: UserTaskVariablesSortRequest[]
	/** The user task variable search filters. */
	filter?: {
		/** Name of the variable. */
		name: string
	}
}

/** The user task variables search response. */
export interface UserTaskVariablesResponse {
	/** Pagination information about the search results. */
	page: SearchResponsePagination
	/** The matching variables. */
	items: Array<{
		/** The key for this variable. */
		variableKey: string
		/** The key of the scope of this variable. */
		scopeKey: string
		/** The key of the process instance of this variable. */
		processInstanceKey: string
		name: string
		value: string
		tenantId: string
		isTruncated: boolean
	}>
}

export interface AdvancedProcessInstanceStateFilter {
	/** Checks for equality with the provided value. */
	$eq?: 'ACTIVE' | 'COMPLETED' | 'CANCELED'
	/** Checks for inequality with the provided value. */
	$neq?: 'ACTIVE' | 'COMPLETED' | 'CANCELED'
	/** Checks if the current property exists. */
	$exists?: boolean
	/** Checks if the property matches any of the provided values. */
	$in: ('ACTIVE' | 'COMPLETED' | 'CANCELED')[]
	/** Checks if the property matches the provided like value. Supported wildcard characters depend on the configured search client. */
	$like: string
}

/** This is the 8.8 API.  */
export interface SearchProcessInstanceRequest {
	/** Pagination criteria. */
	page?: SearchPageRequest
	/** Sort field criteria. */
	sort: Array<{
		field:
			| 'processInstanceKey'
			| 'processDefinitionId'
			| 'processDefinitionName'
			| 'processDefinitionVersion'
			| 'processDefinitionVersionTag'
			| 'processDefinitionKey'
			| 'parentProcessInstanceKey'
			| 'parentFlowNodeInstanceKey'
			| 'state'
			| 'startDate'
			| 'endDate'
			| 'tenantId'
			| 'hasIncident'
		/** The order in which to sort the related field. Default value: ASC */
		order?: 'ASC' | 'DESC'
	}>
	/** Process instance search filter. */
	filter: {
		/** The key of this process instance. */
		processInstanceKey?: string | AdvancedStringFilter
		/** The process definition ID. */
		processDefinitionId?: string | AdvancedStringFilter
		/** The process definition name. */
		processDefinitionName?: string | AdvancedStringFilter
		/** The process definition version. */
		processDefinitionVersion?: string | AdvancedStringFilter
		/** The process definition version tag. */
		processDefinitionVersionTag?: string | AdvancedStringFilter
		/** The process definition key. */
		processDefinitionKey?: string | AdvancedStringFilter
		/** The parent process instance key. */
		parentProcessInstanceKey?: string | AdvancedStringFilter
		/** The parent flow node instance key. */
		parentFlowNodeInstanceKey?: string | AdvancedStringFilter
		/** The process instance state. */
		state?: 'ACTIVE' | 'COMPLETED' | 'TERMINATED'
		/** The start date. */
		startDate?: string | AdvancedDateTimeFilter
		/** The end date. */
		endDate?: string | AdvancedDateTimeFilter
		/** The tenant ID. */
		tenantId?: string | AdvancedStringFilter
		/** The process instance variables. */
		variables?: Array<{
			/** Name of the variable. */
			name: string
			/** The value of the variable */
			value: string
		}>
	}
}

export interface SearchProcessInstanceResponse {
	page: SearchResponsePagination
	items: Array<{
		/** The key of the process instance. */
		processInstanceKey: string
		/** The key of the process definition. */
		processDefinitionKey: string
		/** The key of the parent process instance. */
		parentProcessInstanceKey: string
		/** The key of the parent flow node instance. */
		parentFlowNodeInstanceKey: string
		/** The BPMN process ID of the process definition. */
		processDefinitionId: string
		/** The name of the process definition. */
		processDefinitionName: string
		/** The version of the process definition. */
		processDefinitionVersion: string
		/** The state of the process instance. */
		state: string
		/** The start date of the process instance. */
		startDate: string
		/** The end date of the process instance. */
		endDate?: string
		/** The tenant ID. */
		tenantId: string
		/** Has an incident. */
		hasIncident: boolean
	}>
}

export interface DownloadDocumentRequest {
	/** The ID of the document to download. */
	documentId: string
	/** The ID of the document store to download the document from. */
	storeId?: string
	/**
	 * The hash of the document content that was computed by the document store during upload.
	 * The hash is part of the document reference that is returned when uploading a document.
	 * If the client fails to provide the correct hash, the request will be rejected.
	 */
	contentHash: string
}

export interface UploadDocumentRequest {
	/** The ID of the document store to upload the document to. */
	storeId?: string
	/** The ID of the document to upload. If not provided, a new ID will be generated. Specifying an existing ID will result in an error if the document already exists. */
	documentId?: string
	/** A file ReadStream created with fs.createReadStream() */
	file: ReadStream
	metadata?: UploadDocumentMetadata
}

export interface UploadDocumentMetadata {
	/** The content type of the document. */
	contentType?: string
	/** The name of the file. */
	fileName?: string
	/** The date and time when the document expires. */
	expiresAt?: string //date-time
	/** The size of the document in bytes */
	size?: number
	/** The ID of the process definition that created the document. */
	processDefinitionId?: string
	/** The key of the process instance that created the document. */
	processInstanceKey?: string
	/** Custom properties of the document. */
	customProperties?: { [name: string]: string | number | boolean | null }
}

export class UploadDocumentResponse extends LosslessDto {
	/** Document discriminator. Always set to "camunda". */
	['camunda.document.type'] = 'camunda'
	/** The ID of the document store. */
	storeId!: string
	/** The ID of the document. */
	documentId!: string
	/** The hash of the document. */
	contentHash!: string
	metadata!: UploadDocumentMetadata
}

export class UploadDocumentsResponse {
	/** Documents that were successfully created. */
	createdDocuments!: UploadDocumentResponse[]
	/** Documents that failed creation. */
	failedDocuments!: Array<{
		/** The name of the file. */
		fileName: string
		/** The detail of the failure. */
		detail: string
	}>
}

export interface CreateDocumentLinkRequest {
	/** The ID of the document to link. */
	documentId: string
	/** The ID of the document store to link the document from. */
	storeId?: string
	/** The hash of the document content that was computed by the document store during upload.
	 * The hash is part of the document reference that is returned when uploading a document.
	 * If the client fails to provide the correct hash, the request will be rejected.
	 **/
	contentHash?: string
	/** The time-to-live of the document link in ms. Default value: 3600000 */
	timeToLive?: number
}

export interface CreateDocumentLinkResponse {
	/* The link to the document. */
	url: string
	/* The date and time when the link expires. */
	expiresAt: string
}

export interface ActivateInstructions {
	/** The ID of the element that should be activated. */
	elementId: string
	variableInstructions?: Array<{
		/** JSON document that will instantiate the variables for the root variable scope of the process instance. It must be a JSON object, as variables will be mapped in a key-value fashion. */
		variables: { [key: string]: string | number | boolean | null }
		/** The ID of the element in which scope the variables should be created. Leave empty to create the variables in the global scope of the process instance **/
		scopeId?: string
	}>
	/** The key of the ancestor scope the element instance should be created in. Set to -1 to create the new element instance within an existing element instance of the flow scope. Default: -1*/
	ancestorElementInstanceKey?: string
}

export interface ModifyProcessInstanceRequest {
	/** A reference key chosen by the user that will be part of all records resulting from this operation. Must be > 0 if provided. */
	operationReference?: number | LosslessNumber
	/** The key of the process instance to modify. */
	processInstanceKey: string
	activateInstructions?: ActivateInstructions[]
	terminateInstructions?: Array<{
		/** The ID of the element that should be terminated. */
		elementInstanceKey: string
	}>
}

// We need to make a structure for a request param that takes only one of decisionDefinitionId or decisionDefinitionKey, and enforces this in the IDE
export type EvaluateDecisionRequest =
	| {
			/** The ID of the decision to be evaluated. */
			decisionDefinitionId: string
			/** The message variables as JSON document. */
			variables: JSONDoc
			/** The tenant ID of the decision. */
			tenantId?: string
			/** The unique key identifying the decision to be evaluated. */
			decisionDefinitionKey?: never
	  }
	| {
			/** The ID of the decision to be evaluated. */
			decisionDefinitionId?: never
			/** The message variables as JSON document. */
			variables: JSONDoc
			/** The tenant ID of the decision. */
			tenantId?: string
			/** The unique key identifying the decision to be evaluated. */
			decisionDefinitionKey: string
	  }

export class EvaluatedOutput extends LosslessDto {
	/** The ID of the evaluated decision output. */
	outputId!: string
	/** The name of the evaluated decision output. */
	outputName!: string
	/** The value of the evaluated decision output. */
	outputValue!: string
}

export class MatchedRule extends LosslessDto {
	/** The ID of the matched rule. */
	ruleId!: string
	/** The index of the matched rule. */
	ruleIndex!: string
	@ChildDto(EvaluatedOutput)
	evaluatedOutputs!: EvaluatedOutput[]
}

export class EvaluatedInput extends LosslessDto {
	/** The ID of the evaluated decision input. */
	inputId!: string
	/** The name of the evaluated decision input. */
	inputName!: string
	/** The value of the evaluated decision input. */
	inputValue!: string
}

export class EvaluatedDecision extends LosslessDto {
	/** The ID of the decision which was evaluated. */
	decisionDefinitionId!: string
	/** The name of the decision which was evaluated. */
	decisionDefinitionName!: string
	/** The version of the decision which was evaluated. */
	decisionDefinitionVersion!: number
	/** The type of the decision which was evaluated. */
	decisionDefinitionType!: string
	/** JSON document that will instantiate the result of the decision which was evaluated. */
	output!: string
	/** The tenant ID of the evaluated decision. */
	tenantId!: string
	@ChildDto(MatchedRule)
	matchedRules!: MatchedRule[]
	@ChildDto(EvaluatedInput)
	evaluatedInputs!: EvaluatedInput[]
	/** The unique key identifying the decision which was evaluate. */
	decisionDefinitionKey!: string
}

export class EvaluateDecisionResponse extends LosslessDto {
	/** The ID of the decision which was evaluated. */
	decisionDefinitionId!: string
	/** The name of the decision which was evaluated. */
	decisionDefinitionName!: string
	/** The version of the decision which was evaluated. */
	decisionDefinitionVersion!: number
	/** The ID of the decision requirements graph that the decision which was evaluated is part of. */
	decisionRequirementsId!: string
	/** JSON document that will instantiate the result of the decision which was evaluated. */
	output!: string
	/** The ID of the decision which failed during evaluation. */
	failedDecisionDefinitionId!: string
	/** Message describing why the decision which was evaluated failed. */
	failureMessage!: string
	/** The tenant ID of the evaluated decision. */
	tenantId!: string
	/** The unique key identifying the decision which was evaluated. */
	decisionDefinitionKey!: string
	/** The unique key identifying the decision requirements graph that the decision which was evaluated is part of. */
	decisionRequirementsKey!: string
	/** The unique key identifying this decision evaluation. */
	decisionInstanceKey!: string
	@ChildDto(EvaluatedDecision)
	evaluatedDecisions!: EvaluatedDecision[]
}

// Base interface with common properties
export interface BaseApiEndpointRequest<T> {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE'
	/** The URL path of the API endpoint. */
	urlPath: string
	/** The request body. */
	body?: T
	/** TODO: multi-part form support needs to be implemented */
	formData?: FormData
	/** The query parameters. */
	queryParams?: { [key: string]: string | number | boolean | undefined }
	/** The headers. */
	headers?: { [key: string]: string | number | boolean }
	/** A custom JSON parsing function */
	parseJson?: typeof JSON.parse
}

// Interface for requests that return JSON (json=true or undefined)
export interface JsonApiEndpointRequest<T> extends BaseApiEndpointRequest<T> {
	/** JSON-parse response? Default: true */
	json?: true | undefined
}

// Interface for requests that return raw response (json=false)
export interface RawApiEndpointRequest<T> extends BaseApiEndpointRequest<T> {
	/** JSON-parse response? */
	json: false
}

// Combined type for use in function signatures
export type ApiEndpointRequest<T> =
	| JsonApiEndpointRequest<T>
	| RawApiEndpointRequest<T>
