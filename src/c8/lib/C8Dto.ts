import { LosslessNumber } from 'lossless-json'

import { Int64String, LosslessDto } from '../../lib'
import { JSONDoc } from '../../zeebe/types'

export class RestApiJob<
	Variables = LosslessDto,
	CustomHeaders = LosslessDto,
> extends LosslessDto {
	@Int64String
	key!: string
	type!: string
	@Int64String
	processInstanceKey!: string
	bpmnProcessId!: string
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
	bpmnProcessId!: string
	version!: number
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
	key!: string
	deployments!: (
		| { process: ProcessDeployment }
		| { decision: DecisionDeployment }
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

export class CreateProcessInstanceResponse extends LosslessDto {
	/**
	 * The unique key identifying the process definition (e.g. returned from a process
	 * in the DeployResourceResponse message)
	 */
	readonly processDefinitionKey!: string
	/**
	 * The BPMN process ID of the process definition
	 */
	readonly bpmnProcessId!: string
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
	key!: string
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
	 * Let’s consider the following example:
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
