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
