import {losslessParse, losslessStringify} from '@camunda8/lossless-json'
import {type OAuthInterfaces} from '@camunda8/oauth'
import {debug} from 'debug'
import ky from 'ky'
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
	type Query,
	type SearchResults,
	Variable,
} from '../../dto/operate-dto.js'
import {
	constructOauthProvider,
	createUserAgentString,
	isoSdkEnvironmentConfigurator,
	requireConfiguration,
	beforeErrorHook,
} from '../../lib/index.js'
import {getLogger, type ILogger} from '../../lib/c8-logger.js'
import {parseSearchResults} from './parseSearchResults.js'
import {type OperateClientOptions} from './testable-operate-api-client.js'

const trace = debug('camunda:operate')

const operateApiVersion = 'v1'

type JsonDocument = {[key: string]: string | boolean | number | JsonDocument}
type EnhanceWithTenantIdIfMissing<T> = T extends {
	filter: {tenantId: string | undefined};
}
	? T // If T's filter already has tenantId, V is T unchanged
	: T extends {filter: infer F}
		? {filter: F & {tenantId: string | undefined}} & Omit<T, 'filter'> // If T has a filter without tenantId, add tenantId to it
		: {filter: {tenantId: string | undefined}} & T // If T has no filter property, add filter with tenantId

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
	public log: ILogger
	private readonly userAgentString: string
	private readonly oAuthProvider: OAuthInterfaces.IOAuthProvider
	private readonly rest: typeof ky
	private readonly tenantId: string | undefined

	/**
	 * @example
	 * ```
	 * const operate = new OperateApiClient()
	 * ```
	 * @throws {RESTError} An error that may occur during API operations.
	 */
	constructor({config, oAuthProvider, rest = ky}: OperateClientOptions = {}) {
		const configuration
			= isoSdkEnvironmentConfigurator.mergeConfigWithEnvironment(config)
		this.log = getLogger(configuration)
		trace('options.config', config)
		trace('config', configuration)
		this.oAuthProvider
			= oAuthProvider
			?? constructOauthProvider({config: configuration, rest})
		this.userAgentString = createUserAgentString(configuration)
		const baseUrl = requireConfiguration(
			configuration.CAMUNDA_OPERATE_BASE_URL,
			'CAMUNDA_OPERATE_BASE_URL',
		)

		const prefixUrl = `${baseUrl}/${operateApiVersion}`

		this.rest = rest.extend({
			prefixUrl,
			/* Must now be handled via the sdk and injecting ky-universal */
			// https: {
			// 	certificateAuthority: config.CAMUNDA_CUSTOM_CERT_STRING,
			// },
			// handlers: [gotErrorHandler],
			hooks: {
				beforeError: [beforeErrorHook],
				beforeRequest: [
					/** Add authorization header */
					async request => {
						const newHeaders = await this.getHeaders()
						for (const [key, value] of Object.entries(newHeaders)) {
							request.headers.set(key, value)
						}
					},
					/** Log for debugging */
					options => {
						const {body, method} = options
						const path = options.url
						trace(`${method} ${path}`)
						trace(body)
						this.log.debug(`${method} ${path}`)
						this.log.trace(JSON.stringify(options))
						this.log.trace(JSON.stringify(body, null, 2))
					},
					/** Add user-supplied middleware at the end, where they can override auth headers */
					...(configuration.middleware ?? []),
				],
			},
		})

		this.tenantId = configuration.CAMUNDA_TENANT_ID
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
		query: Query<ProcessDefinition> = {},
	): Promise<SearchResults<ProcessDefinition>> {
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('process-definitions/search', {
				json,
				parseJson: text => parseSearchResults(text, ProcessDefinition),
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
		processDefinitionKey: number | string,
	): Promise<ProcessDefinition> {
		return this.rest(`process-definitions/${processDefinitionKey}`, {
			parseJson: text => losslessParse(text, ProcessDefinition),
		}).json()
	}

	public async getProcessDefinitionXml(
		processDefinitionKey: number | string,
	): Promise<string> {
		return this.rest(`process-definitions/${processDefinitionKey}/xml`).text()
	}

	/**
	 *
	 * @throws {RESTError}
	 */
	public async searchDecisionDefinitions(
		query: Query<DecisionDefinition>,
	): Promise<SearchResults<DecisionDefinition>> {
		const json = this.addTenantIdToFilter(query)

		return this.rest
			.post('decision-definitions/search', {
				parseJson: text => parseSearchResults(text, DecisionDefinition),
				json,
			})
			.json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getDecisionDefinition(
		decisionDefinitionKey: number | string,
	): Promise<DecisionDefinition> {
		return this.rest(`decision-definitions/${decisionDefinitionKey}`, {
			parseJson: text => losslessParse(text, DecisionDefinition),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchDecisionInstances(
		query: Query<DecisionInstance>,
	): Promise<SearchResults<DecisionInstance>> {
		const json = this.addTenantIdToFilter(query)

		return this.rest
			.post('decision-instances/search', {
				parseJson: text => parseSearchResults(text, DecisionInstance),
				json,
			})
			.json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getDecisionInstance(
		decisionInstanceKey: number | string,
	): Promise<DecisionInstance> {
		return this.rest(`decision-instances/${decisionInstanceKey}`, {
			parseJson: text => losslessParse(text, DecisionInstance),
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
		query: Query<ProcessInstance> = {},
	): Promise<SearchResults<ProcessInstance>> {
		const json = this.addTenantIdToFilter(query)
		try {
			return await this.rest
				.post('process-instances/search', {
					json,
					parseJson: text => parseSearchResults(text, ProcessInstance),
				})
				.json()
		} catch (error) {
			throw new Error((error as Error).message)
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
		processInstanceKey: number | string,
	): Promise<ProcessInstance> {
		return this.rest(`process-instances/${processInstanceKey}`, {
			parseJson: text => losslessParse(text, ProcessInstance),
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
		processInstanceKey: number | string,
	): Promise<ChangeStatus> {
		return this.rest.delete(`process-instances/${processInstanceKey}`, {
			throwHttpErrors: false,
			parseJson: text => losslessParse(text, ChangeStatus),
		}).json()
	}

	/**
	 * @description Get the statistics for a process instance, grouped by flow nodes
	 * @throws {RESTError}
	 */
	public async getProcessInstanceStatistics(
		processInstanceKey: number | string,
	): Promise<ProcessInstanceStatistics[]> {
		return this.rest(`process-instances/${processInstanceKey}/statistics`, {
			parseJson: text => losslessParse(text, ProcessInstanceStatistics),
		}).json()
	}

	/**
	 * @description Get sequence flows of process instance by key
	 * @throws {RESTError}
	 */
	public async getProcessInstanceSequenceFlows(
		processInstanceKey: number | string,
	): Promise<string[]> {
		return this.rest(
			`process-instances/${processInstanceKey}/sequence-flows`,
		).json()
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
		query: Query<Incident> = {},
	): Promise<SearchResults<Incident>> {
		const json = this.addTenantIdToFilter(query)

		return this.rest
			.post('incidents/search', {
				json,
				parseJson: text => parseSearchResults(text, Incident),
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
		return this.rest(`incidents/${key}`, {
			parseJson: text => losslessParse(text, Incident),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchFlownodeInstances(
		query: Query<FlownodeInstance>,
	): Promise<SearchResults<FlownodeInstance>> {
		const json = this.addTenantIdToFilter(query)
		return this.rest
			.post('flownode-instances/search', {
				json,
				parseJson: text => parseSearchResults(text, FlownodeInstance),
			})
			.json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getFlownodeInstance(
		key: number | string,
	): Promise<FlownodeInstance> {
		return this.rest(`flownode-instances/${key}`, {
			parseJson: text => losslessParse(text, FlownodeInstance),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchVariables(
		query: Query<Variable>,
	): Promise<SearchResults<Variable>> {
		const json = this.addTenantIdToFilter(query)

		return this.rest
			.post('variables/search', {
				json,
				parseJson: text => parseSearchResults(text, Variable),
			})
			.json()
	}

	/**
	 * @description Retrieve the variables for a Process Instance, given its key
	 * @throws {RESTError}
	 * @param processInstanceKey
	 * @returns
	 */
	public async getVariablesforProcess(
		processInstanceKey: number | string,
	): Promise<{items: Variable[]}> {
		const body = {
			filter: {
				processInstanceKey,
			},
		}

		return this.rest
			.post('variables/search', {
				body: losslessStringify(body),
			})
			.json()
	}

	/**
	 * @description Retrieve the variables for a Process Instance as an object, given its key
	 * @param processInstanceKey
	 * @throws {RESTError}
	 */
	public async getJsonVariablesforProcess<T extends Record<string, JsonDocument>>(
		processInstanceKey: number | string,
	): Promise<T> {
		const body = {
			filter: {
				processInstanceKey,
			},
			size: 1000,
		}

		const variables: {items: Variable[]} = await this.rest
			.post('variables/search', {
				body: losslessStringify(body),
			})
			.json()

		const entries = variables.items.map<[string, JsonDocument]>(
			current => [current.name, this.safeJsonParse<JsonDocument>(current.value)],
		)

		return (Object.fromEntries(entries) as unknown) as T
	}

	/**
	 *
	 * @description Return a variable identified by its variable key
	 * @throws {RESTError}
	 * @returns
	 */
	public async getVariables(variableKey: number | string): Promise<Variable> {
		return this.rest(`variables/${variableKey}`, {
			parseJson: text => losslessParse(text, Variable),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async searchDecisionRequirements(query: Query<DecisionRequirements>) {
		const json = this.addTenantIdToFilter(query)

		return this.rest
			.post('drd/search', {
				json,
				parseJson: text => parseSearchResults(text, DecisionRequirements),
			})
			.json()
	}

	public async getDecisionRequirements(
		key: string | number,
	): Promise<DecisionRequirements> {
		return this.rest(`drd/${key}`, {
			parseJson: text => losslessParse(text, DecisionRequirements),
		}).json()
	}

	/**
	 * @throws {RESTError}
	 */
	public async getDecisionRequirementsXml(key: string | number) {
		return this.rest(`drd/${key}/xml`).text()
	}

	protected addTenantIdToFilter<T>(
		query: Query<T>,
		tenantId: string | undefined = this.tenantId, // Example default value
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

	private async getHeaders() {
		const token = await this.oAuthProvider.getToken('OPERATE')

		return {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
	}

	private safeJsonParse<T>(thing: string): T {
		try {
			return JSON.parse(thing) as T
		} catch (error) {
			console.log(error)
			console.log(thing)
			return thing as T
		}
	}
}
