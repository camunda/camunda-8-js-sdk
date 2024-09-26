import { LosslessNumber } from 'lossless-json'

import { ChildDto, Int64String, LosslessDto } from '../../lib'

export class DecisionDefinition extends LosslessDto {
	id!: string
	@Int64String
	key!: string
	decisionId!: string
	name!: string
	version!: number
	decisionRequirementsId!: string
	@Int64String
	decisionRequirementsKey!: string
	decisionRequirementsName!: string
	decisionRequirementsVersion!: number
	tenantId: string | undefined
}

export class DecisionInstanceInput extends LosslessDto {
	id!: string
	name!: string
	value!: string
}

export class DecisionInstanceOutput extends LosslessDto {
	id!: string
	name!: string
	value!: string
	ruleId!: string
	ruleIndex!: number
}

export class DecisionInstance extends LosslessDto {
	id!: string
	@Int64String
	key!: string
	state!: 'FAILED' | 'EVALUATED' | 'UNKNOWN' | 'UNSPECIFIED'
	evaluationDate!: string
	evaluationFailure!: string
	@Int64String
	processDefinitionKey!: string
	@Int64String
	processInstanceKey!: string
	decisionId!: string
	decisionDefinitionId!: string
	decisionName!: string
	decisionVersion!: number
	decisionType!:
		| 'DECISION_TABLE'
		| 'LITERAL_EXPRESSION'
		| 'UNSPECIFIED'
		| 'UNKNOWN'
	result!: string
	evaluatedInputs!: DecisionInstanceInput[]
	@ChildDto(DecisionInstanceOutput)
	evaluatedOutputs!: DecisionInstanceOutput[]
	tenantId: string | undefined
}

export class DecisionRequirements extends LosslessDto {
	id!: string
	@Int64String
	key!: string
	decisionRequirementsId!: string
	name!: string
	version!: number
	resourceName!: string
	tenantId: string | undefined
}

export class ProcessDefinition extends LosslessDto {
	/** ProcessDefinition key is a string in the SDK, but it's an int64 number in the database */
	@Int64String
	key!: string
	name!: string
	version!: number
	bpmnProcessId!: string
}

export class ProcessInstance extends LosslessDto {
	@Int64String
	key!: string
	processVersion!: number
	bpmnProcessId!: string
	@Int64String
	parentKey?: string
	@Int64String
	parentFlowNodeInstanceKey?: string
	/* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
	startDate!: string
	/* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
	endDate!: string
	state!: 'ACTIVE' | 'COMPLETED' | 'CANCELED'
	@Int64String
	processDefinitionKey!: string
	tenantId: string | undefined
}

export class Incident extends LosslessDto {
	@Int64String
	key!: string
	@Int64String
	processDefinitionKey!: LosslessNumber
	@Int64String
	processInstanceKey!: LosslessNumber
	type!:
		| 'UNSPECIFIED'
		| 'UNKNOWN'
		| 'IO_MAPPING_ERROR'
		| 'JOB_NO_RETRIES'
		| 'CONDITION_ERROR'
		| 'EXTRACT_VALUE_ERROR'
		| 'CALLED_ELEMENT_ERROR'
		| 'UNHANDLED_ERROR_EVENT'
		| 'MESSAGE_SIZE_EXCEEDED'
		| 'CALLED_DECISION_ERROR'
		| 'DECISION_EVALUATION_ERROR'
	message!: string
	/* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
	creationTime!: string //
	state!: 'ACTIVE' | 'RESOLVED'
	@Int64String
	jobKey!: string
	tenantId: string | undefined
}

export class FlownodeInstance extends LosslessDto {
	@Int64String
	key!: string
	@Int64String
	processInstanceKey!: string
	/* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
	startDate!: string
	/* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
	endDate!: string
	@Int64String
	incidentKey?: string
	type!:
		| 'UNSPECIFIED'
		| 'PROCESS'
		| 'SUB_PROCESS'
		| 'EVENT_SUB_PROCESS'
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
	state!: 'ACTIVE' | 'COMPLETED' | 'TERMINATED'
	incident!: boolean
	tenantId: string | undefined
}

export class Variable extends LosslessDto {
	@Int64String
	key!: string
	@Int64String
	processInstanceKey!: string
	@Int64String
	scopeKey!: string
	name!: string
	/* Always truncated if value is too big in "search" results. In "get object" result it is not truncated. */
	value!: string
	/* if true 'value' is truncated. */
	truncated!: boolean
}

export class ChangeStatus extends LosslessDto {
	/* What was changed */
	message!: string
	/* How many items were deleted */
	@Int64String
	deleted!: string
}

export class ProcessInstanceStatistics extends LosslessDto {
	/* The id of the flow node for which the results are aggregated */
	activityId!: string
	/* The total number of active instances of the flow node */
	@Int64String
	active!: string
	/* The total number of canceled instances of the flow node */
	@Int64String
	canceled!: string
	/* The total number of incidents for the flow node */
	@Int64String
	incidents!: string
	/* The total number of completed instances of the flow node */
	@Int64String
	completed!: string
}

export interface Query<T> {
	filter?: Partial<T>
	size?: number
	sort?: [{ field: keyof T; order: 'ASC' | 'DESC' }]
	searchAfter?: unknown[]
}

export interface SearchResults<T> {
	items: T[]
	sortValues: unknown[]
	total: string
}
