import { debug } from 'debug'
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
	makeBeforeRetryHandlerFor401TokenRetry,
} from '../../lib'
import { IHeadersProvider } from '../../oauth'
import { TopologyResponse } from '../types'

const trace = debug('camunda:zeebe')

const ZEEBE_REST_API_VERSION = 'v1'

/**
 * JSON object with changed task attribute values.
 */
interface TaskChangeSet {
	/* The due date of the task. Reset by providing an empty String. */
	dueDate?: Date | string
	/* The follow-up date of the task. Reset by providing an empty String. */
	followUpDate?: Date | string
	/* The list of candidate users of the task. Reset by providing an empty list. */
	candidateUsers?: string[]
	/* The list of candidate groups of the task. Reset by providing an empty list. */
	candidateGroups?: string[]
}

/**
 * @deprecated Since 8.6. Please use `CamundaRestClient` instead.
 */
export class ZeebeRestClient {
	private userAgentString: string
	private oAuthProvider: IHeadersProvider
	private rest: Promise<typeof got>
	// private tenantId: string | undefined

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IHeadersProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		trace('options.config', options?.config)
		trace('config', config)
		this.oAuthProvider =
			options?.oAuthProvider ??
			constructOAuthProvider(config, {
				explicitFromConstructor: Object.prototype.hasOwnProperty.call(
					options?.config ?? {},
					'CAMUNDA_AUTH_STRATEGY'
				),
			})
		this.userAgentString = createUserAgentString(config)
		const baseUrl = RequireConfiguration(
			config.ZEEBE_REST_ADDRESS,
			'ZEEBE_REST_ADDRESS'
		)

		const prefixUrl = `${baseUrl}/${ZEEBE_REST_API_VERSION}`

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
						beforeRetry: [
							makeBeforeRetryHandlerFor401TokenRetry(
								this.getHeaders.bind(this)
							),
						],
						beforeError: [gotBeforeErrorHook(config)],
					},
				})
		)

		// this.tenantId = config.CAMUNDA_TENANT_ID
	}

	private async getHeaders() {
		const authorization = await this.oAuthProvider.getHeaders('ZEEBE')

		const headers = {
			'content-type': 'application/json',
			...authorization,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
		trace('headers', headers)
		return headers
	}

	/* Get the topology of the Zeebe cluster. */
	public async getTopology(): Promise<TopologyResponse> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.get('topology', { headers })
				.json()
				.catch((error) => {
					trace('error', error)
					throw error
				})
		) as Promise<TopologyResponse>
	}

	/* Completes a user task with the given key. The method either completes the task or throws 400, 404, or 409.
	Documentation: https://docs.camunda.io/docs/apis-tools/zeebe-api-rest/specifications/complete-a-user-task/ */
	public async completeUserTask({
		userTaskKey,
		variables = {},
		action = 'complete',
	}: {
		userTaskKey: string
		variables?: Record<string, unknown>
		action?: string
	}) {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest.post(`user-tasks/${userTaskKey}/completion`, {
				body: JSON.stringify({
					variables,
					action,
				}),
				headers,
			})
		)
	}

	/* Assigns a user task with the given key to the given assignee. */
	public async assignTask({
		userTaskKey,
		assignee,
		allowOverride = true,
		action = 'assign',
	}: {
		userTaskKey: string
		assignee: string
		allowOverride?: boolean
		action: string
	}) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`user-tasks/${userTaskKey}/assignment`, {
				body: JSON.stringify({
					allowOverride,
					action,
					assignee,
				}),
				headers,
			})
		)
	}

	/** Update a user task with the given key. */
	public async updateTask({
		userTaskKey,
		changeset,
	}: {
		userTaskKey: string
		changeset: TaskChangeSet
	}) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`user-tasks/${userTaskKey}/update`, {
				body: JSON.stringify(changeset),
				headers,
			})
		)
	}
	/* Removes the assignee of a task with the given key. */
	public async removeAssignee({ userTaskKey }: { userTaskKey: string }) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.delete(`user-tasks/${userTaskKey}/assignee`, { headers })
		)
	}
}
