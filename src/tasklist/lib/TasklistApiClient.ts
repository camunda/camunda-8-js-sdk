import fs from 'fs'

import { debug } from 'debug'
import got from 'got'
import {
	CamundaEnvironmentConfigurator,
	ClientConstructor,
	constructOAuthProvider,
	packageVersion,
} from 'lib'

import { IOAuthProvider } from '../../oauth'

import { Form, Task, TaskQuery, Variable } from './Types'
import { JSONDoc, encodeTaskVariablesForAPIRequest } from './utils'

const trace = debug('tasklist:rest')

const TASKLIST_API_VERSION = 'v1'

/**
 * @description The high-level client for the Tasklist REST API
 * @example
 * ```
 *
 * ```
 */
export class TasklistApiClient {
	private userAgentString: string
	private oAuthProvider: IOAuthProvider
	private rest: typeof got

	/**
	 * @example
	 * ```
	 *
	 * ```
	 * @description
	 *
	 */
	constructor(options?: ClientConstructor) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)
		this.userAgentString = `tasklist-rest-client-nodejs/${packageVersion}`
		const baseUrl = config.CAMUNDA_TASKLIST_BASE_URL
		const prefixUrl = `${baseUrl}/${TASKLIST_API_VERSION}`
		const customRootCertPath = config.CAMUNDA_CUSTOM_ROOT_CERT_PATH
		const certificateAuthority = customRootCertPath
			? fs.readFileSync(customRootCertPath, 'utf-8')
			: undefined
		this.rest = got.extend({
			prefixUrl,
			https: {
				certificateAuthority,
			},
		})
		trace(`prefixUrl: ${prefixUrl}`)
	}

	private async getHeaders() {
		const token = await this.oAuthProvider.getToken('TASKLIST')
		return {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
	}
	/**
	 * @description Query Tasklist for a list of tasks. See the [API documentation](https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/tasks/).
	 * @example
	 * ```
	 * const tasklist = new TasklistApiClient()
	 *
	 * async function getTasks() {
	 *   const res = await tasklist.getTasks({
	 *     state: TaskState.CREATED
	 *   })
	 *   console.log(res ? 'Nothing' : JSON.stringify(res, null, 2))
	 *   return res
	 * }
	 * ```
	 * @param query
	 */
	public async getTasks(query: Partial<TaskQuery>): Promise<Task[]> {
		const headers = await this.getHeaders()
		const url = 'tasks/search'
		trace(`Requesting ${url}`)
		return this.rest
			.post(url, {
				json: query,
				headers,
			})
			.json()
	}

	public async getAllTasks(): Promise<Task[]> {
		return this.getTasks({})
	}

	/**
	 * @description Return a task by id, or throw if not found.
	 * @throws Will throw if no task of the given id exists
	 * @param id
	 * @returns
	 */
	public async getTask(taskId: string): Promise<Task> {
		const headers = await this.getHeaders()
		return this.rest
			.get(`tasks/${taskId}`, {
				headers,
			})
			.json()
	}

	/**
	 * @description Get the form details by form id and processDefinitionKey.
	 * @param formId
	 * @param processDefinitionKey
	 */
	public async getForm(
		formId: string,
		processDefinitionKey: string
	): Promise<Form> {
		const headers = await this.getHeaders()
		return this.rest
			.get(`forms/${formId}`, {
				searchParams: {
					processDefinitionKey,
				},
				headers,
			})
			.json()
	}

	/**
	 * @description Returns a list of variables
	 * @param taskId
	 * @param variableNames
	 * @throws Throws 404 if no task of taskId is found
	 */
	public async getVariables(
		taskId: string,
		variableNames?: string[]
	): Promise<Variable[]> {
		const headers = await this.getHeaders()
		return this.rest
			.post(`tasks/${taskId}/variables/search`, {
				body: JSON.stringify(variableNames || []),
				headers,
			})
			.json()
	}

	/**
	 * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/variable/
	 * @param id
	 * @throws Throws 404 if no variable of the id is found
	 */
	public async getVariable(variableId: string): Promise<Variable> {
		const headers = await this.getHeaders()
		return this.rest
			.get(`variables/${variableId}`, {
				headers,
			})
			.json()
	}

	/**
	 * @description Assign a task with taskId to assignee or the active user.
	 * @param taskId
	 * @param assignee if not provided, assigns to the user whose JWT is used
	 * @param allowOverrideAssignment
	 * @throws 400 - task not active, or already assigned. 403 - no permission to reassign task. 404 - no task for taskId.
	 */
	public async assignTask({
		taskId,
		allowOverrideAssignment = false,
		assignee,
	}: {
		taskId: string
		assignee?: string
		allowOverrideAssignment?: boolean
	}): Promise<Task> {
		const headers = await this.getHeaders()
		return this.rest
			.patch(`tasks/${taskId}/assign`, {
				body: JSON.stringify({
					assignee,
					allowOverrideAssignment,
				}),
				headers,
			})
			.json()
	}

	/**
	 * @description Complete a task with taskId and optional variables
	 * @param taskId
	 * @param variables
	 */
	public async completeTask(
		taskId: string,
		variables?: JSONDoc
	): Promise<Task> {
		const headers = await this.getHeaders()
		return this.rest
			.patch(`tasks/${taskId}/complete`, {
				headers,
				body: JSON.stringify({
					variables: encodeTaskVariablesForAPIRequest(variables || {}),
				}),
			})
			.json()
	}

	/**
	 * @description Unassign a task with taskI
	 * @param taskId
	 */
	public async unassignTask(taskId: string): Promise<Task> {
		const headers = await this.getHeaders()
		return this.rest.patch(`tasks/${taskId}/unassign`, { headers }).json()
	}
}
