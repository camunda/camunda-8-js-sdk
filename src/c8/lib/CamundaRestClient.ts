import fs, { ReadStream } from 'node:fs'

import { debug } from 'debug'
import FormData from 'form-data'
import got, { CancelableRequest, Response } from 'got'
import { parse, stringify } from 'lossless-json'
import PCancelable from 'p-cancelable'

import {
	beforeCallHook,
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	constructOAuthProvider,
	createUserAgentString,
	GetCustomCertificateBuffer,
	gotBeforeErrorHook,
	gotBeforeRetryHook,
	GotRetryConfig,
	LosslessDto,
	losslessParse,
	losslessStringify,
	makeBeforeRetryHandlerFor401TokenRetry,
	RequireConfiguration,
} from '../../lib'
import { IHeadersProvider } from '../../oauth'
import {
	ActivateJobsRequest,
	BroadcastSignalReq,
	CompleteJobRequest,
	ErrorJobWithVariables,
	FailJobRequest,
	IProcessVariables,
	JOB_ACTION_ACKNOWLEDGEMENT,
	JobFailureConfiguration,
	JSONDoc,
	PublishMessageRequest,
	TopologyResponse,
} from '../../zeebe/types'

import {
	ApiEndpointRequest,
	AssignUserTaskRequest,
	BroadcastSignalResponse,
	CamundaRestSearchDecisionInstancesRequest,
	CamundaRestSearchDecisionInstancesResponse,
	CamundaRestSearchElementInstancesResponse,
	CamundaRestSearchIncidentsResponse,
	CamundaRestSearchProcessDefinitionsResponse,
	CamundaRestSearchProcessInstanceResponse,
	CamundaRestSearchUserTasksResponse,
	CamundaRestSearchVariablesResponse,
	CamundaRestUserTaskVariablesResponse,
	CorrelateMessageResponse,
	CreateDocumentLinkRequest,
	CreateProcessInstanceReq,
	CreateProcessInstanceResponse,
	Ctor,
	DecisionDeployment,
	DecisionRequirementsDeployment,
	DeployResourceResponse,
	DeployResourceResponseDto,
	DownloadDocumentRequest,
	ElementInstanceDetails,
	EvaluateDecisionRequest,
	EvaluateDecisionResponse,
	FormDeployment,
	GetDecisionInstanceResponse,
	GetProcessDefinitionResponse,
	GetVariableResponse,
	JobUpdateChangeset,
	JobWithMethods,
	JsonApiEndpointRequest,
	MigrationRequest,
	ModifyProcessInstanceRequest,
	NewUserInfo,
	PatchAuthorizationRequest,
	ProcessDeployment,
	PublishMessageResponse,
	RawApiEndpointRequest,
	RestJob,
	SearchElementInstancesRequest,
	SearchIncidentsRequest,
	SearchProcessDefinitionsRequest,
	SearchProcessInstanceRequest,
	SearchTasksRequest,
	SearchUsersRequest,
	SearchUsersResponse,
	SearchVariablesRequest,
	TaskChangeSet,
	UnknownRequestBody,
	UpdateElementVariableRequest,
	UploadDocumentRequest,
	UploadDocumentResponse,
	UploadDocumentsResponse,
	UserTask,
	UserTaskVariablesRequest,
} from './C8Dto'
import { getLogger, Logger } from './C8Logger'
import { CamundaJobWorker, CamundaJobWorkerConfig } from './CamundaJobWorker'
import { createSpecializedRestApiJobClass } from './RestApiJobClassFactory'
import { createSpecializedCreateProcessInstanceResponseClass } from './RestApiProcessInstanceClassFactory'

const trace = debug('camunda:orchestration-rest')

const CAMUNDA_REST_API_VERSION = 'v2'

class DefaultLosslessDto extends LosslessDto {}

/**
 * The client for the unified Camunda 8 Orchestration Cluster REST API.
 *
 * Logging: to enable debug tracing during development, you can set `DEBUG=camunda:orchestration-rest`.
 *
 * For production, you can pass in an logger compatible with {@link Logger} to the constructor as `logger`.
 *
 * `CAMUNDA_LOG_LEVEL` in the environment or the constructor options can be used to set the log level to one of 'error', 'warn', 'info', 'http', 'verbose', 'debug', or 'silly'.
 *
 * @since 8.6.0
 */
export class CamundaRestClient {
	private userAgentString: string
	protected oAuthProvider: IHeadersProvider
	private rest: Promise<typeof got>
	private tenantId?: string
	public log: Logger
	private config: CamundaPlatform8Configuration
	private prefixUrl: string
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private workers: CamundaJobWorker<any, any>[] = []

	/**
	 * All constructor parameters for configuration are optional. If no configuration is provided, the SDK will use environment variables to configure itself.
	 */
	constructor(options?: {
		config?: Camunda8ClientConfiguration
		oAuthProvider?: IHeadersProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.config = config
		this.log = getLogger(config)
		this.log.debug(`Using REST API version ${CAMUNDA_REST_API_VERSION}`)
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

		this.prefixUrl = `${baseUrl}/${CAMUNDA_REST_API_VERSION}`

		this.rest = GetCustomCertificateBuffer(config).then(
			(certificateAuthority) =>
				got.extend({
					prefixUrl: this.prefixUrl,
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
							gotBeforeRetryHook,
						],
						beforeError: [gotBeforeErrorHook(config)],
						beforeRequest: [
							(options) => {
								const body = options.body
								const path = options.url.href
								const method = options.method
								trace(`${method} ${path}`)
								trace(body)
								this.log.debug(`${method} ${path}`)
								this.log.trace(body?.toString())
							},
							...(config.middleware ?? []),
						],
					},
				})
		)
	}

	private async getHeaders() {
		const authorization = await this.oAuthProvider.getHeaders('ZEEBE')

		const headers = {
			'content-type': 'application/json',
			...authorization,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
		const auth = headers.authorization ? headers.authorization : headers.cookie
		const safeHeaders = {
			...headers,
			authorization: auth
				? auth.substring(0, 15) + (auth.length > 8)
					? '...'
					: ''
				: '',
		}
		trace('headers', safeHeaders)
		return headers
	}

	/**
	 * Manage the permissions assigned to authorization.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/patch-authorization/
	 *
	 * @since 8.6.0
	 */
	public async modifyAuthorization(req: PatchAuthorizationRequest) {
		const headers = await this.getHeaders()
		const { ownerKey, ...request } = req
		return this.rest.then((rest) =>
			rest
				.patch(`authorizations/${ownerKey}`, {
					headers,
					body: stringify(request),
				})
				.json()
		)
	}

	/**
	 * Broadcast a signal.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/broadcast-signal/
	 *
	 * @since 8.6.0
	 */
	public async broadcastSignal(req: BroadcastSignalReq) {
		const headers = await this.getHeaders()
		const request = this.addDefaultTenantId(req)
		return this.rest.then((rest) =>
			rest
				.post(`signals/broadcast`, {
					headers,
					body: stringify(request),
					parseJson: (text) => losslessParse(text, BroadcastSignalResponse),
				})
				.json<BroadcastSignalResponse>()
		)
	}

	/* Get the topology of the Zeebe cluster. */
	public async getTopology() {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest.get('topology', { headers }).json<TopologyResponse>()
		)
	}

	/**
	 * Complete a user task with the given key. The method either completes the task or throws 400, 404, or 409.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/zeebe-api-rest/specifications/complete-a-user-task/
	 *
	 * @since 8.6.0
	 */
	public async completeUserTask({
		userTaskKey,
		variables = {},
		action = 'complete',
	}: {
		userTaskKey: string
		variables?: Record<string, unknown>
		action?: string
	}): Promise<void> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`user-tasks/${userTaskKey}/completion`, {
					body: losslessStringify({
						variables,
						action,
					}),
					headers,
				})
				.json()
		)
	}

	/**
	 * Stop all workers that were created by this client.
	 */
	public stopWorkers() {
		this.workers.forEach((worker) => worker.stop())
	}

	/**
	 * Start all workers that were created by this client.
	 */
	public startWorkers() {
		this.workers.forEach((worker) => worker.start())
	}

	/**
	 * Assign a user task with the given key to the given assignee.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/assign-user-task/
	 *
	 * @since 8.6.0
	 * @deprecated use `assignUserTask`
	 */
	public async assignTask({
		userTaskKey,
		assignee,
		allowOverride = true,
		action = 'assign',
	}: AssignUserTaskRequest): Promise<void> {
		return this.assignUserTask({ userTaskKey, assignee, allowOverride, action })
	}

	/**
	 * Assign a user task with the given key to the given assignee.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/assign-user-task/
	 *
	 * @since 8.6.0
	 */
	public async assignUserTask({
		userTaskKey,
		assignee,
		allowOverride = true,
		action = 'assign',
	}: AssignUserTaskRequest): Promise<void> {
		const headers = await this.getHeaders()
		const req = {
			allowOverride,
			action,
			assignee,
		}
		return this.rest.then((rest) =>
			rest
				.post(`user-tasks/${userTaskKey}/assignment`, {
					body: losslessStringify(req),
					headers,
				})
				.json()
		)
	}

	/**
	 * Update a user task with the given key.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/update-user-task/
	 *
	 * @since 8.6.0
	 * @deprecated use `updateUserTask`
	 */
	public async updateTask({
		userTaskKey,
		changeset,
	}: {
		userTaskKey: string
		changeset: TaskChangeSet
	}): Promise<void> {
		return this.updateUserTask({ userTaskKey, changeset })
	}

	/**
	 * Update a user task with the given key.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/update-user-task/
	 *
	 * @since 8.6.0
	 */
	public async updateUserTask({
		userTaskKey,
		changeset,
	}: {
		userTaskKey: string
		changeset: TaskChangeSet
	}): Promise<void> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.patch(`user-tasks/${userTaskKey}/update`, {
					body: losslessStringify(changeset),
					headers,
				})
				.json()
		)
	}

	/**
	 * Remove the assignee of a task with the given key.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/unassign-user-task/
	 *
	 * @since 8.6.0
	 * @deprecated use `unassignUserTask`
	 */
	public async unassignTask({
		userTaskKey,
	}: {
		userTaskKey: string
	}): Promise<void> {
		return this.unassignUserTask({ userTaskKey })
	}

	/**
	 * Remove the assignee of a task with the given key.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/unassign-user-task/
	 *
	 * @since 8.6.0
	 */
	public async unassignUserTask({
		userTaskKey,
	}: {
		userTaskKey: string
	}): Promise<void> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest.delete(`user-tasks/${userTaskKey}/assignee`, { headers }).json()
		)
	}

	/**
	 * Search for user tasks based on given criteria.
	 *
	 * Documentation: https://docs.camunda.io/docs/8.7/apis-tools/camunda-api-rest/specifications/find-user-tasks/
	 *
	 * @since 8.8.0
	 */
	public async searchUserTasks(
		request: SearchTasksRequest
	): Promise<CamundaRestSearchUserTasksResponse> {
		const headers = await this.getHeaders()
		const page = request.page ?? {
			from: 0,
			limit: 100,
		}
		const sort = request.sort ?? [{ field: 'creationDate', order: 'asc' }]
		const response = await this.rest.then((rest) =>
			rest
				.post(`user-tasks/search`, {
					headers,
					body: losslessStringify({ ...request, page, sort }),
				})
				.json<CamundaRestSearchUserTasksResponse>()
		)
		/**
		 * The 8.6 and 8.7 API have different key names for the userTaskKey. This code block normalizes the key names.
		 */
		const normalizedResponse = {
			...response,
			items: response.items.map((item) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				if (!item.userTaskKey && (item as any).key) {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					item.userTaskKey = (item as any).key
				}
				return item
			}),
		}
		return normalizedResponse
	}

	/**
	 * Get the user task by the user task key.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/get-user-task/
	 *
	 * @since 8.8.0
	 */
	public async getUserTask(userTaskKey: string): Promise<UserTask> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest.get(`user-tasks/${userTaskKey}`, { headers }).json()
		)
	}

	/**
	 *
	 * Search for user task variables based on given criteria.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/find-user-task-variables/
	 *
	 * @since 8.8.0
	 */
	public async searchUserTaskVariables(
		request: UserTaskVariablesRequest
	): Promise<CamundaRestUserTaskVariablesResponse> {
		const { userTaskKey, ...req } = request
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`user-tasks/${userTaskKey}/variables/search`, {
					headers,
					body: losslessStringify(req),
				})
				.json<CamundaRestUserTaskVariablesResponse>()
		)
	}
	/**
	 * Create a user.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/create-user/
	 *
	 * @since 8.6.0
	 */
	public async createUser(newUserInfo: NewUserInfo) {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`users`, {
					body: losslessStringify(newUserInfo),
					headers,
				})
				.json()
		)
	}

	/**
	 * Search users for tenant.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/find-users/
	 *
	 * @since 8.8.0
	 */
	public async searchUsers(
		request: SearchUsersRequest
	): Promise<SearchUsersResponse> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`users/search`, {
					body: losslessStringify(request),
					headers,
				})
				.json()
		)
	}

	/**
	 * Search users for tenant.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/search-users-for-tenant/
	 *
	 * @since 8.8.0
	 */
	public async searchUsersForTenant(
		tenantId: string,
		request: SearchUsersRequest
	): Promise<SearchUsersResponse> {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`tenants/${tenantId}/users/search`, {
					body: losslessStringify(request),
					headers,
				})
				.json()
		)
	}

	/**
	 * Publish a Message and correlates it to a subscription. If correlation is successful it will return the first process instance key the message correlated with.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/correlate-a-message/
	 *
	 * @since 8.6.0
	 */
	public async correlateMessage(
		message: Pick<
			PublishMessageRequest,
			'name' | 'correlationKey' | 'variables' | 'tenantId'
		>
	) {
		const headers = await this.getHeaders()
		const req = this.addDefaultTenantId(message)
		const body = losslessStringify(req)
		return this.rest.then((rest) =>
			rest
				.post(`messages/correlation`, {
					body,
					headers,
					parseJson: (text) => losslessParse(text, CorrelateMessageResponse),
				})
				.json<CorrelateMessageResponse>()
		)
	}

	/**
	 * Publish a single message. Messages are published to specific partitions computed from their correlation keys. This method does not wait for a correlation result. Use `correlateMessage` for such use cases.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/publish-a-message/
	 *
	 * @since 8.6.0
	 */
	public async publishMessage(publishMessageRequest: PublishMessageRequest) {
		const headers = await this.getHeaders()
		const req = this.addDefaultTenantId(publishMessageRequest)
		const body = losslessStringify(req)
		return this.rest.then((rest) =>
			rest
				.post(`messages/publication`, {
					headers,
					body,
					parseJson: (text) => losslessParse(text, PublishMessageResponse),
				})
				.json<PublishMessageResponse>()
		)
	}

	/**
	 * Obtains the status of the current Camunda license.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/get-status-of-camunda-license/
	 *
	 * @since 8.6.0
	 */
	public async getLicenseStatus(): Promise<{
		vaildLicense: boolean
		licenseType: string
	}> {
		return this.rest.then((rest) => rest.get(`license`).json())
	}

	/**
	 * Create a new polling Job Worker.
	 * You can pass in an optional winston.Logger instance as `logger`. This enables you to have distinct logging levels for different workers.
	 *
	 * Polling: The worker polls periodically. If no jobs are available, the poll stays open for 10 seconds.
	 * If no jobs become available in that time, the poll is closed, and the worker polls again.
	 * When jobs are available, they are returned, and the worker polls again for more jobs as soon as it has capacity for more jobs.
	 *
	 * @since 8.6.0
	 */
	public createJobWorker<
		Variables extends LosslessDto,
		CustomHeaders extends LosslessDto,
	>(config: CamundaJobWorkerConfig<Variables, CustomHeaders>) {
		const worker = new CamundaJobWorker(config, this)
		this.workers.push(worker)
		return worker
	}
	/**
	 * Iterate through all known partitions and activate jobs up to the requested maximum.
	 *
	 * The parameter `inputVariablesDto` is a Dto to decode the job payload. The `customHeadersDto` parameter is a Dto to decode the custom headers.
	 * Pass in a Dto class that extends LosslessDto to provide both type information in your code,
	 * and safe interoperability with applications that use the `int64` type in variables.
	 *
	 * @since 8.6.0
	 */
	public activateJobs<
		VariablesDto extends LosslessDto,
		CustomHeadersDto extends LosslessDto,
	>(
		request: ActivateJobsRequest & {
			inputVariableDto?: Ctor<VariablesDto>
			customHeadersDto?: Ctor<CustomHeadersDto>
		}
	): PCancelable<JobWithMethods<VariablesDto, CustomHeadersDto>[]> {
		const {
			inputVariableDto = LosslessDto,
			customHeadersDto = LosslessDto,
			tenantIds = this.tenantId ? [this.tenantId] : undefined,
			...req
		} = request

		// The ActivateJobs endpoint can take multiple tenantIds, and activate jobs for multiple tenants at once.
		// Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/activate-jobs/
		const body = {
			...req,
			tenantIds,
		}

		const jobDto = createSpecializedRestApiJobClass(
			inputVariableDto,
			customHeadersDto
		)

		const gotRequest = this.callApiEndpoint<
			UnknownRequestBody,
			RestJob<VariablesDto, CustomHeadersDto>[]
		>({
			urlPath: 'jobs/activation',
			method: 'POST',
			body,
			parseJson: (text) => losslessParse(text, jobDto, 'jobs'),
		})

		// Make the call cancelable
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/424
		return new PCancelable<JobWithMethods<VariablesDto, CustomHeadersDto>[]>(
			(resolve, reject, onCancel) => {
				onCancel.shouldReject = false
				onCancel(
					() =>
						!gotRequest.isCanceled &&
						gotRequest.cancel(`Cancelling activateJobs request`)
				)
				gotRequest
					.then((activatedJobs: RestJob<VariablesDto, CustomHeadersDto>[]) =>
						activatedJobs.map(this.addJobMethods)
					)
					.then(resolve)
					.catch(reject)
			}
		)
	}

	/**
	 * Fails a job using the provided job key. This method sends a POST request to the endpoint '/jobs/{jobKey}/fail' with the failure reason and other details specified in the failJobRequest object.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/fail-job/
	 *
	 * @since 8.6.0
	 */
	public async failJob(failJobRequest: FailJobRequest) {
		const { jobKey } = failJobRequest
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`jobs/${jobKey}/failure`, {
					body: losslessStringify(failJobRequest),
					headers,
				})
				.then(() => JOB_ACTION_ACKNOWLEDGEMENT)
		)
	}

	/**
	 * Report a business error (i.e. non-technical) that occurs while processing a job.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/report-error-for-job/
	 *
	 * @since 8.6.0
	 */
	public async errorJob(
		errorJobRequest: ErrorJobWithVariables & { jobKey: string }
	) {
		const { jobKey, ...request } = errorJobRequest
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest
				.post(`jobs/${jobKey}/error`, {
					body: losslessStringify(request),
					headers,
					parseJson: (text) => losslessParse(text),
				})
				.then(() => JOB_ACTION_ACKNOWLEDGEMENT)
		)
	}

	/**
	 * Complete a job with the given payload, which allows completing the associated service task.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/complete-job/
	 *
	 * @since 8.6.0
	 */
	public async completeJob(completeJobRequest: CompleteJobRequest) {
		const { jobKey } = completeJobRequest
		const headers = await this.getHeaders()
		const req = { variables: completeJobRequest.variables }
		return this.rest.then((rest) =>
			rest
				.post(`jobs/${jobKey}/completion`, {
					body: losslessStringify(req),
					headers,
				})
				.then(() => JOB_ACTION_ACKNOWLEDGEMENT)
		)
	}

	/**
	 * Update a job with the given key.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/update-a-job/
	 *
	 * @since 8.6.0
	 */
	public async updateJob(
		jobChangeset: JobUpdateChangeset & { jobKey: string }
	) {
		const { jobKey, ...changeset } = jobChangeset
		return this.callApiEndpoint({
			urlPath: `jobs/${jobKey}`,
			method: 'PATCH',
			body: changeset,
			json: false,
		})
	}

	/**
	 * Marks the incident as resolved; most likely a call to Update job will be necessary to reset the job's retries, followed by this call.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/resolve-incident/
	 *
	 * @since 8.6.0
	 */
	public async resolveIncident(incidentKey: string) {
		const headers = await this.getHeaders()
		return this.rest.then((rest) =>
			rest.post(`incidents/${incidentKey}/resolution`, {
				headers,
			})
		)
	}

	/**
	 * Create and start a process instance. This method does not await the outcome of the process. For that, use `createProcessInstanceWithResult`.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/create-process-instance/
	 *
	 * @since 8.6.0
	 */
	public async createProcessInstance<T extends JSONDoc | LosslessDto>(
		request: CreateProcessInstanceReq<T>
	): Promise<CreateProcessInstanceResponse<never>>

	async createProcessInstance<
		T extends JSONDoc | LosslessDto,
		V extends LosslessDto,
	>(
		request: CreateProcessInstanceReq<T> & {
			outputVariablesDto?: Ctor<V>
		}
	) {
		const outputVariablesDto: Ctor<V> | Ctor<LosslessDto> =
			(request.outputVariablesDto as Ctor<V>) ?? DefaultLosslessDto

		const CreateProcessInstanceResponseWithVariablesDto =
			createSpecializedCreateProcessInstanceResponseClass(outputVariablesDto)

		return this.callApiEndpoint<
			UnknownRequestBody,
			InstanceType<typeof CreateProcessInstanceResponseWithVariablesDto>
		>({
			urlPath: `process-instances`,
			method: 'POST',
			body: this.addDefaultTenantId(request),
			parseJson: (text) =>
				losslessParse(text, CreateProcessInstanceResponseWithVariablesDto),
		})
	}

	/**
	 * Create and start a process instance. This method awaits the outcome of the process.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/create-process-instance/
	 *
	 * @since 8.6.0
	 */
	public async createProcessInstanceWithResult<
		T extends JSONDoc | LosslessDto,
		V = unknown,
	>(
		request: CreateProcessInstanceReq<T> & {
			/** An array of variable names to fetch. If not supplied, all visible variables in the root scope will be returned  */
			fetchVariables?: string[]
		}
	): Promise<CreateProcessInstanceResponse<V>>

	public async createProcessInstanceWithResult<
		T extends JSONDoc | LosslessDto,
		V extends LosslessDto,
	>(
		request: CreateProcessInstanceReq<T> & {
			/** An array of variable names to fetch. If not supplied, all visible variables in the root scope will be returned  */
			fetchVariables?: string[]
			/** A Dto specifying the shape of the output variables. If not supplied, the output variables will be returned as a `LosslessDto` of type `unknown`. */
			outputVariablesDto: Ctor<V>
		}
	): Promise<CreateProcessInstanceResponse<V>>
	public async createProcessInstanceWithResult<
		T extends JSONDoc | LosslessDto,
		V,
	>(
		request: CreateProcessInstanceReq<T> & {
			outputVariablesDto?: Ctor<V>
		}
	) {
		/**
		 * We override the type system to make `awaitCompletion` hidden from end-users. This has been done because supporting the permutations of
		 * creating a process with/without awaiting the result and with/without an outputVariableDto in a single method is complex. I could not get all
		 * the cases to work with intellisense for the end-user using either generics or with signature overloads.
		 *
		 * To address this, createProcessInstance has all the functionality, but hides the `awaitCompletion` attribute from the signature. This method
		 * is a wrapper around createProcessInstance that sets `awaitCompletion` to true, and explicitly informs the type system via signature overloads.
		 *
		 * This is not ideal, but it is the best solution I could come up with.
		 */
		return this.createProcessInstance({
			...request,
			awaitCompletion: true,
			outputVariablesDto: request.outputVariablesDto,
		} as unknown as CreateProcessInstanceReq<T>)
	}

	/**
	 * Cancel an active process instance
	 */
	public async cancelProcessInstance({
		processInstanceKey,
		operationReference,
	}: {
		processInstanceKey: string
		operationReference?: number
	}) {
		return this.callApiEndpoint({
			urlPath: `process-instances/${processInstanceKey}/cancellation`,
			method: 'POST',
			body: { operationReference },
		})
	}

	/**
	 * Migrates a process instance to a new process definition.
	 * This request can contain multiple mapping instructions to define mapping between the active process instance's elements and target process definition elements.
	 * Use this to upgrade a process instance to a new version of a process or to a different process definition, e.g. to keep your running instances up-to-date with the latest process improvements.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/migrate-process-instance/
	 *
	 * @since 8.6.0
	 */
	public async migrateProcessInstance(req: MigrationRequest): Promise<''> {
		const { processInstanceKey, ...request } = req
		this.log.debug(`Migrating process instance ${processInstanceKey}`, {
			component: 'C8RestClient',
		})
		return this.callApiEndpoint<
			Omit<MigrationRequest, 'processInstanceKey'>,
			''
		>({
			urlPath: `process-instances/${processInstanceKey}/migration`,
			method: 'POST',
			body: request,
		})
	}

	/**
	 * Query process instances
	 *
	 * Documentation: https://docs.camunda.io/docs/8.7/apis-tools/camunda-api-rest/specifications/query-process-instances-alpha/
	 *
	 * @since 8.8.0
	 */
	public async searchProcessInstances(
		request: SearchProcessInstanceRequest
	): Promise<CamundaRestSearchProcessInstanceResponse> {
		return this.callApiEndpoint<
			SearchProcessInstanceRequest,
			CamundaRestSearchProcessInstanceResponse
		>({
			urlPath: `process-instances/search`,
			method: 'POST',
			body: request,
		})
	}

	/**
	 * Deploy resources to the broker.
	 * @param resources - An array of binary data strings representing the resources to deploy.
	 * @param tenantId - Optional tenant ID to deploy the resources to. If not provided, the default tenant ID is used.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/deploy-resources/
	 *
	 * @since 8.6.0
	 */
	public async deployResources(
		resources: { content: string; name: string }[],
		tenantId?: string
	) {
		const headers = await this.getHeaders()
		const formData = new FormData()

		resources.forEach((resource) => {
			formData.append(`resources`, resource.content, {
				filename: resource.name,
			})
		})

		if (tenantId || this.tenantId) {
			formData.append('tenantId', tenantId ?? this.tenantId)
		}

		this.log.debug(`Deploying ${resources.length} resources`)
		const res = await this.rest.then((rest) =>
			rest
				.post('deployments', {
					body: formData,
					headers: {
						...headers,
						...formData.getHeaders(),
						Accept: 'application/json',
					},
					parseJson: (text) => parse(text), // we parse the response with LosslessNumbers, with no Dto
				})
				.json<DeployResourceResponseDto>()
		)

		/**
		 * Now we need to examine the response and parse the deployments to lossless Dtos
		 * We dynamically construct the response object for the caller, by examining the lossless response
		 * and re-parsing each of the deployments with the correct Dto.
		 */
		const deploymentResponse = new DeployResourceResponse()
		deploymentResponse.deploymentKey = res.deploymentKey.toString()
		deploymentResponse.tenantId = res.tenantId
		deploymentResponse.deployments = []
		deploymentResponse.processes = []
		deploymentResponse.decisions = []
		deploymentResponse.forms = []
		deploymentResponse.decisionRequirements = []

		/**
		 * Type-guard assertions to correctly type the deployments. The API returns an array with mixed types.
		 */
		const isProcessDeployment = (
			deployment
		): deployment is { processDefinition: ProcessDeployment } =>
			!!deployment.processDefinition
		const isDecisionDeployment = (
			deployment
		): deployment is { decisionDefinition: DecisionDeployment } =>
			!!deployment.decisionDefinition
		const isDecisionRequirementsDeployment = (
			deployment
		): deployment is { decisionRequirements: DecisionRequirementsDeployment } =>
			!!deployment.decisionRequirements
		const isFormDeployment = (
			deployment
		): deployment is { form: FormDeployment } => !!deployment.form

		/**
		 * Here we examine each of the deployments returned from the API, and create a correctly typed
		 * object for each one. We also populate subkeys per type. This allows SDK users to work with
		 * types known ahead of time.
		 */
		res.deployments.forEach((deployment) => {
			if (isProcessDeployment(deployment)) {
				const processDeployment = losslessParse(
					stringify(deployment.processDefinition)!,
					ProcessDeployment
				)
				deploymentResponse.deployments.push({
					processDefinition: processDeployment,
				})
				deploymentResponse.processes.push(processDeployment)
			}
			if (isDecisionDeployment(deployment)) {
				const decisionDeployment = losslessParse(
					stringify(deployment.decisionDefinition)!,
					DecisionDeployment
				)
				deploymentResponse.deployments.push({
					decisionDefinition: decisionDeployment,
				})
				deploymentResponse.decisions.push(decisionDeployment)
			}
			if (isDecisionRequirementsDeployment(deployment)) {
				const decisionRequirementsDeployment = losslessParse(
					stringify(deployment.decisionRequirements)!,
					DecisionRequirementsDeployment
				)
				deploymentResponse.deployments.push({
					decisionRequirements: decisionRequirementsDeployment,
				})
				deploymentResponse.decisionRequirements.push(
					decisionRequirementsDeployment
				)
			}
			if (isFormDeployment(deployment)) {
				const formDeployment = losslessParse(
					stringify(deployment.form)!,
					FormDeployment
				)
				deploymentResponse.deployments.push({ form: formDeployment })
				deploymentResponse.forms.push(formDeployment)
			}
		})

		return deploymentResponse
	}

	/**
	 * Deploy resources to Camunda 8 from files
	 * @param files an array of file paths
	 *
	 * @since 8.6.0
	 */
	public async deployResourcesFromFiles(
		files: string[],
		{ tenantId }: { tenantId?: string } = {}
	) {
		const resources: { content: string; name: string }[] = []

		for (const file of files) {
			resources.push({
				content: fs.readFileSync(file, { encoding: 'binary' }),
				name: file,
			})
		}

		return this.deployResources(resources, tenantId ?? this.tenantId)
	}

	/**
	 * Deletes a deployed resource. This can be a process definition, decision requirements definition, or form definition deployed using the deploy resources endpoint. Specify the resource you want to delete in the resourceKey parameter.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/delete-resource/
	 *
	 * @since 8.6.0
	 */
	public async deleteResource(req: {
		resourceKey: string
		operationReference?: number
	}) {
		const headers = await this.getHeaders()
		const { resourceKey, operationReference } = req
		return this.rest.then((rest) =>
			rest.post(`resources/${resourceKey}/deletion`, {
				headers,
				body: stringify({ operationReference }),
			})
		)
	}

	/**
	 * Set a precise, static time for the Zeebe engine's internal clock.
	 * When the clock is pinned, it remains at the specified time and does not advance.
	 * To change the time, the clock must be pinned again with a new timestamp, or reset.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/pin-internal-clock/
	 *
	 * @since 8.6.0
	 */
	public async pinInternalClock(epochMs: number) {
		return this.callApiEndpoint({
			urlPath: `clock`,
			method: 'PUT',
			body: { timestamp: epochMs },
		})
	}

	/**
	 * Resets the Zeebe engine's internal clock to the current system time, enabling it to tick in real-time.
	 * This operation is useful for returning the clock to normal behavior after it has been pinned to a specific time.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/reset-internal-clock/
	 *
	 * @since 8.6.0
	 */
	public async resetClock() {
		return this.callApiEndpoint({ urlPath: `clock/reset`, method: 'POST' })
	}

	/**
	 * Updates all the variables of a particular scope (for example, process instance, flow element instance) with the given variable data.
	 * Specify the element instance in the elementInstanceKey parameter.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/update-element-instance-variables/
	 *
	 * @since 8.6.0
	 */
	public async updateElementInstanceVariables(
		req: UpdateElementVariableRequest
	) {
		const { elementInstanceKey, ...body } = req
		return this.callApiEndpoint({
			urlPath: `element-instances/${elementInstanceKey}/variables`,
			method: 'PUT',
			body,
		})
	}

	public getConfig() {
		return this.config
	}

	/**
	 * Search for process and local variables based on given criteria.
	 *
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/find-variables/
	 * @since 8.8.0
	 */
	public async searchVariables(
		req: SearchVariablesRequest
	): Promise<CamundaRestSearchVariablesResponse> {
		return this.callApiEndpoint<
			SearchVariablesRequest,
			CamundaRestSearchVariablesResponse
		>({
			urlPath: `variables/search`,
			method: 'POST',
			body: req,
		})
	}

	/**
	 * Download a document from the Camunda 8 cluster.
	 *
	 * Note that this is currently supported for document stores of type: AWS, GCP, in-memory, local
	 * Documentation: https://docs.camunda.io/docs/8.7/apis-tools/camunda-api-rest/specifications/get-document/
	 *
	 * @since 8.7.0
	 */
	public async downloadDocument(
		request: DownloadDocumentRequest
	): Promise<Buffer> {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest
				.get(`documents/${request.documentId}`, {
					headers: {
						...headers, // we need the headers to be passed in
						accept: '*/*',
					},
					searchParams: {
						contentHash: request.contentHash,
						storeId: request.storeId,
					},
				})
				.buffer()
		)
	}

	/**
	 * Upload a document to the Camunda 8 cluster.
	 * Note that this is currently supported for document stores of type: AWS, GCP, in-memory, local
	 *
	 * Documentation: https://docs.camunda.io/docs/8.7/apis-tools/camunda-api-rest/specifications/create-document/
	 * @since 8.7.0
	 */
	public async uploadDocument(
		request: UploadDocumentRequest
	): Promise<UploadDocumentResponse> {
		const headers = await this.getHeaders()
		const formData = new FormData()

		const options =
			request.metadata?.contentType || request.metadata?.fileName
				? {
						contentType: request.metadata?.contentType,
						filename: request.metadata?.fileName,
					}
				: {}
		formData.append('file', request.file, options)

		// Add other form fields
		if (request.metadata) {
			formData.append('metadata', JSON.stringify(request.metadata), {
				contentType: 'application/json',
			})
		}

		return this.rest.then((rest) =>
			rest
				.post('documents', {
					searchParams: {
						storeId: request.storeId,
						documentId: request.documentId,
					},
					headers: {
						...headers,
						...formData.getHeaders(),
						accept: 'application/json',
					},
					body: formData,
					parseJson: (text) => losslessParse(text, UploadDocumentResponse),
				})
				.json<UploadDocumentResponse>()
		)
	}

	/**
	 * Delete a document from the Camunda 8 cluster.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/delete-document/
	 *
	 * @since 8.7.0
	 */
	public async deleteDocument({
		documentId,
		storeId,
	}: {
		documentId: string
		storeId?: string
	}): Promise<void> {
		return this.callApiEndpoint({
			method: 'DELETE',
			urlPath: `documents/${documentId}`,
			queryParams: {
				storeId: storeId ? storeId : undefined,
			},
		})
	}

	/**
	 *
	 * Upload multiple documents to the Camunda 8 cluster.
	 * The caller must provide a file name for each document, which will be used in case of a multi-status response to identify which documents failed to upload.
	 * The file name can be provided in the Content-Disposition header of the file part or in the fileName field of the metadata part.
	 * If both are provided, the fileName field takes precedence.
	 *
	 * In case of a multi-status response, the response body will contain a list of DocumentBatchProblemDetail objects,
	 * each of which contains the file name of the document that failed to upload and the reason for the failure.
	 * The client can choose to retry the whole batch or individual documents based on the response.
	 *
	 * Note that this is currently supported for document stores of type: AWS, GCP, in-memory (non-production), local (non-production)
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/create-documents/
	 * @since 8.7.0
	 */
	public async uploadDocuments(request: {
		/** The ID of the document store to upload the documents to. Currently, only a single document store is supported per cluster.
		 * However, this attribute is included to allow for potential future support of multiple document stores.
		 **/
		storeId?: string
		files: ReadStream[]
	}) {
		const headers = await this.getHeaders()
		const formData = new FormData()

		for (const file of request.files) {
			formData.append('files', file)
		}

		return this.rest.then((rest) =>
			rest
				.post('documents/batch', {
					searchParams: {
						storeId: request.storeId ? request.storeId : undefined,
					},
					headers: {
						...headers,
						...formData.getHeaders(),
						accept: 'application/json',
					},
					body: formData,
					parseJson: (text) => losslessParse(text, UploadDocumentsResponse),
				})
				.json<UploadDocumentsResponse>()
		)
	}

	/**
	 * Create document link
	 *
	 * Create a link to a document in the Camunda 8 cluster.
	 * Note that this is currently supported for document stores of type: AWS, GCP
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/create-document-link/
	 * @since 8.7.0
	 */
	public async createDocumentLink(request: CreateDocumentLinkRequest) {
		return this.callApiEndpoint({
			method: 'POST',
			urlPath: `documents/${request.documentId}/link`,
			body: {
				timeToLive: request.timeToLive,
			},
			queryParams: {
				storeId: request.storeId ? request.storeId : undefined,
				contentHash: request.contentHash ? request.contentHash : undefined,
			},
		})
	}

	/**
	 * Modify process instance
	 *
	 * Modifies a running process instance. This request can contain multiple instructions to activate an element of the process or to terminate an active instance of an element.
	 * Use this to repair a process instance that is stuck on an element or took an unintended path. For example, because an external system is not available or doesn't respond as expected.
	 *
	 * Documentation https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/modify-process-instance/
	 * @since 8.6.0
	 */
	public async modifyProcessInstance(
		request: ModifyProcessInstanceRequest
	): Promise<''> {
		const { processInstanceKey, ...req } = request
		return this.callApiEndpoint<UnknownRequestBody, ''>({
			method: 'POST',
			urlPath: `process-instances/${processInstanceKey}/modification`,
			body: req,
		})
	}

	/**
	 * Evaluate decision
	 *
	 * Evaluates a decision. You specify the decision to evaluate either by using its unique key (as returned by DeployResource), or using the decision ID.
	 * When using the decision ID, the latest deployed version of the decision is used.
	 *
	 * Documentation: https://docs.camunda.io/docs/apis-tools/camunda-api-rest/specifications/evaluate-decision/
	 * @since 8.6.0
	 */
	public async evaluateDecision(request: EvaluateDecisionRequest) {
		return this.callApiEndpoint<
			EvaluateDecisionRequest,
			EvaluateDecisionResponse
		>({
			method: 'POST',
			urlPath: `decision-definitions/evaluation`,
			body: request,
		})
	}

	/**
	 * @description Get the variable by the variable key. Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/get-variable/
	 * @since 8.8.0
	 */
	public async getVariable(req: {
		variableKey: string
	}): Promise<GetVariableResponse> {
		return this.callApiEndpoint<UnknownRequestBody, GetVariableResponse>({
			method: 'GET',
			urlPath: `variables/${req.variableKey}`,
		}).then((response) => {
			// We need to parse the response with LosslessNumbers, as the API returns numbers as strings
			return {
				...response,
				value: JSON.parse(response.value),
			}
		})
	}

	/**
	 * @description Returns process definition as XML.
	 * @param processDefinitionKey The assigned key of the process definition, which acts as a unique identifier for this process.
	 * @returns
	 */
	public async getProcessDefinitionXML(
		processDefinitionKey: string
	): Promise<string> {
		return this.callApiEndpoint({
			method: 'GET',
			json: false,
			urlPath: `process-definitions/${processDefinitionKey}/xml`,
		})
	}

	public async getProcessDefinition(
		processDefinitionKey: string
	): Promise<GetProcessDefinitionResponse> {
		return this.callApiEndpoint<
			UnknownRequestBody,
			GetProcessDefinitionResponse
		>({
			method: 'GET',
			urlPath: `process-definitions/${processDefinitionKey}`,
		})
	}

	/**
	 * @description Search for process definitions based on given criteria.
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/search-process-definitions/
	 * @since 8.8.0
	 */
	public async searchProcessDefinitions(
		request: SearchProcessDefinitionsRequest
	): Promise<CamundaRestSearchProcessDefinitionsResponse> {
		return this.callApiEndpoint<
			SearchProcessDefinitionsRequest,
			CamundaRestSearchProcessDefinitionsResponse
		>({
			method: 'POST',
			urlPath: `process-definitions/search`,
			body: request,
		})
	}

	/**
	 * @description Search for element instances based on given criteria.
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/search-element-instances/
	 * @since 8.8.0
	 */
	public async searchElementInstances(
		request: SearchElementInstancesRequest
	): Promise<CamundaRestSearchElementInstancesResponse> {
		return this.callApiEndpoint<
			SearchElementInstancesRequest,
			CamundaRestSearchElementInstancesResponse
		>({
			method: 'POST',
			urlPath: `element-instances/search`,
			body: request,
		})
	}

	/**
	 * @description Returns element instance as JSON.
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/get-element-instance/
	 * @since 8.8.0
	 */
	public async getElementInstance(elementInstanceKey: string) {
		return this.callApiEndpoint<UnknownRequestBody, ElementInstanceDetails>({
			method: 'GET',
			urlPath: `element-instances/${elementInstanceKey}`,
		})
	}

	/**
	 * @description Search for incidents based on given criteria.
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/search-incidents/
	 * @since 8.8.0
	 */
	public async searchIncidents(
		request: SearchIncidentsRequest
	): Promise<CamundaRestSearchIncidentsResponse> {
		return this.callApiEndpoint<
			SearchIncidentsRequest,
			CamundaRestSearchIncidentsResponse
		>({
			method: 'POST',
			urlPath: `incidents/search`,
			body: request,
		})
	}

	/**
	 * @description Search for decision instances based on given criteria.
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/orchestration-cluster-api-rest/specifications/search-decision-instances/
	 * @since 8.8.0
	 */
	public async searchDecisionInstances(
		request: CamundaRestSearchDecisionInstancesRequest
	): Promise<CamundaRestSearchDecisionInstancesResponse> {
		return this.callApiEndpoint<
			CamundaRestSearchDecisionInstancesRequest,
			CamundaRestSearchDecisionInstancesResponse
		>({
			method: 'POST',
			urlPath: `decision-instances/search`,
			body: request,
		})
	}

	/**
	 * Get a decision instance by key.
	 * @param decisionInstanceKey The key of the decision instance to get
	 * @returns Decision instance details
	 */
	public async getDecisionInstance(
		decisionInstanceKey: string
	): Promise<GetDecisionInstanceResponse> {
		return this.callApiEndpoint<
			UnknownRequestBody,
			GetDecisionInstanceResponse
		>({
			method: 'GET',
			urlPath: `decision-instances/${decisionInstanceKey}`,
		})
	}

	/**
	 * This is a generic method to call an API endpoint. Use this method to call any REST API endpoint in the Camunda 8 cluster.
	 * TODO: This does not currently support multipart form-data, but it will.
	 */
	// Function overloads
	public callApiEndpoint<
		T extends UnknownRequestBody = UnknownRequestBody,
		V = unknown,
	>(request: JsonApiEndpointRequest<T>): PCancelable<V>

	public callApiEndpoint<T extends UnknownRequestBody = UnknownRequestBody>(
		request: RawApiEndpointRequest<T>
	): PCancelable<string>

	public callApiEndpoint<
		T extends UnknownRequestBody = UnknownRequestBody,
		V = unknown,
	>(request: ApiEndpointRequest<T>): PCancelable<V | Response<string>> {
		// Return a cancelable promise
		// https://github.com/camunda/camunda-8-js-sdk/issues/424
		return new PCancelable(async (resolve, reject, onCancel) => {
			// eslint-disable-next-line prefer-const
			let gotRequest: CancelableRequest<Response<string>>
			let cancelled = false
			// Register the cancel handler, we will cancel the request if the promise is cancelled
			onCancel.shouldReject = false
			onCancel(() => {
				cancelled = true
				if (gotRequest && !gotRequest.isCanceled) {
					gotRequest.cancel(`REST operation cancelled`)
				}
			})
			try {
				const headers = await this.getHeaders()
				const { method, urlPath, body, queryParams } = request
				const req = {
					method,
					headers: request.headers
						? { ...headers, ...request.headers }
						: headers,
					body: body
						? losslessStringify(this.addDefaultTenantId(body))
						: undefined,
					searchParams: queryParams ?? {},
					parseJson: request.parseJson ?? losslessParse,
				}
				const rest = await this.rest
				if (cancelled) {
					// If the request was already cancelled, we don't want to send it
					return
				}
				gotRequest = rest(urlPath, req)
				gotRequest.catch(reject)
				/**
				 * Without a listener for the error event, we get an unhandled promise rejection
				 * when the request fails. This is because the underlying stream emits an error and with no listener
				 * on that event, it is an unhandled exception at the process level
				 *
				 * Implemented as part of https://github.com/camunda/camunda-8-js-sdk/issues/424.
				 */
				;(await gotRequest).once('error', (err) => {
					// Swallow the error, we don't want to crash the process
					return err
				})

				if (request.json ?? true) {
					return gotRequest.json<V>().then(resolve)
				}
				return gotRequest.then((response) => resolve(response.body as V))
			} catch (e) {
				reject(e)
			}
		})
	}

	/**
	 * Helper method to add the default job methods to a job
	 * @param job The job to add the methods to
	 * @returns The job with the added methods
	 */
	private addJobMethods = <Variables, CustomHeaders>(
		job: RestJob<Variables, CustomHeaders>
	): JobWithMethods<Variables, CustomHeaders> => {
		return {
			...job,
			cancelWorkflow: async () => {
				await this.cancelProcessInstance({
					processInstanceKey: job.processInstanceKey,
				})
				return JOB_ACTION_ACKNOWLEDGEMENT
			},
			complete: (variables: IProcessVariables = {}) =>
				this.completeJob({
					jobKey: job.jobKey,
					variables,
				}),
			error: (error) =>
				this.errorJob({
					...error,
					jobKey: job.jobKey,
				}),
			fail: (failJobRequest: JobFailureConfiguration) =>
				this.failJob({
					jobKey: job.jobKey,
					errorMessage: failJobRequest.errorMessage,
					retries: failJobRequest.retries ?? job.retries - 1,
					retryBackOff: failJobRequest.retryBackOff ?? 0,
					variables: failJobRequest.variables,
				}),
			/* This has an effect in a Job Worker, decrementing the currently active job count */
			forward: () => JOB_ACTION_ACKNOWLEDGEMENT,
			modifyJobTimeout: ({ newTimeoutMs }: { newTimeoutMs: number }) =>
				this.updateJob({ jobKey: job.jobKey, timeout: newTimeoutMs }),
		}
	}

	/**
	 * Helper method to add the default tenantIds if we are not passed explicit tenantIds
	 */
	private addDefaultTenantId<T extends { tenantId?: string }>(request: T) {
		const tenantId = request.tenantId ?? this.tenantId
		return { ...request, tenantId }
	}
}
