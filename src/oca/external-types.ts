/**
 * Lightweight re-export surface for Orchestration Cluster API types needed in SDK docs.
 * This avoids pointing TypeDoc at the dependency's large declaration bundle (which caused OOM)
 * while still exposing the public types for documentation and user imports.
 */
export type {
	CamundaClient,
	CamundaClientLoose,
} from '@camunda8/orchestration-cluster-api'
