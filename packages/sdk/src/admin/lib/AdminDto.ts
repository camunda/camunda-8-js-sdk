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
