import {
	OAuthProviderImpl,
	getOperateCredentials,
	getOperateToken,
} from '@camunda8/oauth'
import got from 'got'

import {
	ChangeStatus,
	FlownodeInstance,
	Incident,
	ProcessDefinition,
	ProcessInstance,
	Query,
	SearchResults,
	Variable,
} from './APIObjects'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../../package.json')

const OPERATE_API_VERSION = 'v1'

type JSONDoc = { [key: string]: string | boolean | number | JSONDoc }
/**
 * @description The high-level client for Operate.
 * @example
 * ```
 * const operate = new OperateApiClient()
 *
 * operate.searchProcessInstances({
 *     filter: {
 *         state: "ACTIVE"
 *     },
 *     size: 50
 * }).then(instances => {
 *     console.log(instances)
 * })
 * ```
 */
export class OperateApiClient {
	private userAgentString: string
	private gotOptions: { prefixUrl: string }
	oauthProvider: OAuthProviderImpl | undefined

	/**
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * ```
	 */
	constructor(
		options: {
			oauthProvider?: OAuthProviderImpl
			baseUrl?: string
		} = {}
	) {
		this.oauthProvider = options.oauthProvider
		this.userAgentString = `operate-client-nodejs/${pkg.version}`
		const baseUrl =
			options.baseUrl ?? getOperateCredentials().CAMUNDA_OPERATE_BASE_URL
		this.gotOptions = {
			prefixUrl: `${baseUrl}/${OPERATE_API_VERSION}`,
		}
	}

	private async getHeaders() {
		const token = this.oauthProvider
			? await this.oauthProvider.getToken('OPERATE')
			: await getOperateToken(this.userAgentString)

		return {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
	}

	/**
	 * @description Search and retrieve process definitions.
	 *
	 * [Camunda 8 Documentation](https://docs.camunda.io/docs/apis-clients/operate-api/#process-definition)
	 * @example
	 * ```
	 * const query: Query<ProcessDefinition> = {
	 *   filter: {},
	 *   size: 50,
	 *   sort: [
	 *     {
	 *       field: "bpmnProcessId",
	 *       order: "ASC",
	 *     },
	 *    ],
	 *  };
	 * const operate = newOperateClient()
	 * const defs = await operate.searchProcessDefinitions(query);
	 * ```
	 */
	public async searchProcessDefinitions(
		query: Query<ProcessDefinition> = {}
	): Promise<SearchResults<ProcessDefinition>> {
		const headers = await this.getHeaders()
		return got
			.post('process-definitions/search', {
				json: query,
				headers,
				...this.gotOptions,
			})
			.json()
	}

	/**
	 *
	 * @description Retrieve the metadata for a specific process definition, by key.
	 *
	 * [Camunda 8 Documentation](https://docs.camunda.io/docs/apis-clients/operate-api/#process-definition)
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * const definition = await operate.getProcessDefinition(2251799817140074);
	 *  ```
	 */
	public async getProcessDefinition(
		processDefinitionKey: number | string
	): Promise<ProcessDefinition> {
		const headers = await this.getHeaders()
		return got(`process-definitions/${processDefinitionKey}`, {
			headers,
			...this.gotOptions,
		}).json()
	}

	public async getProcessDefinitionXML(
		processDefinitionKey: number | string
	): Promise<string> {
		const headers = await this.getHeaders()
		return got(`process-definitions/${processDefinitionKey}/xml`, {
			headers,
			...this.gotOptions,
		}).text()
	}

	/**
	 * @description Search and retrieve process instances.
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * const query: Query<ProcessInstance>  = {
	 *   filter: {
	 *     processVersion: 1
	 *   },
	 *   size: 50,
	 *   sort: [
	 *     {
	 *       field: "bpmProcessId",
	 *       order: "ASC"
	 *     }
	 *   ]
	 * }
	 * const instances = await operate.searchProcessInstances(query)
	 * console.log(`Found ${instances.total} instances`)
	 */
	public async searchProcessInstances(
		query: Query<ProcessInstance> = {}
	): Promise<SearchResults<ProcessInstance>> {
		const headers = await this.getHeaders()
		return got
			.post('process-instances/search', {
				json: query,
				headers,
				...this.gotOptions,
			})
			.json()
	}

	/**
	 *
	 * @description Retrieve a specific process instance by id.
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * const instance = await operate.getProcessInstance(2251799819847322)
	 * ```
	 */
	public async getProcessInstance(
		processInstanceKey: number | string
	): Promise<ProcessInstance> {
		const headers = await this.getHeaders()
		return got(`process-instances/${processInstanceKey}`, {
			headers,
			...this.gotOptions,
		}).json()
	}

	/**
	 * @description Delete a specific process instance by key.
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * await operate.deleteProcessInstance(2251799819847322)
	 * ```
	 */
	public async deleteProcessInstance(
		processInstanceKey: number | string
	): Promise<ChangeStatus> {
		const headers = await this.getHeaders()
		return got
			.delete(`process-instances/${processInstanceKey}`, {
				headers,
				...this.gotOptions,
			})
			.json()
	}

	/**
	 * @description Get the statistics for a process instance, grouped by flow nodes
	 */
	public async getProcessInstanceStatistics(
		processInstanceKey: number | string
	): Promise<
		{
			// The id of the flow node for which the results are aggregated
			activityId: string
			active: number
			canceled: number
			incidents: number
			completed: number
		}[]
	> {
		const headers = await this.getHeaders()
		return got(`process-instances/${processInstanceKey}/statistics`, {
			headers,
			...this.gotOptions,
		}).json()
	}

	/**
	 * @description Get sequence flows of process instance by key
	 */
	public async getProcessInstanceSequenceFlows(
		processInstanceKey: number | string
	): Promise<string[]> {
		const headers = await this.getHeaders()
		return got(`process-instances/${processInstanceKey}/sequence-flows`, {
			headers,
			...this.gotOptions,
		}).json()
	}

	/**
	 *
	 * @description Search and retrieve incidents.
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * const query: Query<Incident> = {
	 *   filter: {
	 *     state: "ACTIVE"
	 *   },
	 *   size: 50,
	 *   sort: [
	 *     {
	 *       field: "creationTime",
	 *       order: "ASC"
	 *     }
	 *   ]
	 * }
	 * const incidents = operate.searchIncidents(query)
	 * ```
	 */
	public async searchIncidents(
		query: Query<Incident> = {}
	): Promise<SearchResults<Incident>> {
		const headers = await this.getHeaders()
		return got
			.post('incidents/search', {
				json: query,
				headers,
				...this.gotOptions,
			})
			.json()
	}

	/**
	 *
	 * @description Retrieve an incident by incident key.
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * const incident = await operate.getIncident(2251799818436725)
	 * console.log(incident.message)
	 * ```
	 */
	public async getIncident(key: number | string): Promise<Incident> {
		const headers = await this.getHeaders()
		return got(`incidents/${key}`, {
			headers,
			...this.gotOptions,
		}).json()
	}

	public async searchFlownodeInstances(
		query: Query<FlownodeInstance>
	): Promise<SearchResults<FlownodeInstance>> {
		const headers = await this.getHeaders()
		return got
			.post('flownodes/search', {
				headers,
				...this.gotOptions,
				json: query,
			})
			.json()
	}

	public async getFlownodeInstance(
		key: number | string
	): Promise<FlownodeInstance> {
		const headers = await this.getHeaders()
		return got(`flownodes/${key}`, {
			headers,
			...this.gotOptions,
		}).json()
	}

	public async searchVariables(
		query: Query<Variable>
	): Promise<SearchResults<Variable>> {
		const headers = await this.getHeaders()
		return got
			.post('variables/search', {
				headers,
				json: query,
				...this.gotOptions,
			})
			.json()
	}

	/**
	 * @description Retrieve the variables for a Process Instance, given its key
	 * @param processInstanceKey
	 * @returns
	 */
	public async getVariablesforProcess(
		processInstanceKey: number | string
	): Promise<{ items: Variable[] }> {
		const headers = await this.getHeaders()
		const body = {
			filter: {
				processInstanceKey,
			},
		}
		return got
			.post('variables/search', {
				headers,
				body: JSON.stringify(body),
				...this.gotOptions,
			})
			.json()
	}

	/**
	 * @description Retrieve the variables for a Process Instance as an object, given its key
	 * @param processInstanceKey
	 * @returns
	 */
	public async getJSONVariablesforProcess<T extends { [key: string]: JSONDoc }>(
		processInstanceKey: number | string
	): Promise<T> {
		const headers = await this.getHeaders()
		const body = {
			filter: {
				processInstanceKey,
			},
			size: 1000,
		}
		const vars: { items: Variable[] } = await got
			.post('variables/search', {
				headers,
				body: JSON.stringify(body),
				...this.gotOptions,
			})
			.json()
		return vars.items.reduce(
			(prev, curr) => ({
				...prev,
				[curr.name]: this.safeJSONparse(curr.value),
			}),
			{} as T
		)
	}

	private safeJSONparse(thing: string) {
		try {
			return JSON.parse(thing)
		} catch (e) {
			console.log(e)
			console.log(thing)
			return thing
		}
	}

	/**
	 *
	 * @description Return a variable identified by its variable key
	 * @returns
	 */
	public async getVariables(variableKey: number | string): Promise<Variable> {
		const headers = await this.getHeaders()
		return got(`variables/${variableKey}`, {
			headers,
			...this.gotOptions,
		}).json()
	}
}
