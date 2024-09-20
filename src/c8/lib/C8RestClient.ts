import fs from 'node:fs'

import { debug } from 'debug'
import FormData from 'form-data'
import got from 'got'
import { parse, stringify } from 'lossless-json'
import winston from 'winston'

import {
	Camunda8ClientConfiguration,
	CamundaEnvironmentConfigurator,
	constructOAuthProvider,
	createUserAgentString,
	GetCustomCertificateBuffer,
	gotBeforeErrorHook,
	gotErrorHandler,
	GotRetryConfig,
	LosslessDto,
	losslessParse,
	losslessStringify,
	makeBeforeRetryHandlerFor401TokenRetry,
	RequireConfiguration,
} from '../../lib'
import { IOAuthProvider } from '../../oauth'
import {
	ActivateJobsRequest,
	BroadcastSignalReq,
	CompleteJobRequest,
	ErrorJobWithVariables,
	FailJobRequest,
	IProcessVariables,
	Job,
	JOB_ACTION_ACKNOWLEDGEMENT,
	JobCompletionInterfaceRest,
	JSONDoc,
	PublishMessageRequest,
	TopologyResponse,
} from '../../zeebe/types'

import {
	BroadcastSignalResponse,
	CorrelateMessageResponse,
	CreateProcessInstanceReq,
	CreateProcessInstanceResponse,
	Ctor,
	DecisionDeployment,
	DecisionRequirementsDeployment,
	DeployResourceResponse,
	DeployResourceResponseDto,
	FormDeployment,
	JobUpdateChangeset,
	MigrationRequest,
	NewUserInfo,
	PatchAuthorizationRequest,
	ProcessDeployment,
	PublishMessageResponse,
	TaskChangeSet,
	UpdateElementVariableRequest,
} from './C8Dto'
import { C8JobWorker, C8JobWorkerConfig } from './C8JobWorker'
import { getLogger } from './C8Logger'
import { createSpecializedRestApiJobClass } from './RestApiJobClassFactory'
import { createSpecializedCreateProcessInstanceResponseClass } from './RestApiProcessInstanceClassFactory'

const trace = debug('camunda:zeebe')

const CAMUNDA_REST_API_VERSION = 'v2'

class DefaultLosslessDto extends LosslessDto {}

export class C8RestClient {
	private userAgentString: string
	private oAuthProvider: IOAuthProvider
	private rest: Promise<typeof got>
	private tenantId?: string
	private log: winston.Logger

	constructor(options?: {
		config?: Camunda8ClientConfiguration
		oAuthProvider?: IOAuthProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.log = getLogger(config)
		this.log.info(`Using REST API version ${CAMUNDA_REST_API_VERSION}`)
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

	/**
	 * Manage the permissions assigned to authorization.
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
	 * Broadcasts a signal.
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
			rest
				.post(`user-tasks/${userTaskKey}/assignment`, {
					body: losslessStringify({
						allowOverride,
						action,
						assignee,
					}),
					headers,
				})
				.json()
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
			rest
				.patch(`user-tasks/${userTaskKey}/update`, {
					body: losslessStringify(changeset),
					headers,
				})
				.json()
		)
	}
	/* Removes the assignee of a task with the given key. */
	public async unassignTask({ userTaskKey }: { userTaskKey: string }) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.delete(`user-tasks/${userTaskKey}/assignee`, { headers }).json()
		)
	}

	/**
	 * Create a user
	 */
	public async createUser(newUserInfo: NewUserInfo) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest
				.post(`users`, {
					body: JSON.stringify(newUserInfo),
					headers,
				})
				.json()
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
	) {
		const headers = await this.getHeaders()
		const body = losslessStringify(this.addDefaultTenantId(message))

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
	 * Publishes a single message. Messages are published to specific partitions computed from their correlation keys.
	 * The endpoint does not wait for a correlation result. Use `correlateMessage` for such use cases.
	 */
	public async publishMessage(publishMessageRequest: PublishMessageRequest) {
		const headers = await this.getHeaders()
		const body = losslessStringify(
			this.addDefaultTenantId(publishMessageRequest)
		)
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
	 * Obtains the status of the current Camunda license
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
	 */
	public createJobWorker<
		Variables extends LosslessDto,
		CustomHeaders extends LosslessDto,
	>(config: C8JobWorkerConfig<Variables, CustomHeaders>) {
		const worker = new C8JobWorker(config, this)
		worker.start()
		return worker
	}
	/**
	 * Iterate through all known partitions and activate jobs up to the requested maximum.
	 *
	 * The parameter Variables is a Dto to decode the job payload. The CustomHeaders parameter is a Dto to decode the custom headers.
	 * Pass in a Dto class that extends LosslessDto to provide both type information in your code,
	 * and safe interoperability with other applications that natively support the int64 type.
	 */
	public async activateJobs<
		VariablesDto extends LosslessDto,
		CustomHeadersDto extends LosslessDto,
	>(
		request: ActivateJobsRequest & {
			inputVariableDto?: Ctor<VariablesDto>
			customHeadersDto?: Ctor<CustomHeadersDto>
		}
	): Promise<
		(Job<VariablesDto, CustomHeadersDto> &
			JobCompletionInterfaceRest<IProcessVariables>)[]
	> {
		const headers = await this.getHeaders()

		const {
			inputVariableDto = LosslessDto,
			customHeadersDto = LosslessDto,
			...req
		} = request

		const body = losslessStringify(this.addDefaultTenantIds(req))

		const jobDto = createSpecializedRestApiJobClass(
			inputVariableDto,
			customHeadersDto
		)

		return this.rest.then((rest) =>
			rest
				.post(`jobs/activation`, {
					body,
					headers,
					parseJson: (text) => losslessParse(text, jobDto, 'jobs'),
				})
				.json<Job<VariablesDto, CustomHeadersDto>[]>()
				.then((activatedJobs) => activatedJobs.map(this.addJobMethods))
		)
	}

	/**
	 * Fails a job using the provided job key. This method sends a POST request to the endpoint '/jobs/{jobKey}/fail' with the failure reason and other details specified in the failJobRequest object.
	 * @throws
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/fail-job/
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
	 * Reports a business error (i.e. non-technical) that occurs while processing a job.
	 * @throws
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/report-error-for-job/
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
	 * Documentation: https://docs.camunda.io/docs/next/apis-tools/camunda-api-rest/specifications/complete-job/
	 * @throws
	 */
	public async completeJob(completeJobRequest: CompleteJobRequest) {
		const { jobKey } = completeJobRequest
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest
				.post(`jobs/${jobKey}/completion`, {
					body: losslessStringify({ variables: completeJobRequest.variables }),
					headers,
				})
				.then(() => JOB_ACTION_ACKNOWLEDGEMENT)
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

	/**
	 * Marks the incident as resolved; most likely a call to Update job will be necessary to reset the job's retries, followed by this call.
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
	 */
	public async createProcessInstance<T extends JSONDoc | LosslessDto>(
		request: CreateProcessInstanceReq<T>
	): Promise<CreateProcessInstanceResponse<Record<string, never>>>

	async createProcessInstance<
		T extends JSONDoc | LosslessDto,
		V extends LosslessDto,
	>(
		request: CreateProcessInstanceReq<T> & {
			outputVariablesDto?: Ctor<V>
		}
	) {
		const headers = await this.getHeaders()

		const outputVariablesDto: Ctor<V> | Ctor<LosslessDto> =
			(request.outputVariablesDto as Ctor<V>) ?? DefaultLosslessDto

		const CreateProcessInstanceResponseWithVariablesDto =
			createSpecializedCreateProcessInstanceResponseClass(outputVariablesDto)

		return this.rest.then((rest) =>
			rest
				.post(`process-instances`, {
					body: losslessStringify(this.addDefaultTenantId(request)),
					headers,
					parseJson: (text) =>
						losslessParse(text, CreateProcessInstanceResponseWithVariablesDto),
				})
				.json<
					InstanceType<typeof CreateProcessInstanceResponseWithVariablesDto>
				>()
		)
	}

	/**
	 * Create and start a process instance. This method awaits the outcome of the process.
	 */
	public async createProcessInstanceWithResult<T extends JSONDoc | LosslessDto>(
		request: CreateProcessInstanceReq<T> & {
			/** An array of variable names to fetch. If not supplied, all visible variables in the root scope will be returned  */
			fetchVariables?: string[]
		}
	): Promise<CreateProcessInstanceResponse<unknown>>

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
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.post(`process-instances/${processInstanceKey}/cancellation`, {
				body: JSON.stringify({ operationReference }),
				headers,
			})
		)
	}

	/**
	 * Migrates a process instance to a new process definition.
	 * This request can contain multiple mapping instructions to define mapping between the active process instance's elements and target process definition elements.
	 * Use this to upgrade a process instance to a new version of a process or to a different process definition, e.g. to keep your running instances up-to-date with the latest process improvements.
	 */
	public async migrateProcessInstance(req: MigrationRequest) {
		const headers = await this.getHeaders()
		const { processInstanceKey, ...request } = req
		this.log.debug(`Migrating process instance ${processInstanceKey}`, {
			component: 'C8RestClient',
		})
		return this.rest.then((rest) =>
			rest.post(`process-instances/${processInstanceKey}/migration`, {
				headers,
				body: losslessStringify(request),
			})
		)
	}

	/**
	 * Deploy resources to the broker.
	 * @param resources - An array of binary data strings representing the resources to deploy.
	 * @param tenantId - Optional tenant ID to deploy the resources to. If not provided, the default tenant ID is used.
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
		const deploymentResponse = new DeployResourceResponse({
			key: res.key.toString(),
			tenantId: res.tenantId,
			deployments: [],
			processes: [],
			decisions: [],
			decisionRequirements: [],
			forms: [],
		})

		/**
		 * Type-guard assertions to correctly type the deployments. The API returns an array with mixed types.
		 */
		const isProcessDeployment = (
			deployment
		): deployment is { process: ProcessDeployment } => !!deployment.process
		const isDecisionDeployment = (
			deployment
		): deployment is { decision: DecisionDeployment } => !!deployment.decision
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
					stringify(deployment.process)!,
					ProcessDeployment
				)
				deploymentResponse.deployments.push({ process: processDeployment })
				deploymentResponse.processes.push(processDeployment)
			}
			if (isDecisionDeployment(deployment)) {
				const decisionDeployment = losslessParse(
					stringify(deployment)!,
					DecisionDeployment
				)
				deploymentResponse.deployments.push({ decision: decisionDeployment })
				deploymentResponse.decisions.push(decisionDeployment)
			}
			if (isDecisionRequirementsDeployment(deployment)) {
				const decisionRequirementsDeployment = losslessParse(
					stringify(deployment)!,
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
					stringify(deployment)!,
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
	 */
	public async deployResourcesFromFiles(files: string[]) {
		const resources: { content: string; name: string }[] = []

		for (const file of files) {
			resources.push({
				content: fs.readFileSync(file, { encoding: 'binary' }),
				name: file,
			})
		}

		return this.deployResources(resources)
	}

	/**
	 * Deletes a deployed resource. This can be a process definition, decision requirements definition, or form definition deployed using the deploy resources endpoint. Specify the resource you want to delete in the resourceKey parameter.
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
	 */
	public async pinInternalClock(epochMs: number) {
		const headers = await this.getHeaders()

		return this.rest.then((rest) =>
			rest.put(`clock`, {
				headers,
				body: JSON.stringify({ timestamp: epochMs }),
			})
		)
	}

	/**
	 * Resets the Zeebe engine's internal clock to the current system time, enabling it to tick in real-time.
	 * This operation is useful for returning the clock to normal behavior after it has been pinned to a specific time.
	 */
	public async resetClock() {
		const headers = await this.getHeaders()
		return this.rest.then((rest) => rest.post(`clock/reset`, { headers }))
	}

	private addJobMethods = <Variables, CustomHeaders>(
		job: Job<Variables, CustomHeaders>
	): Job<Variables, CustomHeaders> &
		JobCompletionInterfaceRest<IProcessVariables> => {
		return {
			...job,
			cancelWorkflow: () => {
				throw new Error('Not Implemented')
			},
			complete: (variables: IProcessVariables = {}) =>
				this.completeJob({
					jobKey: job.key,
					variables,
				}),
			error: (error) =>
				this.errorJob({
					...error,
					jobKey: job.key,
				}),
			fail: (failJobRequest) => this.failJob(failJobRequest),
			/* This has an effect in a Job Worker, decrementing the currently active job count */
			forward: () => JOB_ACTION_ACKNOWLEDGEMENT,
			modifyJobTimeout: ({ newTimeoutMs }: { newTimeoutMs: number }) =>
				this.updateJob({ jobKey: job.key, timeout: newTimeoutMs }),
		}
	}

	/**
	 * Updates all the variables of a particular scope (for example, process instance, flow element instance) with the given variable data.
	 * Specify the element instance in the elementInstanceKey parameter.
	 */
	public async updateElementInstanceVariables(
		req: UpdateElementVariableRequest
	) {
		const headers = await this.getHeaders()
		const { elementInstanceKey, ...request } = req
		return this.rest.then((rest) =>
			rest.post(`element-instances/${elementInstanceKey}/variables`, {
				headers,
				body: stringify(request),
			})
		)
	}

	/**
	 * Helper method to add the default tenantIds if we are not passed explicit tenantIds
	 */
	private addDefaultTenantId<T extends { tenantId?: string }>(request: T) {
		const tenantId = request.tenantId ?? this.tenantId
		return { ...request, tenantId }
	}

	/**
	 * Helper method to add the default tenantIds if we are not passed explicit tenantIds
	 */
	private addDefaultTenantIds<T extends { tenantIds?: string[] }>(request: T) {
		const tenantIds = request.tenantIds ?? [this.tenantId]
		return { ...request, tenantIds }
	}
}
