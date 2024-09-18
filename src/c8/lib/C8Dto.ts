import { Int64String, LosslessDto } from '../../lib'

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
