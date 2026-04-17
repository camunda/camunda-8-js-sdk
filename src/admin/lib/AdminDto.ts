export interface ClusterClient {
	name: string
	clientId: string
	permissions: ('Zeebe' | 'Operate' | 'Tasklist')[]
}

export interface CreatedClusterClient {
	uuid: string
	clientId: string
	clientSecret: string
}

export interface ClusterClientConnectionDetails {
	name: string
	ZEEBE_ADDRESS: string
	ZEEBE_CLIENT_ID: string
	ZEEBE_AUTHORIZATION_SERVER_URL: string
}

export type ClusterStatusstring =
	| 'Healthy'
	| 'Unhealthy'
	| 'Creating'
	| 'Updating'

/* Describing a Camunda cluster running in your organization. For reference, use the UUID. */
export interface Cluster {
	/* The ID used in all further API operations referencing your cluster. */
	uuid: string
	name: string
	ownerId: string
	created: string
	/* Also called ClusterPlanType, this describes the hardware used to run your Camunda cluster. */
	planType: {
		name: string
		uuid: string
	}
	/* The data center where your Camunda cluster is running. */
	region: {
		name: string
		uuid: string
	}
	/* The version of Camunda running on your cluster. */
	generation: {
		name: string
		uuid: string
	}
	/* The software channel your cluster is running on. */
	channel: {
		name: string
		uuid: string
	}
	/* A health indicator for your Camunda cluster. Each of the components have their own state. The combined state is in the field ready. */
	status: {
		optimizeStatus: ClusterStatusstring
		tasklistStatus: ClusterStatusstring
		operateStatus: ClusterStatusstring
		zeebeStatus: ClusterStatusstring
		ready: ClusterStatusstring
	}
	/* Endpoints for the components running in your Camunda cluster. */
	links: {
		connectors: string
		console: string
		optimize: string
		tasklist: string
		operate: string
		zeebe: string
	}
}

export interface CreateClusterBody {
	name: string
	planTypeId: string
	channelId: string
	generationId: string
	regionId: string
}

export interface Parameters {
	channels: [
		{
			allowedGenerations: [
				{
					name: string
					uuid: string
				},
			]
			defaultGeneration: {
				name: string
				uuid: string
			}
			name: string
			uuid: string
		},
	]
	clusterPlanTypes: [
		{
			name: string
			uuid: string
		},
	]
	regions: [
		{
			name: string
			uuid: string
		},
	]
}

export type OrganizationRole =
	| 'member'
	| 'admin'
	| 'owner'
	| 'supportagent'
	| 'operationsengineer'
	| 'taskuser'
	| 'analyst'
	| 'developer'
	| 'visitor'
export interface Member {
	name: string
	email: string
	roles: OrganizationRole[]
	invitePending: boolean
}

export interface MetaDto {
	'web-modeler': string[]
}

export type CamundaClusterStage = 'dev' | 'test' | 'stage' | 'prod'

export interface UpdateClusterBody {
	name?: string
	description?: string
	stageLabel?: CamundaClusterStage
	numberOfAllocatedHwPackages?: number
}

export interface GenerationUpgradeForClusterDto {
	cluster: {
		id: string
		name: string
	}
	oldGeneration: {
		id: string
		name: string
	}
	newGeneration: {
		id: string
		name: string
	}
	orgId: string
}

export interface IpAllowListEntry {
	description: string
	ip: string
}

export interface ActivateSecureConnectivityBody {
	allowedPrincipals: string[]
	allowedRegions: string[]
}

export interface SecureConnectivityEndpointConnection {
	state: string
	serviceId: string
	owner: string
	endpointId: string
	creationTimestamp: string
}

export interface SecureConnectivityCondition {
	lastTransitionTime: string
	observedGeneration: number
	message: string
	reason: string
	status: string
	type: string
}

export interface SecureConnectivityDto {
	status: {
		urls: Record<string, unknown>
		observedGeneration: number
		endpointConnections: SecureConnectivityEndpointConnection[]
		endpointConnectionCount: number
		endpoint: {
			privateDnsName: string
			type: string
			serviceName: string
			region: string
		}
		conditions: SecureConnectivityCondition[]
	}
	metadata: {
		name: string
		labels: {
			orgId: string
		}
		namespace: string
	}
	spec: {
		allowedPrincipals: string[]
		allowedRegions: string[]
		cluster: {
			id: string
		}
	}
}

export interface SecureConnectivityStatusResponse {
	status: SecureConnectivityDto | Record<string, never>
}

export interface MonitoringClient {
	uuid: string
	name: string
	username: string
	created: string
	lastUsed: string
	createdBy: string
	createdByName: string
}

export interface CreatedMonitoringClient extends MonitoringClient {
	password: string
}

export interface MonitoringMetricsEndpoint {
	target: string
	scheme: string
	path: string
}

export interface MonitoringStatus {
	metricsEndpoint: MonitoringMetricsEndpoint
	conditions: unknown[]
}

export interface MonitoringClientsResponse {
	clients: MonitoringClient[]
	status: MonitoringStatus | Record<string, never>
}

export type BackupStatus = 'In progress' | 'Failed' | 'Complete' | '-'

export interface Backup {
	uuid: string
	name: string
	created: string
	completed: string
	status: BackupStatus
	zeebeStatus: BackupStatus
	tasklistStatus: BackupStatus
	operateStatus: BackupStatus
	optimizeStatus: BackupStatus
}

export type AuditType = 'c' | 'r' | 'u' | 'd'

export interface AuditEvent {
	service: string
	orgId: string
	timestamp: number
	audit: string
	auditType: AuditType
	entity: string
	entityId: string
	userId: string
	parentEntity?: string
	parentEntityId?: string
	entityAttribute?: string
	entityAttributeValueFrom?: string
	entityAttributeValueTo?: string
}
