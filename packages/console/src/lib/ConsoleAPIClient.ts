import { getConsoleToken, getConsoleCredentials } from "@jwulf/oauth";
import got from 'got';
import { Cluster, ClusterClient, ClusterClientConnectionDetails, CreateClusterBody, CreatedClusterClient, Member, OrganizationRole, Parameters } from "./APIObjects";
const pkg = require('../../package.json')
const debug = require('debug')('consoleapi')

export class ConsoleApiClient {
    private userAgentString: string
    private gotOptions: { prefixUrl: string, hooks: { beforeRequest: ((o: any) => void)[] } }

    constructor(userAgent?: string) {
        const customAgent = userAgent ? ` ${userAgent}`: ``
        this.userAgentString =  `console-client-nodejs/${pkg.version}${customAgent}`
        const creds = getConsoleCredentials()
        this.gotOptions = {
            prefixUrl: `${creds.CAMUNDA_CONSOLE_BASE_URL}/clusters`,
            hooks: {
                beforeRequest:[ (options: any) => {
                    debug('beforeRequest', options)                
                }]
            }
        }
        debug('prefixUrl', `${creds.CAMUNDA_CONSOLE_BASE_URL}/clusters`)
    }

    private async getHeaders() {
        const headers = {
            'content-type': 'application/json',
            'authorization': `Bearer ${await getConsoleToken(this.userAgentString)}`,
            'user-agent': this.userAgentString,
            'accept': '*/*'
        }    
        return headers   
    }

    /**
     * 
     * @description Get an array of the current API clients for this cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClients) for more details.
     * @param clusterUuid - The cluster UUID
     *  
     */
    async getClients(clusterUuid: string): Promise<ClusterClient[]> {
        const headers = await this.getHeaders()
        return got(`${clusterUuid}/clients`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * @description Create a new API client for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateClient) for more details.
     * @returns 
     */
    async createClient(req: { clusterUuid: string, clientName: string, permissions: string[] }): Promise<CreatedClusterClient> {
        const headers = await this.getHeaders()
        return got.post(`${req.clusterUuid}/clients`, {
            body: JSON.stringify({
                clientName: req.clientName, 
                permissions: req.permissions
            }),
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * @description Get the details of an API client. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClient) for more details.     
     * @param clusterUuid 
     * @param clientId 
     * @returns 
     */
    async getClient(clusterUuid: string, clientId: string): Promise<ClusterClientConnectionDetails> {
        const headers = await this.getHeaders()
        return got(`${clusterUuid}/clients/${clientId}`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * @description See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteClient) for more details.
     * @param clusterUuid 
     * @param clientId 
     */
    async deleteClient(clusterUuid: string, clientId: string): Promise<null> {
        const headers = await this.getHeaders()
        return got.delete(`${clusterUuid}/clients/${clientId}`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Return an array of clusters. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetClusters) for more details.
     */
    async getClusters(): Promise<Cluster[]> {
        const headers = await this.getHeaders()
        return got('', {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Create a new cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateCluster) for more details.
     */
    async createCluster(createClusterRequest: CreateClusterBody): Promise<{clusterId: string}> {
        const headers = await this.getHeaders()
        const req =  {
            body: JSON.stringify(createClusterRequest),
            headers,
            ...this.gotOptions
        }
        debug(req)
        return got.post('', req).json()
    }

    /**
     * 
     * @description Retrieve the metadata for a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetCluster) for more details. 
     * 
     */
    async getCluster(clusterUuid: string): Promise<Cluster> {
        const headers = await this.getHeaders()
        return got(`${clusterUuid}`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Delete a cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteCluster) for more details.   
     *  
     */
    async deleteCluster(clusterUuid: string): Promise<null> {
        const headers = await this.getHeaders()
        return got.delete(`${clusterUuid}`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Retrieve the available parameters for cluster creation. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetParameters) for more details.
     */
    async getParameters(): Promise<Parameters> {
        const headers = await this.getHeaders()
        return got(`parameters`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Retrieve the connector secrets. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/GetSecrets) for more details. 
     */
    async getSecrets(clusterUuid: string): Promise<{[key: string]: string}> {
        const headers = await this.getHeaders()
        return got(`${clusterUuid}/secrets`, {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Create a new connector secret. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/CreateSecret) for more details. 
     */
    async createSecret({
        clusterUuid, 
        secretName, 
        secretValue
    }: { 
            clusterUuid: string, 
            secretName: string, 
            secretValue: string 
    }): Promise<null> {
        const headers = await this.getHeaders()
        const req =  {
            body: JSON.stringify({secretName, secretValue}),
            headers,
            ...this.gotOptions
        }
        return got.post(`${clusterUuid}/secrets`, req).json()
    }

    /**
     * 
     * @description Delete a connector secret. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/DeleteSecret) for more details. 
     */
    async deleteSecret(clusterUuid: string, secretName: string): Promise<null> {
        const headers = await this.getHeaders()
        return got.delete(`${clusterUuid}/secrets/${secretName}`, {
            headers,
            ...this.gotOptions
        }).json()        
    }

    /**
     * 
     * @description Add one or more IPs to the whitelist for the cluster. See [the API Documentation](https://console.cloud.camunda.io/customer-api/openapi/docs/#/default/UpdateIpWhitelist) for more details.
     * @param ipwhitelist 
     * @returns 
     */
    async whitelistIPs(clusterUuid: string, ipwhitelist: [{
        description: string,
        ip: string
    }]) {
        const headers = await this.getHeaders()
        return got.put(`${clusterUuid}/ipwhitelist`,
            {
                body: JSON.stringify({
                    ipwhitelist
                }),
                headers,
                ...this.gotOptions
            }).json()
    }

    /**
     * 
     * @description Retrieve a list of members and pending invites for your organisation. See the [API Documentation]() for more details.
     */
    async getUsers(): Promise<Member[]> {
        const headers = await this.getHeaders()
        return got.get('members', {
            headers,
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Add a member. See the [API Documentation]() for more details.
     *  
     */
    async createMember(email: string, orgRoles: OrganizationRole[]): Promise<null> {
        const headers = await this.getHeaders()
        return got.post(`members/${email}`, {
            headers,
            body: JSON.stringify({orgRoles}),
            ...this.gotOptions
        }).json()
    }

    /**
     * 
     * @description Delete a member from your organization. See the [API Documentation]() for more details. 
     *  
     */
    async deleteMember(email: string): Promise<null> {
        const headers = await this.getHeaders()
        return got.delete(`members/${email}`, {
            headers,
            ...this.gotOptions
        }).json()
    }
} 