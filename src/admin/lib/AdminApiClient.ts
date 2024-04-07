import d from 'debug'
import got from 'got'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCertificateAuthority,
	RequireConfiguration,
	constructOAuthProvider,
	createUserAgentString,
} from '../../lib'
import { IOAuthProvider } from '../../oauth'

import * as Dto from './AdminDto'

const debug = d('camunda:adminconsole')

export class AdminApiClient {
	private userAgentString: string
	private oAuthProvider: IOAuthProvider
	private rest: typeof got

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IOAuthProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		const baseUrl = RequireConfiguration(
			config.CAMUNDA_CONSOLE_BASE_URL,
			'CAMUNDA_CONSOLE_BASE_URL'
		)

		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)

		const certificateAuthority = GetCertificateAuthority(config)

		this.userAgentString = createUserAgentString(config)
		this.rest = got.extend({
			prefixUrl: `${baseUrl}/clusters`,
			https: {
				certificateAuthority,
			},
			hooks: {
				beforeError: [
					(error) => {
						const { request } = error
						if (request) {
							debug(`Error in request to ${request.options.url.href}`)
							debug(
								`Request headers: ${JSON.stringify(request.options.headers)}`
							)
							debug(`Error: ${error.code} - ${error.message}`)

							// Attach more contextual information to the error object
							error.message += ` (request to ${request.options.url.href})`
						}
						return error
					},
				],
			},
		})
		debug('prefixUrl', `${baseUrl}/clusters`)
	}

	private async getHeaders() {
		const token = await this.oAuthProvider.getToken('CONSOLE')
		const headers = {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
		return headers
	}

	/**
	 *
	 * @description Get an array of the current API clients for this cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClients) for more details.
	 * @param clusterUuid - The cluster UUID
	 *
	 */
	async getClients(clusterUuid: string): Promise<Dto.ClusterClient[]> {
		const headers = await this.getHeaders()
		return this.rest(`${clusterUuid}/clients`, {
			headers,
		}).json()
	}

	/**
	 * @description Create a new API client for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateClient) for more details.
	 * @returns
	 */
	async createClient(req: {
		clusterUuid: string
		clientName: string
		permissions: string[]
	}): Promise<Dto.CreatedClusterClient> {
		const headers = await this.getHeaders()
		return this.rest
			.post(`${req.clusterUuid}/clients`, {
				body: JSON.stringify({
					clientName: req.clientName,
					permissions: req.permissions,
				}),
				headers,
			})
			.json()
	}

	/**
	 * @description Get the details of an API client. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClient) for more details.
	 * @param clusterUuid
	 * @param clientId
	 * @returns
	 */
	async getClient(
		clusterUuid: string,
		clientId: string
	): Promise<Dto.ClusterClientConnectionDetails> {
		const headers = await this.getHeaders()
		return this.rest(`${clusterUuid}/clients/${clientId}`, {
			headers,
		}).json()
	}

	/**
	 * @description See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteClient) for more details.
	 * @param clusterUuid
	 * @param clientId
	 */
	async deleteClient(clusterUuid: string, clientId: string): Promise<null> {
		const headers = await this.getHeaders()
		return this.rest
			.delete(`${clusterUuid}/clients/${clientId}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * @description Return an array of clusters. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClusters) for more details.
	 */
	async getClusters(): Promise<Dto.Cluster[]> {
		const headers = await this.getHeaders()
		return this.rest('', {
			headers,
		}).json()
	}

	/**
	 *
	 * @description Create a new cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateCluster) for more details.
	 */
	async createCluster(
		createClusterRequest: Dto.CreateClusterBody
	): Promise<{ clusterId: string }> {
		const headers = await this.getHeaders()
		const req = {
			body: JSON.stringify(createClusterRequest),
			headers,
		}
		debug(req)
		return this.rest.post('', req).json()
	}

	/**
	 *
	 * @description Retrieve the metadata for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetCluster) for more details.
	 *
	 */
	async getCluster(clusterUuid: string): Promise<Dto.Cluster> {
		const headers = await this.getHeaders()
		return this.rest(`${clusterUuid}`, {
			headers,
		}).json()
	}

	/**
	 *
	 * @description Delete a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteCluster) for more details.
	 *
	 */
	async deleteCluster(clusterUuid: string): Promise<null> {
		const headers = await this.getHeaders()
		return this.rest
			.delete(`${clusterUuid}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * @description Retrieve the available parameters for cluster creation. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetParameters) for more details.
	 */
	async getParameters(): Promise<Dto.Parameters> {
		const headers = await this.getHeaders()
		return this.rest('parameters', {
			headers,
		}).json()
	}

	/**
	 *
	 * @description Retrieve the connector secrets. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetSecrets) for more details.
	 */
	async getSecrets(clusterUuid: string): Promise<{ [key: string]: string }> {
		const headers = await this.getHeaders()
		return this.rest(`${clusterUuid}/secrets`, {
			headers,
		}).json()
	}

	/**
	 *
	 * @description Create a new connector secret. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateSecret) for more details.
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
		return this.rest.post(`${clusterUuid}/secrets`, req).json()
	}

	/**
	 *
	 * @description Delete a connector secret. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteSecret) for more details.
	 */
	async deleteSecret(clusterUuid: string, secretName: string): Promise<null> {
		const headers = await this.getHeaders()
		return this.rest
			.delete(`${clusterUuid}/secrets/${secretName}`, {
				headers,
			})
			.json()
	}

	/**
	 *
	 * @description Add one or more IPs to the whitelist for the cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpdateIpWhitelist) for more details.
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
	) {
		const headers = await this.getHeaders()
		return this.rest
			.put(`${clusterUuid}/ipwhitelist`, {
				body: JSON.stringify({
					ipwhitelist,
				}),
				headers,
			})
			.json()
	}

	/**
	 *
	 * @description Retrieve a list of members and pending invites for your organisation. See the [API Documentation]() for more details.
	 */
	async getUsers(): Promise<Dto.Member[]> {
		const headers = await this.getHeaders()
		return this.rest
			.get('members', {
				headers,
			})
			.json()
	}

	/**
	 *
	 * @description Add a member. See the [API Documentation]() for more details.
	 *
	 */
	async createMember(
		email: string,
		orgRoles: Dto.OrganizationRole[]
	): Promise<null> {
		const headers = await this.getHeaders()
		return this.rest
			.post(`members/${email}`, {
				headers,
				body: JSON.stringify({ orgRoles }),
			})
			.json()
	}

	/**
	 *
	 * @description Delete a member from your organization. See the [API Documentation]() for more details.
	 *
	 */
	async deleteMember(email: string): Promise<null> {
		const headers = await this.getHeaders()
		return this.rest
			.delete(`members/${email}`, {
				headers,
			})
			.json()
	}
}
