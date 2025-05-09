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
	DateFilter,
	Form,
	TaskResponse,
	TaskSearchAfterOrEqualRequest,
	TaskSearchAfterRequest,
	TaskSearchBeforeOrEqualRequest,
	TaskSearchBeforeRequest,
	TaskSearchRequestBase,
	TaskSearchResponse,
	Variable,
	VariableSearchResponse,
} from './TasklistDto'
import { JSONDoc, encodeTaskVariablesForAPIRequest } from './utils'

const trace = debug('camunda:tasklist')

const TASKLIST_API_VERSION = 'v1'

/**
 * The high-level client for the Tasklist REST API
 * @example
 * ```
 *
 * ```
 */
export class TasklistApiClient {
	private userAgentString: string
	private oAuthProvider: IOAuthProvider
	private rest: Promise<typeof got>

	/**
	 * @example
	 * ```
	 * const tasklist = new TasklistApiClient()
	 * const tasks = await tasklist.getTasks({ state: TaskState.CREATED })
	 * ```
	 *
	 */
	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IOAuthProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)
		this.userAgentString = createUserAgentString(config)
		const baseUrl = RequireConfiguration(
			config.CAMUNDA_TASKLIST_BASE_URL,
			'CAMUNDA_TASKLIST_BASE_URL'
		)
		const prefixUrl = `${baseUrl}/${TASKLIST_API_VERSION}`

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
		trace(`prefixUrl: ${prefixUrl}`)
	}

	private async getHeaders() {
		const authorization = await this.oAuthProvider.getToken('TASKLIST')
		return {
			'content-type': 'application/json',
			...authorization,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
	}

	private replaceDatesWithString<
		T extends { followUpDate?: DateFilter; dueDate?: DateFilter },
	>(query: T) {
		if (query.followUpDate) {
			if (typeof query.followUpDate.from === 'object') {
				query.followUpDate.from = query.followUpDate.from.toISOString()
			}
			if (typeof query.followUpDate.to === 'object') {
				query.followUpDate.to = query.followUpDate.to.toISOString()
			}
		}
		if (query.dueDate) {
			if (typeof query.dueDate.from === 'object') {
				query.dueDate.from = query.dueDate.from.toISOString()
			}
			if (typeof query.dueDate.to === 'object') {
				query.dueDate.to = query.dueDate.to.toISOString()
			}
		}
		return query
	}

	/**
	 * Query Tasklist for a list of tasks. See the [API documentation](https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/tasks/).
	 * @throws Status 400 - An error is returned when more than one search parameters among [`searchAfter`, `searchAfterOrEqual`, `searchBefore`, `searchBeforeOrEqual`] are present in request
	 * @throws {RESTError}
	 * @example
	 * ```
	 * const tasklist = new TasklistApiClient()
	 *
	 * async function getTasks() {
	 *   const res = await tasklist.searchTasks({
	 *     state: TaskState.CREATED
	 *   })
	 *   console.log(res ? 'Nothing' : JSON.stringify(res, null, 2))
	 *   return res
	 * }
	 * ```
	 * @param query
	 */
	public async searchTasks(
		query:
			| TaskSearchAfterRequest
			| TaskSearchAfterOrEqualRequest
			| TaskSearchBeforeRequest
			| TaskSearchBeforeOrEqualRequest
			| Partial<TaskSearchRequestBase>
	): Promise<TaskSearchResponse[]> {
		const headers = await this.getHeaders()
		const url = 'tasks/search'

		trace(`Requesting ${url}`)
		const rest = await this.rest
		return rest
			.post(url, {
				json: this.replaceDatesWithString(query),
				headers,
				parseJson: (text) => losslessParse(text, TaskSearchResponse),
			})
			.json()
	}

	/**
	 * Return a task by id, or throw if not found.
	 * @throws {RESTError} Will throw if no task of the given taskId exists
	 * @returns
	 */
	public async getTask(taskId: string): Promise<TaskResponse> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.get(`tasks/${taskId}`, {
				headers,
			})
			.json()
	}

	/**
	 * Get the form details by form id and processDefinitionKey.
	 * @throws {RESTError}
	 */
	public async getForm(
		formId: string,
		processDefinitionKey: string,
		version?: string | number
	): Promise<Form> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.get(`forms/${formId}`, {
				searchParams: {
					processDefinitionKey,
					version,
				},
				parseJson: (text) => losslessParse(text, Form),
				headers,
			})
			.json()
	}

	/**
	 * This method returns a list of task variables for the specified taskId and variableNames. If the variableNames parameter is empty, all variables associated with the task will be returned.
	 * @throws {RESTError}
	 */
	public async getVariables({
		taskId,
		variableNames,
		includeVariables,
	}: {
		taskId: string
		variableNames?: string[]
		includeVariables?: { name: string; alwaysReturnFullValue: boolean }[]
	}): Promise<VariableSearchResponse[]> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`tasks/${taskId}/variables/search`, {
				body: losslessStringify({
					variableNames: variableNames || [],
					includeVariables: includeVariables || [],
				}),
				headers,
			})
			.json()
	}

	/**
	 * https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/variable/
	 * @throws Throws 404 if no variable of the id is found
	 */
	public async getVariable(variableId: string): Promise<Variable> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.get(`variables/${variableId}`, {
				headers,
			})
			.json()
	}

	/**
	 * Assign a task with taskId to assignee or the active user.
	 * @throws {RESTError}
	 * @throws Status 400 - An error is returned when the task is not active (not in the CREATED state).
	 * Status 400 - An error is returned when task was already assigned, except the case when JWT authentication token used and allowOverrideAssignment = true.
	 * Status 403 - An error is returned when user doesn't have the permission to assign another user to this task.
	 * Status 404 - An error is returned when the task with the taskId is not found.
	 */
	public async assignTask({
		taskId,
		allowOverrideAssignment = false,
		assignee,
	}: {
		taskId: string
		assignee?: string
		allowOverrideAssignment?: boolean
	}): Promise<TaskResponse> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.patch(`tasks/${taskId}/assign`, {
				body: losslessStringify({
					assignee,
					allowOverrideAssignment,
				}),
				headers,
				parseJson: (text) => losslessParse(text, TaskResponse),
			})
			.json()
	}

	/**
	 * Complete a task with taskId and optional variables
	 * @throws {RESTError}
	 * @throws Status 400 An error is returned when the task is not active (not in the CREATED state).
	 * @throws Status 400 An error is returned if the task was not claimed (assigned) before.
	 * @throws Status 400 An error is returned if the task is not assigned to the current user.
	 * @throws Status 403 User has no permission to access the task (Self-managed only).
	 * @throws Status 404 An error is returned when the task with the taskId is not found.
	 */
	public async completeTask(
		taskId: string,
		variables?: JSONDoc
	): Promise<TaskResponse> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.patch(`tasks/${taskId}/complete`, {
				headers,
				body: losslessStringify({
					variables: encodeTaskVariablesForAPIRequest(variables || {}),
				}),
				parseJson: (text) => losslessParse(text, TaskResponse),
			})
			.json()
	}

	/**
	 * Unassign a task with taskId
	 * @throws Status 400 An error is returned when the task is not active (not in the CREATED state).
	 * @throws Status 400 An error is returned if the task was not claimed (assigned) before.
	 * @throws Status 404 An error is returned when the task with the taskId is not found.
	 * @throws {RESTError}
	 */
	public async unassignTask(taskId: string): Promise<TaskResponse> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.patch(`tasks/${taskId}/unassign`, {
				headers,
				parseJson: (text) => losslessParse(text, TaskResponse),
			})
			.json()
	}
}
