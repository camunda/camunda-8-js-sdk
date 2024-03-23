import { Int64, LosslessDto } from 'lib'

export type TaskState = 'COMPLETED' | 'CREATED' | 'CANCELED' | 'FAILED'

export interface DraftSearchVariableValue {
	/* The value of the variable. */
	value: string
	/* Does the previewValue contain the truncated value or full value? */
	isValueTruncated: boolean
	/* A preview of the variable's value. Limited in size. */
	previewValue: string
}

export interface VariableSearchResponseWithoutDraft {
	/* The unique identifier of the variable. */
	id: string
	/* The name of the variable. */
	name: string
	/* The value of the variable. */
	value: string
	/* A preview of the variable's value. Limited in size. */
	previewValue: string
}

export interface VariableSearchResponse
	extends VariableSearchResponseWithoutDraft {
	draft: DraftSearchVariableValue
}

export interface Variable {
	/* The unique identifier of the variable. */
	id: string
	/* The name of the variable. */
	name: string
	/* The value of the variable. */
	value: string
	tenantId: string
	draft: DraftSearchVariableValue
}

export interface DateFilter {
	/* Start date range to search from. Pass a Date object, or string date-time format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard. */
	from: Date | string
	/* End date range to search to. Pass a Date object, or string date-time format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard. */
	to: Date | string
}

export interface TaskByVariables {
	/* The name of the variable. */
	name: string
	/* The value of the variable. When specifying the variable value, it's crucial to maintain consistency with JSON values (serialization for the complex objects such as list) and ensure that strings remain appropriately formatted. */
	value: string
	/* The comparison operator to use for the variable. */
	operator: 'eq'
}

interface TaskOrderBy {
	field: 'completionTime' | 'creationTime' | 'followUpDate' | 'dueDate'
	order: 'ASC' | 'DESC'
}

interface IncludeVariable {
	/* The name of the variable. */
	name: string
	/* Always return the full value of the variable? Default: false. */
	alwaysReturnFullValue?: boolean
}

export interface TaskSearchRequestBase {
	/* The state of the tasks. */
	state: TaskState
	/* Are the tasks assigned? */
	assigned: boolean
	/* Who is assigned to the tasks? */
	assignee: string
	/* The assignee is one of the given assignees. */
	assignees: string[]
	/* What's the BPMN flow node? */
	taskDefinitionId: string
	/* Given group is in candidate groups list. */
	candidateGroup: string
	/* At least one of the given groups is in candidate groups list. */
	candidateGroups: string[]
	/* Given user is in candidate user list. */
	candidateUser: string
	/* At least one of the given users is in candidate user list. */
	candidateUsers: string[]
	/* Reference to process definition. */
	processDefinitionKey: string
	/* Reference to process instance. */
	processInstanceKey: string
	/* Size of tasks page (default = 50). */
	pageSize: number
	/* A range of followup dates for the tasks to search for. */
	followUpDate: DateFilter
	/* A range of due dates for the tasks to search for. */
	dueDate: DateFilter
	/** An array of filter clauses specifying the variables to filter for.
	 * If defined, the query returns only tasks to which all clauses apply.
	 * However, it's important to note that this filtering mechanism is
	 * designed to work exclusively with truncated variables. This means
	 * variables of a larger size are not compatible with this filter, and
	 * attempts to use them may result in inaccurate or incomplete query results.
	 */
	taskVariables: TaskByVariables[]
	/* An array of Tenant IDs to filter tasks. When multi-tenancy is enabled, tasks associated with the specified tenant IDs are returned; if disabled, this parameter is ignored. */
	tenantIds: string[]
	/* An array of objects specifying the fields to sort the results by. */
	sort: TaskOrderBy[]
	/**
	 * An array used to specify a list of variable names that should be included in the response when querying tasks.
	 * This field allows users to selectively retrieve specific variables associated with the tasks returned in the search results.
	 */
	includeVariables: IncludeVariable[]
	implementation: 'JOB_WORKER' | 'ZEEBE_USER_TASK'
}

export interface TaskSearchAfterRequest extends Partial<TaskSearchRequestBase> {
	/**
	 * Used to return a paginated result. Array of values that should be copied from sortValues of one of the tasks from the current search results page.
	 * It enables the API to return a page of tasks that directly follow the task identified by the provided values, with respect to the sorting order.
	 */
	searchAfter: string[]
}

export interface TaskSearchAfterOrEqualRequest
	extends Partial<TaskSearchRequestBase> {
	/**
	 * Used to return a paginated result. Array of values that should be copied from sortValues of one of the tasks from the current search results page.
	 * It enables the API to return a page of tasks that directly follow or are equal to the task identified by the provided values, with respect to the sorting order.
	 */
	searchAfterOrEqual: string[]
}

export interface TaskSearchBeforeRequest
	extends Partial<TaskSearchRequestBase> {
	/**
	 * Used to return a paginated result. Array of values that should be copied from sortValues of one of the tasks from the current search results page.
	 * It enables the API to return a page of tasks that directly precede the task identified by the provided values, with respect to the sorting order.
	 */
	searchBefore: string[]
}

export interface TaskSearchBeforeOrEqualRequest
	extends Partial<TaskSearchRequestBase> {
	/**
	 * Used to return a paginated result. Array of values that should be copied from sortValues of one of the tasks from the current search results page.
	 * It enables the API to return a page of tasks that directly precede or are equal to the task identified by the provided values, with respect to the sorting order.
	 */
	searchBeforeOrEqual: string[]
}

export class TaskResponse extends LosslessDto {
	/* The unique identifier of the task. */
	id!: string
	/* The name of the task. */
	name!: string
	/* User Task ID from the BPMN definition. */
	taskDefinitionId!: string
	/* The name of the process. */
	processName!: string
	/* When was the task created (renamed equivalent of Task.creationTime field). */
	creationDate!: string
	/* When was the task completed (renamed equivalent of Task.completionTime field). */
	completionDate!: string
	/* The username/id of who is assigned to the task. */
	assignee!: string
	/* The state of the task. */
	taskState!: 'COMPLETED' | 'CREATED' | 'CANCELED' | 'FAILED'
	/* Reference to the task form. */
	formKey!: string
	/* Reference to the ID of a deployed form. If the form is not deployed, this property is null. */
	formId!: string
	/* Reference to the version of a deployed form. If the form is not deployed, this property is null. */
	@Int64
	formVersion?: string
	/* Is the form embedded for this task? If there is no form, this property is null. */
	isFormEmbedded?: boolean
	/* Reference to process definition (renamed equivalent of Task.processDefinitionId field). */
	processDefinitionKey!: string
	/* Reference to process instance id (renamed equivalent of Task.processInstanceId field). */
	processInstanceKey!: string
	/* The tenant ID associated with the task. */
	tenantId!: string
	/* The due date for the task. ($date-time) */
	dueDate!: string
	/* The follow-up date for the task. ($date-time) */
	followUpDate!: string
	/* The candidate groups for the task. */
	candidateGroups!: string[]
	/* The candidate users for the task. */
	candidateUsers!: string[]
	implementation!: 'JOB_WORKER' | 'ZEEBE_USER_TASK'
}

export class TaskSearchResponse extends TaskResponse {
	/* Array of values to be copied into TaskSearchRequest to request for next or previous page of tasks. */
	sortValues!: string[]
	/* A flag to show that the task is first in the current filter. */
	isFirst!: boolean
	/* 	An array of the task's variables. Only variables specified in TaskSearchRequest.includeVariables are returned. Note that a variable's draft value is not returned in TaskSearchResponse. */
	variables!: VariableSearchResponseWithoutDraft[]
}

export interface VariableInput {
	name: string
	value: string
}

export interface User {
	userId: string
	displayName: string
	permissions: string[]
	roles: string[]
	salesPlanType: string
}

export class Form extends LosslessDto {
	id!: string
	processDefinitionId!: string
	schema!: string
	@Int64
	version!: string
	tenantId!: string
	isDeleted!: boolean
}
