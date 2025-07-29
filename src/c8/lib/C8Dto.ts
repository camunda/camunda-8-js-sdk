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

import { DeployResourceResponseDto, SearchSortRequest } from './C8DtoInternal'

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
	// id: number
	username: string
	name: string
	email: string
	// enabled: boolean
}

export class ProcessDeployment extends LosslessDto {
	/** This is the ID of the process definition. It is a human-readable string defined in the process model */
	processDefinitionId!: string
	processDefinitionVersion!: number
	/** This is the key of the process definition. It is a unique identifier for the process definition, assigned by the server on deployment. */
	@Int64String
	processDefinitionKey!: string
	resourceName!: string
	tenantId!: string
}

export class DecisionDeployment extends LosslessDto {
	decisionDefinitionId!: string
	version!: number
	@Int64String
	decisionKey!: string
	name!: string
	tenantId!: string
	decisionRequirementsId!: string
	@Int64String
	decisionRequirementsKey!: string
	decisionDefinitionKey!: string
}

export class DecisionRequirementsDeployment extends LosslessDto {
	decisionRequirementsId!: string
	version!: number
	decisionRequirementsName!: string
	tenantId!: string
	@Int64String
	decisionRequirementsKey!: string
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
	readonly processDefinitionVersion!: number
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

export class CreateProcessInstanceWithResultResponse<
	T,
> extends CreateProcessInstanceResponse<T> {}

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

interface CreateProcessBaseRequest<V extends JSONDoc | LosslessDto> {
	/**
	 * the version of the process; if not specified it will use the latest version
	 */
	processDefinitionVersion?: number
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

interface CreateProcessInstanceFromProcessDefinitionId<
	V extends JSONDoc | LosslessDto,
> extends CreateProcessBaseRequest<V> {
	/**
	 * the BPMN process ID of the process definition
	 */
	processDefinitionId: string
}

interface CreateProcessInstanceFromProcessDefinition<
	V extends JSONDoc | LosslessDto,
> extends CreateProcessBaseRequest<V> {
	/**
	 * the key of the process definition
	 */
	processDefinitionKey: string
}

export type CreateProcessInstanceRequest<T extends JSONDoc | LosslessDto> =
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

export type ActivatedJob<VariablesDto, CustomHeadersDto> = RestJob<
	VariablesDto,
	CustomHeadersDto
> &
	JobCompletionInterfaceRest<IProcessVariables>

interface SearchPageRequestSearchAfter {
	/** The index of items to start searching from. */
	from: number
	/** The maximum number of items to return in one request. Defaults to 100. */
	limit: number
	/* Use the `endCursor` value from the previous response to fetch the next page of results. */
	after?: string
}

interface SearchPageRequestSearchBefore {
	/** The index of items to start searching from. */
	from: number
	/** The maximum number of items to return in one request. Defaults to 100. */
	limit: number
	/* Use the `startCursor` value from the previous response to fetch the previous page of results. */
	before?: string
}

export type SearchPageRequest =
	| SearchPageRequestSearchAfter
	| SearchPageRequestSearchBefore

/** Generic search request interface that can be used for most search operations */
interface BaseSearchRequest<TSortFields extends string, TFilter> {
	/** Pagination criteria. */
	page?: SearchPageRequest
	/** Sort field criteria. */
	sort?: SearchSortRequest<TSortFields>
	/** Search filter criteria. */
	filter: TFilter
}

/** Generic search request interface with optional filter */
export interface BaseSearchRequestWithOptionalFilter<
	TSortFields extends string,
	TFilter,
> {
	/** Pagination criteria. */
	page?: SearchPageRequest
	/** Sort field criteria. */
	sort?: SearchSortRequest<TSortFields>
	/** Search filter criteria. */
	filter?: TFilter
}

export interface AdvancedStringFilter {
	/** Checks for equality with the provided value. */
	$eq?: string
	/** Checks for inequality with the provided value. */
	$neq?: string
	/** Checks if the current property exists. */
	$exists?: boolean
	/** Checks if the property matches any of the provided values. */
	$in?: string[]
	/** Checks if the property matches the provided like value. Supported wildcard characters depend on the configured search client. */
	$like?: string
}

export interface AdvancedNumberFilter {
	/** Checks for equality with the provided value. */
	$eq?: number
	/** Checks for inequality with the provided value. */
	$neq?: number
	/** Checks if the current property exists. */
	$exists?: boolean
	/** Checks if the property matches any of the provided values. */
	$in?: number[]
	/** Checks if the property is greater than the provided value. */
	$gt?: number
	/** Checks if the property is greater than or equal to the provided value. */
	$gte?: number
	/** Checks if the property is less than the provided value. */
	$lt?: number
	/** Checks if the property is less than or equal to the provided value. */
	$lte?: number
}

export interface VariableSearchRequestFilter {
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

interface SearchResponsePagination {
	/** Total items matching the criteria. */
	totalItems: number
	/** The cursor for the first item in the result set. Use this in the searchBefore field of an ensuing request. */
	startCursor: string
	/** The cursor for the last item in the result set. Use this in the searchAfter field of an ensuing request. */
	endCursor: string
}

interface PaginatedSearchResponse<T> {
	/** Pagination information about the search results. */
	page: SearchResponsePagination
	/** The matching items. */
	items: T[]
}

export interface VariableDetails {
	/** The key for this variable. */
	variableKey: string
	/** The key of the scope of this variable. */
	scopeKey: string
	/** The key of the process instance of this variable. */
	processInstanceKey: string
	/** Name of this variable. */
	name: string
	/** Tenant ID of this variable. */
	tenantId: string
	/** Value of this variable. Can be truncated. */
	value: string
	/** Whether the value is truncated or not. */
	isTruncated: boolean
}

export interface SearchVariablesRequest
	extends BaseSearchRequest<
		| 'value'
		| 'name'
		| 'tenantId'
		| 'variableKey'
		| 'scopeKey'
		| 'processInstanceKey',
		VariableSearchRequestFilter
	> {}
export interface SearchVariablesResponse
	extends PaginatedSearchResponse<VariableDetails> {}

export type SearchUserTasksSortRequest = SearchSortRequest<
	'creationDate' | 'completionDate' | 'dueDate' | 'followUpDate' | 'priority'
>

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
export interface SearchUserTasksRequestFilter {
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

export interface SearchTasksRequest
	extends BaseSearchRequestWithOptionalFilter<
		'creationDate' | 'completionDate' | 'dueDate' | 'followUpDate' | 'priority',
		SearchUserTasksRequestFilter
	> {}

export interface UserTaskDetails {
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
}

export interface SearchUserTasksResponse
	extends PaginatedSearchResponse<UserTaskDetails> {}

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

export interface SearchUserTaskVariablesRequest
	extends BaseSearchRequestWithOptionalFilter<
		| 'value'
		| 'name'
		| 'tenantId'
		| 'variableKey'
		| 'scopeKey'
		| 'processInstanceKey',
		{
			/** Name of the variable. */
			name: string
		}
	> {
	userTaskKey: string
}

/** The user task variables search response for CamundaRestClient. */
export interface SearchUserTaskVariablesResponse
	extends PaginatedSearchResponse<{
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
	}> {}

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

export interface SearchProcessInstanceRequestFilter {
	/** The key of this process instance. */
	processInstanceKey?: string | AdvancedStringFilter
	/** The process definition ID. */
	processDefinitionId?: string | AdvancedStringFilter
	/** The process definition name. */
	processDefinitionName?: string | AdvancedStringFilter
	/** The process definition version. */
	processDefinitionVersion?: number | AdvancedStringFilter
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
		value: string | AdvancedStringFilter
	}>
}

/** This is the 8.8 API.  */
export interface SearchProcessInstanceRequest
	extends BaseSearchRequest<
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
		| 'hasIncident',
		SearchProcessInstanceRequestFilter
	> {}

export interface ProcessInstanceDetails {
	/** The key of the process instance. */
	processInstanceKey: string
	/** The key of the process definition. */
	processDefinitionKey: string
	/** The key of the parent process instance. */
	parentProcessInstanceKey?: string
	/** The key of the parent flow node instance. */
	parentFlowNodeInstanceKey?: string
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
}

export interface SearchProcessInstanceResponse
	extends PaginatedSearchResponse<ProcessInstanceDetails> {}

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
	metadata?: DocumentMetadata
}

export interface DocumentMetadata {
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
	metadata!: DocumentMetadata
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

class UserItem extends LosslessDto {
	/** The ID of the user. */
	@Int64String
	id!: string
	/** The key of the user. */
	key!: string
	/** The username of the user. */
	username!: string
	/** The name of the user. */
	name!: string
	/** The email of the user. */
	email!: string
}

/* The request to search for users. */
export interface SearchUsersRequest {
	/** Pagination criteria. */
	page: SearchPageRequest
	/** Sort field criteria. */
	sort?: SearchSortRequest<'username' | 'name' | 'email'>
	/** User search filter. */
	filter: {
		/** The username of the user. */
		username?: string
		/** The name of the user. */
		name?: string
		/** The email of the user. */
		email?: string
	}
}

/** The user search result. */
export class SearchUsersResponse extends LosslessDto {
	/** Pagination information about the search results. */
	page!: SearchResponsePagination
	/** The matching users. */
	@ChildDto(UserItem)
	items!: UserItem[]
}

export class GetVariableResponse {
	variableKey!: string
	scopeKey!: string
	processInstanceKey!: string
	name!: string
	value!: string
	tenantId!: string
}

export interface GetProcessDefinitionResponse {
	/** Name of this process definition. */
	name: string
	/** Resource name for this process definition. */
	resourceName: string
	/** Version of this process definition. */
	version: number
	/** Version tag of this process definition. */
	versionTag?: string
	/** Process definition ID of this process definition. */
	processDefinitionId: string
	/** Tenant ID of this process definition. */
	tenantId: string
	/** The key for this process definition. */
	processDefinitionKey: string
}

export interface ProcessDefinitionSearchRequestFilter {
	/** Name of this process definition. */
	name?: string
	/** Resource name of this process definition. */
	resourceName?: string
	/** Version of this process definition. */
	version?: number
	/** Version tag of this process definition. */
	versionTag?: string
	/** Process definition ID of this process definition. */
	processDefinitionId?: string
	/** Tenant ID of this process definition. */
	tenantId?: string
	/** The key for this process definition. */
	processDefinitionKey?: string
}

export interface SearchProcessDefinitionsRequest
	extends BaseSearchRequest<
		| 'processDefinitionKey'
		| 'name'
		| 'resourceName'
		| 'version'
		| 'versionTag'
		| 'processDefinitionId'
		| 'tenantId',
		ProcessDefinitionSearchRequestFilter
	> {}

export interface ProcessDefinitionDetails {
	/** Name of this process definition. */
	name: string
	/** Resource name for this process definition. */
	resourceName: string
	/** Version of this process definition. */
	version: number
	/** Version tag of this process definition. */
	versionTag?: string
	/** Process definition ID of this process definition. */
	processDefinitionId: string
	/** Tenant ID of this process definition. */
	tenantId: string
	/** The key for this process definition. */
	processDefinitionKey: string
}

export interface SearchProcessDefinitionsResponse
	extends PaginatedSearchResponse<ProcessDefinitionDetails> {}

export interface ElementInstanceSearchRequestFilter {
	processDefinitionId?: string
	state?: 'ACTIVE' | 'COMPLETED' | 'TERMINATED'
	type?:
		| 'UNSPECIFIED'
		| 'PROCESS'
		| 'SUB_PROCESS'
		| 'EVENT_SUB_PROCESS'
		| 'AD_HOC_SUB_PROCESS'
		| 'START_EVENT'
		| 'INTERMEDIATE_CATCH_EVENT'
		| 'INTERMEDIATE_THROW_EVENT'
		| 'BOUNDARY_EVENT'
		| 'END_EVENT'
		| 'SERVICE_TASK'
		| 'RECEIVE_TASK'
		| 'USER_TASK'
		| 'MANUAL_TASK'
		| 'TASK'
		| 'EXCLUSIVE_GATEWAY'
		| 'INCLUSIVE_GATEWAY'
		| 'PARALLEL_GATEWAY'
		| 'EVENT_BASED_GATEWAY'
		| 'SEQUENCE_FLOW'
		| 'MULTI_INSTANCE_BODY'
		| 'CALL_ACTIVITY'
		| 'BUSINESS_RULE_TASK'
		| 'SCRIPT_TASK'
		| 'SEND_TASK'
		| 'UNKNOWN'
	elementId?: string
	elementName?: string
	hasIncident?: boolean
	tenantId?: string
	elementInstanceKey?: string
	processInstanceKey?: string
	processDefinitionKey?: string
	incidentKey?: string
}

export interface SearchElementInstancesRequest
	extends BaseSearchRequest<
		| 'elementInstanceKey'
		| 'processInstanceKey'
		| 'processDefinitionKey'
		| 'processDefinitionId'
		| 'startDate'
		| 'endDate'
		| 'elementId'
		| 'type'
		| 'state'
		| 'incidentKey'
		| 'tenantId',
		ElementInstanceSearchRequestFilter
	> {}

export interface ElementInstanceDetails {
	/** The process definition ID associated to this element instance. */
	processDefinitionId: string
	/** Date when element instance started. */
	startDate: string
	/** Date when element instance finished. */
	endDate: string
	/** The element ID for this element instance. */
	elementId: string
	/** The element name for this element instance. */
	elementName: string
	/** Type of element as defined set of values. */
	type:
		| 'UNSPECIFIED'
		| 'PROCESS'
		| 'SUB_PROCESS'
		| 'EVENT_SUB_PROCESS'
		| 'AD_HOC_SUB_PROCESS'
		| 'START_EVENT'
		| 'INTERMEDIATE_CATCH_EVENT'
		| 'INTERMEDIATE_THROW_EVENT'
		| 'BOUNDARY_EVENT'
		| 'END_EVENT'
		| 'SERVICE_TASK'
		| 'RECEIVE_TASK'
		| 'USER_TASK'
		| 'MANUAL_TASK'
		| 'TASK'
		| 'EXCLUSIVE_GATEWAY'
		| 'INCLUSIVE_GATEWAY'
		| 'PARALLEL_GATEWAY'
		| 'EVENT_BASED_GATEWAY'
		| 'SEQUENCE_FLOW'
		| 'MULTI_INSTANCE_BODY'
		| 'CALL_ACTIVITY'
		| 'BUSINESS_RULE_TASK'
		| 'SCRIPT_TASK'
		| 'SEND_TASK'
		| 'UNKNOWN'
	/** State of element instance as defined set of values.*/
	state: 'ACTIVE' | 'COMPLETED' | 'TERMINATED'
	/** Shows whether this element instance has an incident. If true also an incidentKey is provided.*/
	hasIncident: boolean
	/** The tenant ID of the incident. */
	tenantId: string
	/** The assigned key, which acts as a unique identifier for this element instance. */
	elementInstanceKey: string
	/** The process instance key associated to this element instance. */
	processInstanceKey: string
	/** The process definition key associated to this element instance. */
	processDefinitionKey: string
	/** Incident key associated with this element instance. */
	incidentKey?: string
}

export interface SearchElementInstancesResponse
	extends PaginatedSearchResponse<ElementInstanceDetails> {}

export interface IncidentSearchRequestFilter {
	/** The process definition ID associated to this incident. */
	processDefinitionId?: string
	/** Incident error type with a defined set of values. */
	errorType?:
		| 'UNSPECIFIED'
		| 'UNKNOWN'
		| 'IO_MAPPING_ERROR'
		| 'JOB_NO_RETRIES'
		| 'EXECUTION_LISTENER_NO_RETRIES'
		| 'TASK_LISTENER_NO_RETRIES'
		| 'CONDITION_ERROR'
		| 'EXTRACT_VALUE_ERROR'
		| 'CALLED_ELEMENT_ERROR'
		| 'UNHANDLED_ERROR_EVENT'
		| 'MESSAGE_SIZE_EXCEEDED'
		| 'CALLED_DECISION_ERROR'
		| 'DECISION_EVALUATION_ERROR'
		| 'FORM_NOT_FOUND'
		| 'RESOURCE_NOT_FOUND'
	/** Error message which describes the error in more detail. */
	errorMessage?: string
	/** The element ID associated to this incident. */
	elementId?: string
	/** Date of incident creation. */
	creationTime?: string
	/** State of this incident with a defined set of values. */
	state?: 'ACTIVE' | 'MIGRATED' | 'RESOLVED' | 'PENDING'
	/** The tenant ID of the incident. */
	tenantId?: string
	/** The assigned key, which acts as a unique identifier for this incident. */
	incidentKey?: string
	/** The process definition key associated to this incident. */
	processDefinitionKey?: string
	/** The process instance key associated to this incident. */
	processInstanceKey?: string
	/** The element instance key associated to this incident. */
	elementInstanceKey?: string
	/** The job key, if exists, associated with this incident. */
	jobKey?: string
}

export interface SearchIncidentsRequest
	extends BaseSearchRequest<
		| 'incidentKey'
		| 'processInstanceKey'
		| 'processDefinitionKey'
		| 'processDefinitionId'
		| 'errorType'
		| 'errorMessage'
		| 'elementId'
		| 'elementInstanceKey'
		| 'creationTime'
		| 'state'
		| 'jobKey'
		| 'tenantId',
		IncidentSearchRequestFilter
	> {}

interface IncidentDetails {
	/* The process definition ID associated to this incident. */
	processDefinitionId: string
	/* Incident error type with a defined set of values. */
	errorType:
		| 'UNSPECIFIED'
		| 'UNKNOWN'
		| 'IO_MAPPING_ERROR'
		| 'JOB_NO_RETRIES'
		| 'EXECUTION_LISTENER_NO_RETRIES'
		| 'TASK_LISTENER_NO_RETRIES'
		| 'CONDITION_ERROR'
		| 'EXTRACT_VALUE_ERROR'
		| 'CALLED_ELEMENT_ERROR'
		| 'UNHANDLED_ERROR_EVENT'
		| 'MESSAGE_SIZE_EXCEEDED'
		| 'CALLED_DECISION_ERROR'
		| 'DECISION_EVALUATION_ERROR'
		| 'FORM_NOT_FOUND'
		| 'RESOURCE_NOT_FOUND'
	/* Error message which describes the error in more detail. */
	errorMessage: string
	/* The element ID associated to this incident. */
	elementId: string
	/* Date of incident creation. */
	creationTime: string
	/* State of this incident with a defined set of values. */
	state: 'ACTIVE' | 'MIGRATED' | 'RESOLVED' | 'PENDING'
	/* The tenant ID of the incident. */
	tenantId: string
	/* The assigned key, which acts as a unique identifier for this incident. */
	incidentKey: string
	/* The process definition key associated to this incident. */
	processDefinitionKey: string
	/* The process instance key associated to this incident. */
	processInstanceKey: string
	/* The element instance key associated to this incident. */
	elementInstanceKey: string
	/* The job key, if exists, associated with this incident. */
	jobKey: string
}

export interface SearchIncidentsResponse
	extends PaginatedSearchResponse<IncidentDetails> {}

export interface DecisionInstanceSearchFilter {
	/** The decision instance key. */
	decisionInstanceKey?: string | AdvancedStringFilter
	/** The decision definition ID. */
	decisionDefinitionId?: string | AdvancedStringFilter
	/** The decision definition key. */
	decisionDefinitionKey?: string | AdvancedStringFilter
	/** The decision definition name. */
	decisionDefinitionName?: string | AdvancedStringFilter
	/** The decision definition version. */
	decisionDefinitionVersion?: number | AdvancedNumberFilter
	/** The process definition key associated to this decision instance. */
	processDefinitionKey?: string | AdvancedStringFilter
	/** The process instance key associated to this decision instance. */
	processInstanceKey?: string | AdvancedStringFilter
	/** The state of the decision instance. */
	state?: 'EVALUATED' | 'FAILED' | 'UNKNOWN' | 'UNSPECIFIED'
	/** The evaluation date. */
	evaluationDate?: string | AdvancedDateTimeFilter
	/** The tenant ID. */
	tenantId?: string | AdvancedStringFilter
	/** The decision type. */
	decisionType?:
		| 'DECISION_TABLE'
		| 'LITERAL_EXPRESSION'
		| 'UNSPECIFIED'
		| 'UNKNOWN'
}

export interface SearchDecisionInstancesRequest
	extends BaseSearchRequest<
		| 'decisionInstanceKey'
		| 'decisionDefinitionId'
		| 'decisionDefinitionKey'
		| 'decisionDefinitionName'
		| 'decisionDefinitionVersion'
		| 'processDefinitionKey'
		| 'processInstanceKey'
		| 'state'
		| 'evaluationDate'
		| 'tenantId'
		| 'decisionType',
		DecisionInstanceSearchFilter
	> {}

interface DecisionInstanceDetails {
	/** The decision instance key. */
	decisionInstanceKey: string
	/** The decision definition ID. */
	decisionDefinitionId: string
	/** The decision definition key. */
	decisionDefinitionKey: string
	/** The decision definition name. */
	decisionDefinitionName: string
	/** The decision definition version. */
	decisionDefinitionVersion: number
	/** The process definition key associated to this decision instance. */
	processDefinitionKey: string
	/** The process instance key associated to this decision instance. */
	processInstanceKey: string
	/** The state of the decision instance. */
	state: 'EVALUATED' | 'FAILED' | 'UNKNOWN' | 'UNSPECIFIED'
	/** The evaluation date. */
	evaluationDate: string
	/** The evaluation failure message, if any. */
	evaluationFailure?: string
	/** The tenant ID. */
	tenantId: string
	/** The decision type. */
	decisionType:
		| 'DECISION_TABLE'
		| 'LITERAL_EXPRESSION'
		| 'UNSPECIFIED'
		| 'UNKNOWN'
	/** The result of the decision evaluation. */
	result: string
	/** The ID of the decision instance. */
	decisionInstanceId: string
}

export interface SearchDecisionInstancesResponse
	extends PaginatedSearchResponse<DecisionInstanceDetails> {}

/**
 * Response from getting a single decision instance by its key.
 */
export interface GetDecisionInstanceResponse {
	/** The decision instance key. Note that this is not the unique identifier of the entity itself; the decisionInstanceId serves as the primary identifier. */
	decisionInstanceKey: string
	/** The decision definition ID. */
	decisionDefinitionId: string
	/** The decision definition key. */
	decisionDefinitionKey: string
	/** The decision definition name. */
	decisionDefinitionName: string
	/** The decision definition version. */
	decisionDefinitionVersion: number
	/** The process definition key associated to this decision instance. */
	processDefinitionKey: string
	/** The process instance key associated to this decision instance. */
	processInstanceKey: string
	/** The state of the decision instance. */
	state: 'EVALUATED' | 'FAILED' | 'UNKNOWN' | 'UNSPECIFIED'
	/** The evaluation date. */
	evaluationDate: string
	/** The evaluation failure message, if any. */
	evaluationFailure?: string
	/** The tenant ID. */
	tenantId: string
	/** The decision type. */
	decisionDefinitionType:
		| 'DECISION_TABLE'
		| 'LITERAL_EXPRESSION'
		| 'UNSPECIFIED'
		| 'UNKNOWN'
	/** The result of the decision evaluation. */
	result: string
	/** The evaluated inputs of the decision instance. */
	evaluatedInputs: Array<{
		/** The ID of the evaluated decision input. */
		inputId: string
		/** The name of the evaluated decision input. */
		inputName: string
		/** The value of the evaluated decision input. */
		inputValue: string
	}>
	matchedRules: Array<{
		/** The ID of the matched rule. */
		ruleId: string
		/** The index of the matched rule. */
		ruleIndex: number
		evaluatedOutputs: Array<{
			/** The ID of the evaluated decision output. */
			outputId: string
			/** The name of the evaluated decision output. */
			outputName: string
			/** The value of the evaluated decision output. */
			outputValue: string
		}>
	}>
}
