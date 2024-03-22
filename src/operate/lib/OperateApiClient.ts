import got from 'got'
import {
	CamundaEnvironmentConfigurator,
	ClientConstructor,
	GetCertificateAuthority,
	RequireConfiguration,
	constructOAuthProvider,
	packageVersion,
	parseArrayWithAnnotations,
	parseWithAnnotations,
} from 'lib'
import { IOAuthProvider } from 'oauth'

import {
	ChangeStatus,
	DecisionDefinition,
	DecisionInstance,
	DecisionRequirements,
	FlownodeInstance,
	Incident,
	ProcessDefinition,
	ProcessInstance,
	ProcessInstanceStatistics,
	Query,
	SearchResults,
	Variable,
} from './OperateDto'
import { parseSearchResults } from './parseSearchResults'

const OPERATE_API_VERSION = 'v1'

type JSONDoc = { [key: string]: string | boolean | number | JSONDoc }
type EnhanceWithTenantIdIfMissing<T> = T extends {
	filter: { tenantId: string | undefined }
}
	? T // If T's filter already has tenantId, V is T unchanged
	: T extends { filter: infer F }
		? { filter: F & { tenantId: string | undefined } } & Omit<T, 'filter'> // If T has a filter without tenantId, add tenantId to it
		: { filter: { tenantId: string | undefined } } & T // If T has no filter property, add filter with tenantId

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
	private oAuthProvider: IOAuthProvider
	private rest: typeof got
	private tenantId: string | undefined

	/**
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * ```
	 */
	constructor(options?: ClientConstructor) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)
		this.userAgentString = `operate-client-nodejs/${packageVersion}`
		const baseUrl = RequireConfiguration(
			config.CAMUNDA_OPERATE_BASE_URL,
			'CAMUNDA_OPERATE_BASE_URL'
		)

		const certificateAuthority = GetCertificateAuthority(config)

		const prefixUrl = `${baseUrl}/${OPERATE_API_VERSION}`

		this.rest = got.extend({
			prefixUrl,
			https: {
				certificateAuthority,
			},
		})
		this.tenantId = config.CAMUNDA_TENANT_ID
	}

	private async getHeaders() {
		const token = await this.oAuthProvider.getToken('OPERATE')

		return {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	protected addTenantIdToFilter<T>(
		query: Query<T>,
		tenantId: string | undefined = this.tenantId // Example default value
	): Query<EnhanceWithTenantIdIfMissing<T>> {
		const hasTenantIdInFilter = query.filter && 'tenantId' in query.filter

		// If `filter` already has `tenantId`, return the original query as is.
		if (hasTenantIdInFilter) {
			return query as Query<EnhanceWithTenantIdIfMissing<T>>
		}

		// Otherwise, add or ensure `tenantId` in `filter`.
		return {
			...query,
			filter: {
				...query.filter,
				tenantId,
			},
		} as unknown as Query<EnhanceWithTenantIdIfMissing<T>>
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
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('process-definitions/search', {
				json,
				headers,
				parseJson: (text) => parseSearchResults(text, ProcessDefinition),
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
		return this.rest(`process-definitions/${processDefinitionKey}`, {
			headers,
		}).json()
	}

	public async getProcessDefinitionXML(
		processDefinitionKey: number | string
	): Promise<string> {
		const headers = await this.getHeaders()
		return this.rest(`process-definitions/${processDefinitionKey}/xml`, {
			headers,
		}).text()
	}

	public async searchDecisionDefinitions(
		query: Query<DecisionDefinition>
	): Promise<SearchResults<DecisionDefinition>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		return this.rest('decision-definitions/search', {
			headers,
			parseJson: (text) => parseSearchResults(text, DecisionDefinition),
			json,
		}).json()
	}

	public async getDecisionDefinition(
		decisionDefinitionKey: number | string
	): Promise<DecisionDefinition> {
		const headers = await this.getHeaders()
		return this.rest(`decision-definitions/${decisionDefinitionKey}`, {
			headers,
			parseJson: (text) => parseWithAnnotations(text, DecisionDefinition),
		}).json()
	}

	public async searchDecisionInstances(
		query: Query<DecisionInstance>
	): Promise<SearchResults<DecisionInstance>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		return this.rest('decision-instances/search', {
			headers,
			parseJson: (text) => parseSearchResults(text, DecisionInstance),
			json,
		}).json()
	}

	public async getDecisionInstance(
		decisionInstanceKey: number | string
	): Promise<DecisionInstance> {
		const headers = await this.getHeaders()
		return this.rest(`decision-instances/${decisionInstanceKey}`, {
			headers,
			parseJson: (text) => parseWithAnnotations(text, DecisionInstance),
		}).json()
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

		const json = this.addTenantIdToFilter(query)
		try {
			return this.rest
				.post('process-instances/search', {
					json,
					headers,
					parseJson: (text) => parseSearchResults(text, ProcessInstance),
				})
				.json()
		} catch (e) {
			throw new Error((e as Error).message)
		}
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
		return this.rest(`process-instances/${processInstanceKey}`, {
			headers,
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
		try {
			const res = this.rest.delete(`process-instances/${processInstanceKey}`, {
				headers,
				throwHttpErrors: false,
			})
			res.catch((e) => console.log(e))
			return res.json()
		} catch (e) {
			throw new Error((e as Error).message)
		}
	}

	/**
	 * @description Get the statistics for a process instance, grouped by flow nodes
	 */
	public async getProcessInstanceStatistics(
		processInstanceKey: number | string
	): Promise<ProcessInstanceStatistics[]> {
		const headers = await this.getHeaders()
		return this.rest(`process-instances/${processInstanceKey}/statistics`, {
			headers,
			parseJson: (text) =>
				parseArrayWithAnnotations(text, ProcessInstanceStatistics),
		}).json()
	}

	/**
	 * @description Get sequence flows of process instance by key
	 */
	public async getProcessInstanceSequenceFlows(
		processInstanceKey: number | string
	): Promise<string[]> {
		const headers = await this.getHeaders()
		return this.rest(`process-instances/${processInstanceKey}/sequence-flows`, {
			headers,
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
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('incidents/search', {
				json,
				headers,
				parseJson: (text) => parseSearchResults(text, Incident),
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
		return this.rest(`incidents/${key}`, {
			headers,
			parseJson: (text) => parseWithAnnotations(text, Incident),
		}).json()
	}

	public async searchFlownodeInstances(
		query: Query<FlownodeInstance>
	): Promise<SearchResults<FlownodeInstance>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('flownode-instances/search', {
				headers,
				json,
				parseJson: (text) => parseSearchResults(text, FlownodeInstance),
			})
			.json()
	}

	public async getFlownodeInstance(
		key: number | string
	): Promise<FlownodeInstance> {
		const headers = await this.getHeaders()
		return this.rest(`flownode-instances/${key}`, {
			headers,
			parseJson: (text) => parseWithAnnotations(text, FlownodeInstance),
		}).json()
	}

	public async searchVariables(
		query: Query<Variable>
	): Promise<SearchResults<Variable>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('variables/search', {
				headers,
				json,
				parseJson: (text) => parseSearchResults(text, Variable),
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
		return this.rest
			.post('variables/search', {
				headers,
				body: JSON.stringify(body),
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
		const vars: { items: Variable[] } = await this.rest
			.post('variables/search', {
				headers,
				body: JSON.stringify(body),
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
		return this.rest(`variables/${variableKey}`, {
			headers,
		}).json()
	}

	public async searchDecisionRequirements(query: Query<DecisionRequirements>) {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('drd/search', {
				headers,
				json,
				parseJson: (text) => parseSearchResults(text, DecisionRequirements),
			})
			.json()
	}

	public async getDecisionRequirements(
		key: string | number
	): Promise<DecisionRequirements> {
		const headers = await this.getHeaders()
		return this.rest(`drd/${key}`, {
			headers,
			parseJson: (text) => parseWithAnnotations(text, DecisionRequirements),
		}).json()
	}

	public async getDecisionRequirementsXML(key: string | number) {
		const headers = await this.getHeaders()
		return this.rest(`drd/${key}/xml`, {
			headers,
		}).text()
	}
}
