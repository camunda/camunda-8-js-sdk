export const BaseCredentialElements = {
	ZEEBE_ADDRESS: {
		type: 'string' as const,
		optional: false,
	},
	ZEEBE_CLIENT_ID: {
		type: 'string' as const,
		optional: false,
	},
	ZEEBE_CLIENT_SECRET: {
		type: 'string' as const,
		optional: false,
	},
	ZEEBE_AUTHORIZATION_SERVER_URL: {
		type: 'string' as const,
		optional: false,
	},
	ZEEBE_TOKEN_AUDIENCE: {
		type: 'string' as const,
		optional: false,
	},
	CAMUNDA_CLUSTER_ID: {
		type: 'string' as const,
		optional: true,
	},
	CAMUNDA_CLUSTER_REGION: {
		type: 'string' as const,
		optional: true,
	},
	CAMUNDA_CREDENTIALS_SCOPES: {
		type: 'string' as const,
		optional: false,
	},
	CAMUNDA_OAUTH_URL: {
		type: 'string' as const,
		optional: false,
	},
	CAMUNDA_TOKEN_SCOPE: {
		type: 'string' as const,
		optional: true,
	},
	CAMUNDA_CUSTOM_ROOT_CERT: {
		type: 'string' as const,
		optional: true,
	},
}

export type BaseCredentials = {
	ZEEBE_ADDRESS: string
	ZEEBE_CLIENT_ID: string
	ZEEBE_CLIENT_SECRET: string
	ZEEBE_AUTHORIZATION_SERVER_URL: string
	ZEEBE_TOKEN_AUDIENCE: string
	CAMUNDA_CLUSTER_ID?: string
	CAMUNDA_CLUSTER_REGION?: string
	CAMUNDA_CREDENTIALS_SCOPES: string
	CAMUNDA_OAUTH_URL: string
	CAMUNDA_CUSTOM_ROOT_CERT?: string
	CAMUNDA_TOKEN_SCOPE?: string
}
