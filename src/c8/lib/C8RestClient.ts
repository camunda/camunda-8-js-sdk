import { debug } from 'debug'
import got from 'got'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCustomCertificateBuffer,
	GotRetryConfig,
	LosslessDto,
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
	ActivateJobsRequest,
	CompleteJobRequest,
	ErrorJobWithVariables,
	FailJobRequest,
	PublishMessageRequest,
	PublishMessageResponse,
	TopologyResponse,
} from '../../zeebe/types'

import { Job, JobUpdateChangeset, NewUserInfo, TaskChangeSet } from './C8Dto'

const trace = debug('camunda:zeebe')

const CAMUNDA_REST_API_VERSION = 'v2'

export class C8RestClient {
	private userAgentString: string
	private oAuthProvider: IOAuthProvider
	private rest: Promise<typeof got>
	private tenantId?: string

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
		this.tenantId = config.CAMUNDA_TENANT_ID
		const baseUrl = RequireConfiguration(
			config.ZEEBE_REST_ADDRESS,
			'ZEEBE_REST_ADDRESS'
		)

		const prefixUrl = `${baseUrl}/${CAMUNDA_REST_API_VERSION}`

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
					},
				})
		)

		// this.tenantId = config.CAMUNDA_TENANT_ID
	}

	private async getHeaders() {
		const token = await this.oAuthProvider.getToken('ZEEBE')

		const headers = {
			'content-type': 'application/json',
			authorization: `Bearer ${token}`,
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
				body: losslessStringify({
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
				body: losslessStringify({
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
			rest.patch(`user-tasks/${userTaskKey}/update`, {
				body: losslessStringify(changeset),
				headers,
			})
		)
	}
	/* Removes the assignee of a task with the given key. */
	public async unassignTask({ userTaskKey }: { userTaskKey: string }) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.delete(`user-tasks/${userTaskKey}/assignee`, { headers })
		)
	}

	/**
	 * Create a user
	 */
	public async createUser(newUserInfo: NewUserInfo) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`users`, {
				body: JSON.stringify(newUserInfo),
				headers,
			})
		)
	}

	/**
	 * Search for user tasks based on given criteria.
	 * @experimental
	 */
	public async queryTasks() {}

	/**
	 * Publishes a Message and correlates it to a subscription. If correlation is successful it
	 * will return the first process instance key the message correlated with.
	 **/
	public async correlateMessage(
		message: Pick<
			PublishMessageRequest,
			'name' | 'correlationKey' | 'variables' | 'tenantId'
		>
	): Promise<PublishMessageResponse & { processInstanceKey: string }> {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest
				.post(`messages/correlation`, {
					body: losslessStringify(message),
					headers,
				})
				.json()
		)
	}

	/**
	 * Obtains the status of the current Camunda license
	 */
	public async getLicenseStatus(): Promise<{
		vaildLicense: boolean
		licenseType: string
	}> {
		return this.rest.then((rest) => rest.get(`license`).json())
	}

	/**
	 * Iterate through all known partitions and activate jobs up to the requested maximum.
	 *
	 * The type parameter T specifies the type of the job payload. This can be set to a class that extends LosslessDto to provide
	 * both type information in your code, and safe interoperability with other applications that natively support the int64 type.
	 */
	public async activateJobs<T = LosslessDto>(
		request: ActivateJobsRequest
	): Promise<Job[]> {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest
				.post(`jobs/activation`, {
					body: losslessStringify(this.addDefaultTenantId(request)),
					headers,
					parseJson: (text) => losslessParse(text, Job<T>),
				})
				.json()
		)
	}

	/**
	 * Fails a job using the provided job key. This method sends a POST request to the endpoint '/jobs/{jobKey}/fail' with the failure reason and other details specified in the failJobRequest object.
	 */
	public async failJob(failJobRequest: FailJobRequest) {
		const { jobKey } = failJobRequest
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`jobs/${jobKey}/fail`, {
				body: losslessStringify(failJobRequest),
				headers,
			})
		)
	}

	/**
	 * Reports a business error (i.e. non-technical) that occurs while processing a job.
	 */
	public async errorJob(
		errorJobRequest: ErrorJobWithVariables & { jobKey: string }
	) {
		const { jobKey, ...request } = errorJobRequest
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`jobs/${jobKey}/error`, {
				body: losslessStringify(request),
				headers,
			})
		)
	}

	/**
	 * Complete a job with the given payload, which allows completing the associated service task.
	 */
	public async completeJob(completeJobRequest: CompleteJobRequest) {
		const { jobKey } = completeJobRequest
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`jobs/${jobKey}/complete`, {
				body: losslessStringify({ variables: completeJobRequest.variables }),
				headers,
			})
		)
	}

	/**
	 * Update a job with the given key.
	 */
	public async updateJob(
		jobChangeset: JobUpdateChangeset & { jobKey: string }
	) {
		const { jobKey, ...changeset } = jobChangeset
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.patch(`jobs/${jobKey}`, {
				body: JSON.stringify(changeset),
				headers,
			})
		)
	}

	public async resolveIncident(incidentKey: string) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`incidents/${incidentKey}/resolve`, {
				headers,
			})
		)
	}

	/**
	 * Helper method to add the default tenantIds if we are not passed explicit tenantIds
	 */
	private addDefaultTenantId<T extends { tenantIds?: string[] }>(request: T) {
		const tenantIds = request.tenantIds ?? this.tenantId ? [this.tenantId] : []
		return { ...request, tenantIds }
	}
}
