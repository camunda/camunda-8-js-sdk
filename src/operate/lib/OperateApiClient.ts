import { debug } from 'debug'
import got from 'got'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCustomCertificateBuffer,
	GotRetryConfig,
	RequireConfiguration,
	constructOAuthProvider,
	createUserAgentString,
	gotBeforeErrorHook,
	gotErrorHandler,
	losslessParse,
	losslessStringify,
	makeBeforeRetryHandlerFor401TokenRetry,
} from '../../lib'
import { IOAuthProvider } from '../../oauth'

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

const trace = debug('camunda:operate')

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
	private rest: Promise<typeof got>
	private tenantId: string | undefined

	/**
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * ```
	 * @throws {RESTError} An error that may occur during API operations.
	 */
	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IOAuthProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		trace('options.config', options?.config)
		trace('config', config)
		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)
		this.userAgentString = createUserAgentString(config)
		const baseUrl = RequireConfiguration(
			config.CAMUNDA_OPERATE_BASE_URL,
			'CAMUNDA_OPERATE_BASE_URL'
		)

		const prefixUrl = `${baseUrl}/${OPERATE_API_VERSION}`

		this.rest = GetCustomCertificateBuffer(config).then(
			(certificateAuthority) =>
				got.extend({
					prefixUrl,
					retry: GotRetryConfig,
					https: {
						certificateAuthority,
					},
					handlers: [gotErrorHandler],
					hooks: {
						beforeRetry: [
							makeBeforeRetryHandlerFor401TokenRetry(
								this.getHeaders.bind(this)
							),
						],
						beforeError: [gotBeforeErrorHook],
						beforeRequest: config.middleware ?? [],
					},
				})
		)

		this.tenantId = config.CAMUNDA_TENANT_ID
	}

	private async getHeaders() {
		const authorization = await this.oAuthProvider.getToken('OPERATE')

		return {
			'content-type': 'application/json',
			...authorization,
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
	 * @throws {RESTError}
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
		const rest = await this.rest
		return rest
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
	 * @throws {RESTError}
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
		const rest = await this.rest
		return rest(`process-definitions/${processDefinitionKey}`, {
			headers,
			parseJson: (text) => losslessParse(text, ProcessDefinition),
		}).json()
	}

	public async getProcessDefinitionXML(
		processDefinitionKey: number | string
	): Promise<string> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`process-definitions/${processDefinitionKey}/xml`, {
			headers,
		}).text()
	}

	/**
	 *
	 * @throws {RESTError}
	 */
	public async searchDecisionDefinitions(
		query: Query<DecisionDefinition>
	): Promise<SearchResults<DecisionDefinition>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		const rest = await this.rest

		return rest
			.post('decision-definitions/search', {
				headers,
				parseJson: (text) => parseSearchResults(text, DecisionDefinition),
				json,
			})
			.json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getDecisionDefinition(
		decisionDefinitionKey: number | string
	): Promise<DecisionDefinition> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`decision-definitions/${decisionDefinitionKey}`, {
			headers,
			parseJson: (text) => losslessParse(text, DecisionDefinition),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchDecisionInstances(
		query: Query<DecisionInstance>
	): Promise<SearchResults<DecisionInstance>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		const rest = await this.rest

		return rest
			.post('decision-instances/search', {
				headers,
				parseJson: (text) => parseSearchResults(text, DecisionInstance),
				json,
			})
			.json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getDecisionInstance(
		decisionInstanceKey: number | string
	): Promise<DecisionInstance> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`decision-instances/${decisionInstanceKey}`, {
			headers,
			parseJson: (text) => losslessParse(text, DecisionInstance),
		}).json()
	}
	/**
	 * @description Search and retrieve process instances.
	 * @throws {RESTError}
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
		const rest = await this.rest

		try {
			return rest
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
	 * @throws {RESTError}
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
		const rest = await this.rest

		return rest(`process-instances/${processInstanceKey}`, {
			headers,
			parseJson: (text) => losslessParse(text, ProcessInstance),
		}).json()
	}

	/**
	 * @description Delete a specific process instance by key.
	 * @throws {RESTError}
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
		const rest = await this.rest

		try {
			const res = rest.delete(`process-instances/${processInstanceKey}`, {
				headers,
				throwHttpErrors: false,
				parseJson: (text) => losslessParse(text, ChangeStatus),
			})
			res.catch((e) => console.log(e))
			return res.json()
		} catch (e) {
			throw new Error((e as Error).message)
		}
	}

	/**
	 * @description Get the statistics for a process instance, grouped by flow nodes
	 * @throws {RESTError}
	 */
	public async getProcessInstanceStatistics(
		processInstanceKey: number | string
	): Promise<ProcessInstanceStatistics[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`process-instances/${processInstanceKey}/statistics`, {
			headers,
			parseJson: (text) => losslessParse(text, ProcessInstanceStatistics),
		}).json()
	}

	/**
	 * @description Get sequence flows of process instance by key
	 * @throws {RESTError}
	 */
	public async getProcessInstanceSequenceFlows(
		processInstanceKey: number | string
	): Promise<string[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`process-instances/${processInstanceKey}/sequence-flows`, {
			headers,
		}).json()
	}

	/**
	 *
	 * @description Search and retrieve incidents.
	 * @throws {RESTError}
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
		const rest = await this.rest

		return rest
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
	 * @throws {RESTError}
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * const incident = await operate.getIncident(2251799818436725)
	 * console.log(incident.message)
	 * ```
	 */
	public async getIncident(key: number | string): Promise<Incident> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`incidents/${key}`, {
			headers,
			parseJson: (text) => losslessParse(text, Incident),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchFlownodeInstances(
		query: Query<FlownodeInstance>
	): Promise<SearchResults<FlownodeInstance>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		const rest = await this.rest

		return rest
			.post('flownode-instances/search', {
				headers,
				json,
				parseJson: (text) => parseSearchResults(text, FlownodeInstance),
			})
			.json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getFlownodeInstance(
		key: number | string
	): Promise<FlownodeInstance> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`flownode-instances/${key}`, {
			headers,
			parseJson: (text) => losslessParse(text, FlownodeInstance),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchVariables(
		query: Query<Variable>
	): Promise<SearchResults<Variable>> {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		const rest = await this.rest

		return rest
			.post('variables/search', {
				headers,
				json,
				parseJson: (text) => parseSearchResults(text, Variable),
			})
			.json()
	}

	/**
	 * @description Retrieve the variables for a Process Instance, given its key. Documentation: https://docs.camunda.io/docs/apis-tools/operate-api/specifications/search/
	 * @throws {RESTError}
	 * @param processInstanceKey
	 * @returns
	 */
	public async getVariablesforProcess(
		processInstanceKey: number | string,
		options: {
			size?: number
			searchAfter?: unknown[]
			sort?: { field: string; order?: 'ASC' | 'DESC' }[]
		} = {}
	): Promise<{ items: Variable[]; sortValues: unknown[]; total: number }> {
		const headers = await this.getHeaders()
		const body = {
			filter: {
				processInstanceKey,
			},
			size: options.size ?? 1000,
			searchAfter: options.searchAfter,
			sort: options.sort ?? [{ field: 'name' }],
		}
		const rest = await this.rest

		return rest
			.post('variables/search', {
				headers,
				body: losslessStringify(body),
			})
			.json()
	}

	/**
	 * @description Retrieve the variables for a Process Instance as an object, given its key
	 * @param processInstanceKey
	 * @throws {RESTError}
	 */
	public async getJSONVariablesforProcess<T extends { [key: string]: JSONDoc }>(
		processInstanceKey: number | string,
		size = 1000
	): Promise<T> {
		const headers = await this.getHeaders()
		const body = {
			filter: {
				processInstanceKey,
			},
			size,
		}
		const rest = await this.rest

		const vars: { items: Variable[] } = await rest
			.post('variables/search', {
				headers,
				body: losslessStringify(body),
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
	 * @throws {RESTError}
	 * @returns
	 */
	public async getVariables(variableKey: number | string): Promise<Variable> {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`variables/${variableKey}`, {
			headers,
			parseJson: (text) => losslessParse(text, Variable),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchDecisionRequirements(query: Query<DecisionRequirements>) {
		const headers = await this.getHeaders()
		const json = this.addTenantIdToFilter(query)
		const rest = await this.rest

		return rest
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
		const rest = await this.rest

		return rest(`drd/${key}`, {
			headers,
			parseJson: (text) => losslessParse(text, DecisionRequirements),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getDecisionRequirementsXML(key: string | number) {
		const headers = await this.getHeaders()
		const rest = await this.rest

		return rest(`drd/${key}/xml`, {
			headers,
		}).text()
	}
}
