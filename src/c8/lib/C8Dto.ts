import { LosslessNumber } from 'lossless-json'

import { Int64String, LosslessDto } from '../../lib'

export class RestApiJob<
	Variables = LosslessDto,
	CustomHeaders = LosslessDto,
> extends LosslessDto {
	@Int64String
	key!: string
	type!: string
	@Int64String
	processInstanceKey!: LosslessNumber
	bpmnProcessId!: string
	processDefinitionVersion!: number
	@Int64String
	processDefinitionKey!: LosslessNumber
	elementId!: string
	@Int64String
	elementInstanceKey!: LosslessNumber
	customHeaders!: CustomHeaders
	worker!: string
	retries!: number
	@Int64String
	deadline!: LosslessNumber
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
