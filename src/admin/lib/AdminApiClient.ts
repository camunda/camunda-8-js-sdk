import d from 'debug'
import got from 'got'

import {
    CamundaEnvironmentConfigurator,
    CamundaPlatform8Configuration,
    DeepPartial,
    GetCustomCertificateBuffer,
    GotRetryConfig,
    RequireConfiguration,
    beforeCallHook,
    constructOAuthProvider,
    createUserAgentString,
    gotBeforeErrorHook,
} from '../../lib'
import { IHeadersProvider } from '../../oauth'

import * as Dto from './AdminDto'

const debug = d('camunda:adminconsole')

/**
 * This class provides methods to interact with the Camunda Admin API.
 * @throws {RESTError} An error that may occur during API operations.
 */
export class AdminApiClient {
	private userAgentString: string
	private oAuthProvider: IHeadersProvider
	private rest: Promise<typeof got>

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IHeadersProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		const prefixUrl = RequireConfiguration(
			config.CAMUNDA_CONSOLE_BASE_URL,
			'CAMUNDA_CONSOLE_BASE_URL'
		)

		this.oAuthProvider =
			options?.oAuthProvider ??
			constructOAuthProvider(config, {
				explicitFromConstructor: Object.prototype.hasOwnProperty.call(
					options?.config ?? {},
					'CAMUNDA_AUTH_STRATEGY'
				),
			})

		this.userAgentString = createUserAgentString(config)
		this.rest = GetCustomCertificateBuffer(config).then(
			(certificateAuthority) =>
				got.extend({
					prefixUrl,
					retry: GotRetryConfig,
					https: {
						certificateAuthority,
					},
					handlers: [beforeCallHook],
					hooks: {
						beforeError: [gotBeforeErrorHook(config)],
						beforeRequest: config.middleware ?? [],
					},
				})
		)
		debug('prefixUrl', `${prefixUrl}`)
	}

	private async getHeaders() {
		const authorization = await this.oAuthProvider.getHeaders('CONSOLE')
		const headers = {
			'content-type': 'application/json',
			...authorization,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
		return headers
	}

	/**
	 *
	 * Get an array of the current API clients for this cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClients) for more details.
	 * @throws {RESTError}
	 * @param clusterUuid - The cluster UUID
	 *
	 */
	async getClients(clusterUuid: string): Promise<Dto.ClusterClient[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}/clients`, {
			headers,
		}).json()
	}

	/**
	 * Create a new API client for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateClient) for more details.
	 * @throws {RESTError}
	 */
	async createClient(req: {
		clusterUuid: string
		clientName: string
		permissions: string[]
	}): Promise<Dto.CreatedClusterClient> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`clusters/${req.clusterUuid}/clients`, {
				body: JSON.stringify({
					clientName: req.clientName,
					permissions: req.permissions,
				}),
				headers,
			})
			.json()
	}

	/**
	 * Get the details of an API client. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClient) for more details.
	 * @param clusterUuid
	 * @param clientId
	 * @throws {RESTError}
	 * @returns
	 */
	async getClient(
		clusterUuid: string,
		clientId: string
	): Promise<Dto.ClusterClientConnectionDetails> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}/clients/${clientId}`, {
			headers,
		}).json()
	}

	/**
	 * See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteClient) for more details.
	 * @param clusterUuid
	 * @param clientId
	 * @throws {RESTError}
	 */
	async deleteClient(clusterUuid: string, clientId: string): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`clusters/${clusterUuid}/clients/${clientId}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Return an array of clusters. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClusters) for more details.
	 * @throws {RESTError}
	 */
	async getClusters(): Promise<Dto.Cluster[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest('clusters', {
			headers,
		}).json()
	}

	/**
	 *
	 * Create a new cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateCluster) for more details.
	 * @throws {RESTError}
	 */
	async createCluster(
		createClusterRequest: Dto.CreateClusterBody
	): Promise<{ clusterId: string }> {
		const headers = await this.getHeaders()
		const req = {
			body: JSON.stringify(createClusterRequest),
			headers,
		}
		const rest = await this.rest
		return rest.post('clusters', req).json()
	}

	/**
	 *
	 * Retrieve the metadata for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetCluster) for more details.
	 * @throws {RESTError}
	 *
	 */
	async getCluster(clusterUuid: string): Promise<Dto.Cluster> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}`, {
			headers,
		}).json()
	}

	/**
	 *
	 * Delete a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteCluster) for more details.
	 * @throws {RESTError}
	 *
	 */
	async deleteCluster(clusterUuid: string): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`clusters/${clusterUuid}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Retrieve the available parameters for cluster creation. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetParameters) for more details.
	 * @throws {RESTError}
	 */
	async getParameters(): Promise<Dto.Parameters> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest('clusters/parameters', {
			headers,
		}).json()
	}

	/**
	 *
	 * Retrieve the connector secrets. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetSecrets) for more details.
	 * @throws {RESTError}
	 */
	async getSecrets(clusterUuid: string): Promise<{ [key: string]: string }> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}/secrets`, {
			headers,
		}).json()
	}

	/**
	 *
	 * Create a new connector secret. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateSecret) for more details.
	 * @throws {RESTError}
	 */
	async createSecret({
		clusterUuid,
		secretName,
		secretValue,
	}: {
		clusterUuid: string
		secretName: string
		secretValue: string
	}): Promise<null> {
		const headers = await this.getHeaders()
		const req = {
			body: JSON.stringify({ secretName, secretValue }),
			headers,
		}
		const rest = await this.rest
		return rest.post(`clusters/${clusterUuid}/secrets`, req).json()
	}

	/**
	 *
	 * Delete a connector secret. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteSecret) for more details.
	 * @throws {RESTError}
	 */
	async deleteSecret(clusterUuid: string, secretName: string): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`clusters/${clusterUuid}/secrets/${secretName}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Add one or more IPs to the whitelist for the cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpdateIpWhitelist) for more details.
	 * @throws {RESTError}
	 * @param ipwhitelist
	 * @returns
	 */
	async whitelistIPs(
		clusterUuid: string,
		ipwhitelist: [
			{
				description: string
				ip: string
			},
		]
	): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.put(`clusters/${clusterUuid}/ipwhitelist`, {
				body: JSON.stringify({
					ipwhitelist,
				}),
				headers,
			})
			.json()
	}

	/**
	 *
	 * Retrieve a list of members and pending invites for your organisation. See the [API Documentation]() for more details.
	 * @throws {RESTError}
	 */
	async getUsers(): Promise<Dto.Member[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.get('members', {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Add a member. See the [API Documentation]() for more details.
	 * @throws {RESTError}
	 *
	 */
	async createMember(
		email: string,
		orgRoles: Dto.OrganizationRole[]
	): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`members/${email}`, {
				headers,
				body: JSON.stringify({ orgRoles }),
			})
			.json()
	}

	/**
	 *
	 * Delete a member from your organization. See the [API Documentation]() for more details.
	 * @throws {RESTError}
	 *
	 */
	async deleteMember(email: string): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`members/${email}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Get the egress IP ranges for Camunda SaaS. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetMeta) for more details.
	 * @throws {RESTError}
	 */
	async getIpRanges(): Promise<Dto.MetaDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest('meta/ip-ranges', {
			headers,
		}).json()
	}

	/**
	 *
	 * Update a cluster's name, description, or stage label. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpdateCluster) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param updateRequest - The fields to update
	 * @throws {RESTError}
	 */
	async updateCluster(
		clusterUuid: string,
		updateRequest: Dto.UpdateClusterBody
	): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.patch(`clusters/${clusterUuid}`, {
			body: JSON.stringify(updateRequest),
			headers,
		})
	}

	/**
	 *
	 * Upgrade a cluster to the latest available generation. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpgradeCluster) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async upgradeCluster(
		clusterUuid: string
	): Promise<Dto.GenerationUpgradeForClusterDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.put(`clusters/${clusterUuid}/upgrade`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Resume a suspended cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/Wake) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async wakeCluster(clusterUuid: string): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.put(`clusters/${clusterUuid}/wake`, {
			headers,
		})
	}

	/**
	 *
	 * Update the IP allowlist for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpdateIpAllowlist) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param ipallowlist - Array of IP allowlist entries
	 * @throws {RESTError}
	 */
	async updateIpAllowlist(
		clusterUuid: string,
		ipallowlist: Dto.IpAllowListEntry[]
	): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.put(`clusters/${clusterUuid}/ipallowlist`, {
			body: JSON.stringify({ ipallowlist }),
			headers,
		})
	}

	/**
	 *
	 * Update a connector secret value. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpdateSecret) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param secretName - The name of the secret to update
	 * @param secretValue - The new secret value
	 * @throws {RESTError}
	 */
	async updateSecret(
		clusterUuid: string,
		secretName: string,
		secretValue: string
	): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.put(`clusters/${clusterUuid}/secrets/${secretName}`, {
			body: JSON.stringify({ secretValue }),
			headers,
		})
	}

	/**
	 *
	 * Activate Secure Connectivity for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/ActivateSecureConnectivity) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param request - The allowed principals and regions
	 * @throws {RESTError}
	 */
	async activateSecureConnectivity(
		clusterUuid: string,
		request: Dto.ActivateSecureConnectivityBody
	): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.post(`clusters/${clusterUuid}/secure-connectivity`, {
			body: JSON.stringify(request),
			headers,
		})
	}

	/**
	 *
	 * Deactivate Secure Connectivity for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeactivateSecureConnectivity) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async deactivateSecureConnectivity(clusterUuid: string): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.delete(`clusters/${clusterUuid}/secure-connectivity`, {
			headers,
		})
	}

	/**
	 *
	 * Get the Secure Connectivity status for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetSecureConnectivityStatus) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async getSecureConnectivityStatus(
		clusterUuid: string
	): Promise<Dto.SecureConnectivityStatusResponse> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}/secure-connectivity`, {
			headers,
		}).json()
	}

	/**
	 *
	 * Activate External Monitoring (BYOM) for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/ActivateMonitoring) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async activateMonitoring(clusterUuid: string): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.post(`clusters/${clusterUuid}/monitoring`, {
			headers,
		})
	}

	/**
	 *
	 * Deactivate External Monitoring (BYOM) for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeactivateMonitoring) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async deactivateMonitoring(clusterUuid: string): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.delete(`clusters/${clusterUuid}/monitoring`, {
			headers,
		})
	}

	/**
	 *
	 * Get all External Monitoring clients for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetMonitoringClients) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async getMonitoringClients(
		clusterUuid: string
	): Promise<Dto.MonitoringClientsResponse> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}/monitoring/clients`, {
			headers,
		}).json()
	}

	/**
	 *
	 * Create a new External Monitoring client for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateMonitoringClient) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param username - The username for the monitoring client
	 * @throws {RESTError}
	 */
	async createMonitoringClient(
		clusterUuid: string,
		username: string
	): Promise<Dto.CreatedMonitoringClient> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`clusters/${clusterUuid}/monitoring/clients`, {
				body: JSON.stringify({ username }),
				headers,
			})
			.json()
	}

	/**
	 *
	 * Rotate the password for an External Monitoring client. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/RotateMonitoringClientPassword) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param clientUuid - The monitoring client UUID
	 * @throws {RESTError}
	 */
	async rotateMonitoringClientPassword(
		clusterUuid: string,
		clientUuid: string
	): Promise<Dto.CreatedMonitoringClient> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(
				`clusters/${clusterUuid}/monitoring/clients/${clientUuid}/rotate`,
				{
					headers,
				}
			)
			.json()
	}

	/**
	 *
	 * Delete an External Monitoring client. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteMonitoringClient) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param clientUuid - The monitoring client UUID
	 * @throws {RESTError}
	 */
	async deleteMonitoringClient(
		clusterUuid: string,
		clientUuid: string
	): Promise<void> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		await rest.delete(
			`clusters/${clusterUuid}/monitoring/clients/${clientUuid}`,
			{
				headers,
			}
		)
	}

	/**
	 *
	 * Get all backups for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetBackups) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async getBackups(clusterUuid: string): Promise<Dto.Backup[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`clusters/${clusterUuid}/backups`, {
			headers,
		}).json()
	}

	/**
	 *
	 * Create a new backup for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateBackup) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @throws {RESTError}
	 */
	async createBackup(clusterUuid: string): Promise<Dto.Backup> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`clusters/${clusterUuid}/backups`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Delete a backup. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteBackup) for more details.
	 * @param clusterUuid - The cluster UUID
	 * @param backupId - The backup ID
	 * @throws {RESTError}
	 */
	async deleteBackup(
		clusterUuid: string,
		backupId: string
	): Promise<Dto.Backup> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`clusters/${clusterUuid}/backups/${backupId}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * Fetch all activity/audit events as JSON. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetJson) for more details.
	 * @throws {RESTError}
	 */
	async getActivityEvents(): Promise<Dto.AuditEvent[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest('activity/json', {
			headers,
		}).json()
	}

	/**
	 *
	 * Fetch all activity/audit events as CSV. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetCsv) for more details.
	 * @throws {RESTError}
	 */
	async getActivityEventsCsv(): Promise<string> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest('activity/csv', {
			headers,
		}).text()
	}
}
