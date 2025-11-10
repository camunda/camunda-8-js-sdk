/**
 * Orchestration Cluster API lifter namespace.
 *
 * This groups all branded key lifter namespaces from the Orchestration Cluster API
 * behind a single export so they don't pollute the root SDK namespace. Each lifter
 * exposes helper functions (e.g. `assumeExists(value: string)`) to convert legacy
 * string identifiers into their strongly-typed branded equivalents.
 *
 * Example:
 * ```typescript
 * import { OrchestrationLifters } from '@camunda8/sdk'
 * const processInstanceKey = OrchestrationLifters.ProcessInstanceKey.assumeExists('2251799813685249')
 * // processInstanceKey is now a branded ProcessInstanceKey type
 * ```
 */
/* eslint-disable @typescript-eslint/no-namespace */
import {
	AuthorizationKey,
	BatchOperationKey,
	DecisionDefinitionId,
	DecisionDefinitionKey,
	DecisionEvaluationInstanceKey,
	DecisionEvaluationKey,
	DecisionInstanceKey,
	DecisionRequirementsKey,
	DeploymentKey,
	DocumentId,
	ElementId,
	ElementInstanceKey,
	EndCursor,
	FormId,
	FormKey,
	IncidentKey,
	JobKey,
	MessageCorrelationKey,
	MessageKey,
	MessageSubscriptionKey,
	ProcessDefinitionId,
	ProcessDefinitionKey,
	ProcessInstanceKey,
	ScopeKey,
	SignalKey,
	StartCursor,
	Tag,
	TenantId,
	Username,
	UserTaskKey,
	VariableKey,
} from '@camunda8/orchestration-cluster-api'

export const OrchestrationLifters = {
	AuthorizationKey,
	BatchOperationKey,
	DecisionDefinitionId,
	DecisionDefinitionKey,
	DecisionEvaluationInstanceKey,
	DecisionEvaluationKey,
	DecisionInstanceKey,
	DecisionRequirementsKey,
	DeploymentKey,
	DocumentId,
	ElementId,
	ElementInstanceKey,
	EndCursor,
	FormId,
	FormKey,
	IncidentKey,
	JobKey,
	MessageCorrelationKey,
	MessageKey,
	MessageSubscriptionKey,
	ProcessDefinitionId,
	ProcessDefinitionKey,
	ProcessInstanceKey,
	ScopeKey,
	SignalKey,
	StartCursor,
	Tag,
	TenantId,
	Username,
	UserTaskKey,
	VariableKey,
} as const

// Namespace merge to expose brand types alongside lifter helpers.
// Enables: let k: OrchestrationLifters.ProcessInstanceKey = OrchestrationLifters.ProcessInstanceKey.assumeExists('123')
export namespace OrchestrationLifters {
	export type AuthorizationKey =
		import('@camunda8/orchestration-cluster-api').AuthorizationKey
	export type BatchOperationKey =
		import('@camunda8/orchestration-cluster-api').BatchOperationKey
	export type DecisionDefinitionId =
		import('@camunda8/orchestration-cluster-api').DecisionDefinitionId
	export type DecisionDefinitionKey =
		import('@camunda8/orchestration-cluster-api').DecisionDefinitionKey
	export type DecisionEvaluationInstanceKey =
		import('@camunda8/orchestration-cluster-api').DecisionEvaluationInstanceKey
	export type DecisionEvaluationKey =
		import('@camunda8/orchestration-cluster-api').DecisionEvaluationKey
	export type DecisionInstanceKey =
		import('@camunda8/orchestration-cluster-api').DecisionInstanceKey
	export type DecisionRequirementsKey =
		import('@camunda8/orchestration-cluster-api').DecisionRequirementsKey
	export type DeploymentKey =
		import('@camunda8/orchestration-cluster-api').DeploymentKey
	export type DocumentId =
		import('@camunda8/orchestration-cluster-api').DocumentId
	export type ElementId =
		import('@camunda8/orchestration-cluster-api').ElementId
	export type ElementInstanceKey =
		import('@camunda8/orchestration-cluster-api').ElementInstanceKey
	export type EndCursor =
		import('@camunda8/orchestration-cluster-api').EndCursor
	export type FormId = import('@camunda8/orchestration-cluster-api').FormId
	export type FormKey = import('@camunda8/orchestration-cluster-api').FormKey
	export type IncidentKey =
		import('@camunda8/orchestration-cluster-api').IncidentKey
	export type JobKey = import('@camunda8/orchestration-cluster-api').JobKey
	export type MessageCorrelationKey =
		import('@camunda8/orchestration-cluster-api').MessageCorrelationKey
	export type MessageKey =
		import('@camunda8/orchestration-cluster-api').MessageKey
	export type MessageSubscriptionKey =
		import('@camunda8/orchestration-cluster-api').MessageSubscriptionKey
	export type ProcessDefinitionId =
		import('@camunda8/orchestration-cluster-api').ProcessDefinitionId
	export type ProcessDefinitionKey =
		import('@camunda8/orchestration-cluster-api').ProcessDefinitionKey
	export type ProcessInstanceKey =
		import('@camunda8/orchestration-cluster-api').ProcessInstanceKey
	export type ScopeKey = import('@camunda8/orchestration-cluster-api').ScopeKey
	export type SignalKey =
		import('@camunda8/orchestration-cluster-api').SignalKey
	export type StartCursor =
		import('@camunda8/orchestration-cluster-api').StartCursor
	export type Tag = import('@camunda8/orchestration-cluster-api').Tag
	export type TenantId = import('@camunda8/orchestration-cluster-api').TenantId
	export type Username = import('@camunda8/orchestration-cluster-api').Username
	export type UserTaskKey =
		import('@camunda8/orchestration-cluster-api').UserTaskKey
	export type VariableKey =
		import('@camunda8/orchestration-cluster-api').VariableKey
}
