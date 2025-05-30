import d from 'debug'
import got, { Response } from 'got'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCustomCertificateBuffer,
	GotRetryConfig,
	beforeCallHook,
	constructOAuthProvider,
	createUserAgentString,
	gotBeforeErrorHook,
	makeBeforeRetryHandlerFor401TokenRetry,
} from '../../lib'
import { IHeadersProvider } from '../../oauth'

import * as Dto from './ModelerDto'

const debug = d('camunda:modeler')

const API_VERSION = 'v1'

/**
 * Modeler REST API Client.
 * All constructor parameters for configuration are optional. If no configuration is provided, the SDK will use environment variables to configure itself.
 * See {@link CamundaSDKConfiguration} for the complete list of configuration parameters. Values can be passed in explicitly in code, or set via environment variables (recommended: separate configuration and application logic).
 * Explicitly set values will override environment variables, which are merged into the configuration.
 */
export class ModelerApiClient {
	private userAgentString: string
	private oAuthProvider: IHeadersProvider
	private rest: Promise<typeof got>

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
		oAuthProvider?: IHeadersProvider
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		const modelerApiUrl = config.CAMUNDA_MODELER_BASE_URL
		this.oAuthProvider =
			options?.oAuthProvider ?? constructOAuthProvider(config)
		this.userAgentString = createUserAgentString(config)
		const prefixUrl = `${modelerApiUrl}/${API_VERSION}`

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
						beforeRequest: config.middleware ?? [],
					},
				})
		)
		debug(`baseUrl: ${prefixUrl}`)
	}

	private async getHeaders() {
		const authorization = await this.oAuthProvider.getHeaders('MODELER')
		const headers = {
			'content-type': 'application/json',
			...authorization,
			'user-agent': this.userAgentString,
			accept: '*/*',
		}
		return headers
	}

	private decodeResponseOrThrow(res: Response<string>) {
		if (res.statusCode === 200) {
			return res.body
		}
		// 204: No Content
		if (res.statusCode === 204) {
			return '{}'
		}
		const err = new Error(res.statusMessage) as unknown as { code: number }
		err.code = res.statusCode
		throw err
	}

	/**
	 * Adds a new collaborator to a project or modifies the permission level of an existing collaborator.
	 * Note: Only users that are part of the authorized organization (see GET /api/v1/info) and logged in to Web Modeler at least once can be added to a project.
	 * @throws {RESTError}
	 */
	async addCollaborator(req: Dto.CreateCollaboratorDto): Promise<null> {
		const headers = await this.getHeaders()
		return got
			.put(`collaborators`, {
				headers,
				body: JSON.stringify(req),
			})
			.then(this.decodeResponseOrThrow) as Promise<null>
	}

	/**
	 * Searches for collaborators.
	 * filter specifies which fields should match. Only items that match the given fields will be returned.
	 * sort specifies by which fields and direction (ASC/DESC) the result should be sorted.
	 * page specifies the page number to return.
	 * size specifies the number of items per page. The default value is 10.
	 * @throws {RESTError}
	 */
	async searchCollaborators(
		req: Dto.PubSearchDtoProjectCollaboratorDto
	): Promise<Dto.PubSearchResultDtoProjectCollaboratorDto> {
		const headers = await this.getHeaders()
		return got
			.post(`collaborators/search`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.PubSearchResultDtoProjectCollaboratorDto>
	}

	/**
	 *
	 * @throws {RESTError}
	 * @returns
	 */
	async deleteCollaborator({
		email,
		projectId,
	}: {
		projectId: string
		email: string
	}): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`project/${projectId}collaborators/${email}`, {
				headers,
			})
			.then(this.decodeResponseOrThrow) as Promise<null>
	}

	/**
	 * This endpoint creates a file.
	 *
	 * To create a file, specify projectId and/or folderId:
	 *
	 * When only folderId is given, the file will be created in that folder. The folder can be in any project of the same organization.
	 *
	 * When projectId is given and folderId is either null or omitted altogether, the file will be created in the root of the project.
	 *
	 * When projectId and folderId are both given, they must be consistent - i.e. the folder is in the project.
	 *
	 * For connector templates, the following constraints apply:
	 *
	 * The value of content.$schema will be replaced with https://unpkg.com/@camunda/zeebe-element-templates-json-schema/resources/schema.json and validated against it.
	 *
	 * The value of name takes precedence over content.name. In case of mismatch, the latter will be adjusted to match the former automatically.
	 *
	 * The value of content.id will be replaced with the file id generated by Web Modeler.
	 *
	 * The value of content.version is managed by Web Modeler and will be updated automatically.
	 *
	 * Note: The simplePath transforms any occurrences of slashes ("/") in file and folder names into an escape sequence consisting of a backslash followed by a slash ("\/").
	 * This form of escaping facilitates the processing of path-like structures within file and folder names.
	 * @throws {RESTError}
	 */
	async createFile(req: Dto.CreateFileDto): Promise<Dto.FileMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`files`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.FileMetadataDto>
	}

	/**
	 * Retrieves a file.
	 *
	 * Note: The simplePath transforms any occurrences of slashes ("/") in file and folder names into an
	 * escape sequence consisting of a backslash followed by a slash ("\/"). This form of escaping
	 * facilitates the processing of path-like structures within file and folder names.
	 *
	 * Does this throw if it is not found?
	 * @throws {RESTError}
	 */
	async getFile(fileId: string): Promise<Dto.FileDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`files/${fileId}`, {
			headers,
		}).then((res) =>
			JSON.parse(this.decodeResponseOrThrow(res))
		) as Promise<Dto.FileDto>
	}

	/**
	 * Deletes a file.
	 * Note: Deleting a file will also delete other resources attached to the file (comments, call activity/business rule task links, milestones and shares) which might have side-effects.
	 * Deletion of resources is recursive and cannot be undone.
	 * @throws {RESTError}
	 */
	async deleteFile(fileId: string): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`files/${fileId}`, {
				headers,
			})
			.then(this.decodeResponseOrThrow) as Promise<null>
	}

	/**
	 * Updates the content, name, or location of a file, or all at the same time.
	 *
	 * To move a file, specify projectId and/or folderId:
	 * When only folderId is given, the file will be moved to that folder. The folder can be in another project of the same organization.
	 * When projectId is given and folderId is either null or omitted altogether, the file will be moved to the root of the project.
	 * When projectId and folderId are both given, they must be consistent - i.e. the new parent folder is in the new project.
	 * The field revision holds the current revision of the file. This is used for detecting and preventing concurrent modifications.
	 * For connector templates, the following constraints apply:
	 * The value of content.$schema is not updatable.
	 * The value of content.name can only be changed via name.
	 * The value of content.id is not updatable.
	 * The value of content.version is managed by Web Modeler and will be updated automatically.
	 * Note: The simplePath transforms any occurrences of slashes ("/") in file and folder names into an escape sequence consisting of a backslash followed by a slash ("\/").
	 * This form of escaping facilitates the processing of path-like structures within file and folder names.
	 * @throws {RESTError}
	 */
	async updateFile(
		fileId: string,
		update: Dto.UpdateFileDto
	): Promise<Dto.FileMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.patch(`files/${fileId}`, {
				headers,
				body: JSON.stringify(update),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.FileMetadataDto>
	}

	/**
	 * Searches for files.
	 * filter specifies which fields should match. Only items that match the given fields will be returned.
	 *
	 * Note: Date fields need to be specified in a format compatible with java.time.ZonedDateTime; for example 2023-09-20T11:31:20.206801604Z.
	 *
	 * You can use suffixes to match date ranges:
	 *
	 * Modifier	Description
	 * ||/y	Within a year
	 * ||/M	Within a month
	 * ||/w	Within a week
	 * ||/d	Within a day
	 * ||/h	Within an hour
	 * ||/m	Within a minute
	 * ||/s	Within a second
	 *
	 * sort specifies by which fields and direction (ASC/DESC) the result should be sorted.
	 *
	 * page specifies the page number to return.
	 * size specifies the number of items per page. The default value is 10.
	 *
	 * Note: The simplePath transform any occurrences of slashes ("/") in file and folder names into an escape sequence consisting of a backslash followed by a slash ("\/").
	 * This form of escaping facilitates the processing of path-like structures within file and folder names.
	 * @throws {RESTError}
	 */
	async searchFiles(
		req: Dto.PubSearchDtoFileMetadataDto
	): Promise<Dto.PubSearchResultDtoFileMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`files/search`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.PubSearchResultDtoFileMetadataDto>
	}

	/**
	 *
	 * Creates a new folder.
	 *
	 * When only parentId is given, the folder will be created in that folder. The folder can be in any project of the same organization.
	 *
	 * When projectId is given and parentId is either null or omitted altogether, the folder will be created in the root of the project.
	 *
	 * When projectId and parentId are both given, they must be consistent - i.e. the parent folder is in the project.
	 * @throws {RESTError}
	 */
	async createFolder(req: Dto.CreateFolderDto): Promise<Dto.FolderMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`folders`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.FolderMetadataDto>
	}

	/**
	 *
	 * @throws {RESTError}
	 * @returns
	 */
	async getFolder(folderId: string): Promise<Dto.FolderDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`folders/${folderId}`, {
			headers,
		}).then((res) =>
			JSON.parse(this.decodeResponseOrThrow(res))
		) as Promise<Dto.FolderDto>
	}

	/**
	 *
	 * Deletes an empty folder. A folder is considered empty if there are no files in it. Deletion of resources is recursive and cannot be undone.
	 * @throws {RESTError}
	 */
	async deleteFolder(folderId: string): Promise<null> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`folders/${folderId}`, {
				headers,
			})
			.then(this.decodeResponseOrThrow) as Promise<null>
	}

	/**
	 * Updates the name or location of a folder, or both at the same time.
	 *
	 * To move a folder, specify projectId and/or parentId:
	 *
	 * When only parentId is given, the file will be moved to that folder. The folder must keep in the same organization.
	 *
	 * When projectId is given and parentId is either null or omitted altogether, the file will be moved to the root of the project.
	 *
	 * When projectId and parentId are both given, they must be consistent - i.e. the new parent folder is in the new project.
	 * @throws {RESTError}
	 */
	async updateFolder(
		folderId: string,
		update: Dto.UpdateFolderDto
	): Promise<Dto.FolderMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.patch(`folders/${folderId}`, {
				headers,
				body: JSON.stringify(update),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.FolderMetadataDto>
	}

	/**
	 *
	 * @throws {RESTError}
	 */
	async getInfo(): Promise<Dto.InfoDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`info`, {
			headers,
		}).then((res) =>
			JSON.parse(this.decodeResponseOrThrow(res))
		) as Promise<Dto.InfoDto>
	}

	/**
	 *
	 * @throws {RESTError}
	 */
	async createMilestone(
		req: Dto.CreateMilestoneDto
	): Promise<Dto.MilestoneMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`milestones`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.MilestoneMetadataDto>
	}

	/**
	 *
	 * @throws {RESTError}
	 */
	async getMilestone(milestoneId: string): Promise<Dto.MilestoneDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`milestones/${milestoneId}`, {
			headers,
		}).then((res) =>
			JSON.parse(this.decodeResponseOrThrow(res))
		) as Promise<Dto.MilestoneDto>
	}

	/**
	 * Deletion of resources is recursive and cannot be undone.
	 * @throws {RESTError}
	 */
	async deleteMilestone(milestoneId: string) {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`milestones/${milestoneId}`, {
			headers,
		}).then(this.decodeResponseOrThrow)
	}

	/**
	 * Returns a link to a visual comparison between two milestones where the milestone referenced by milestone1Id acts as a baseline to compare the milestone referenced by milestone2Id against.
	 * @throws {RESTError}
	 */
	async getMilestoneComparison(
		milestone1Id: string,
		milestone2Id: string
	): Promise<string> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`milestones/compare/${milestone1Id}...${milestone2Id}`, {
			headers,
		}).then(this.decodeResponseOrThrow) as Promise<string>
	}

	/**
	 * Searches for milestones.
	 *
	 * filter specifies which fields should match. Only items that match the given fields will be returned.
	 *
	 * Note: Date fields need to be specified in a format compatible with java.time.ZonedDateTime; for example 2023-09-20T11:31:20.206801604Z.
	 *
	 * You can use suffixes to match date ranges:
	 *
	 * Modifier	Description
	 * ||/y	Within a year
	 * ||/M	Within a month
	 * ||/w	Within a week
	 * ||/d	Within a day
	 * ||/h	Within an hour
	 * ||/m	Within a minute
	 * ||/s	Within a second
	 * sort specifies by which fields and direction (ASC/DESC) the result should be sorted.
	 *
	 * page specifies the page number to return.
	 *
	 * size specifies the number of items per page. The default value is 10.
	 * @throws {RESTError}
	 */
	async searchMilestones(
		req: Dto.PubSearchDtoMilestoneMetadataDto
	): Promise<Dto.PubSearchResultDtoMilestoneMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`milestones/search`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.PubSearchResultDtoMilestoneMetadataDto>
	}

	/**
	 * Creates a new project. This project will be created without any collaborators, so it will not be visible in the UI by default. To assign collaborators, use `addCollaborator()`.
	 * @throws {RESTError}
	 */
	async createProject(name: string): Promise<Dto.ProjectMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`projects`, {
				headers,
				body: JSON.stringify({ name }),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.ProjectMetadataDto>
	}

	/**
	 *
	 * @throws {RESTError}
	 * @returns
	 */
	async getProject(projectId: string): Promise<Dto.ProjectDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest(`projects/${projectId}`, {
			headers,
		}).then((res) =>
			JSON.parse(this.decodeResponseOrThrow(res))
		) as Promise<Dto.ProjectDto>
	}

	/**
	 * This endpoint deletes an empty project. A project is considered empty if there are no files in it. Deletion of resources is recursive and cannot be undone.
	 * @throws {RESTError}
	 */
	async deleteProject(projectId: string) {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.delete(`projects/${projectId}`, {
				headers,
			})
			.then((res) => JSON.parse(this.decodeResponseOrThrow(res)))
	}

	/**
	 *
	 * @throws {RESTError}
	 */
	async renameProject(
		projectId: string,
		name: string
	): Promise<Dto.ProjectMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.patch(`projects/${projectId}`, {
				headers,
				body: JSON.stringify({ name }),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.ProjectMetadataDto>
	}

	/**
	 * Searches for projects.
	 *
	 * filter specifies which fields should match. Only items that match the given fields will be returned.
	 *
	 * Note: Date fields need to be specified in a format compatible with java.time.ZonedDateTime; for example 2023-09-20T11:31:20.206801604Z.
	 *
	 * You can use suffixes to match date ranges:
	 *
	 * Modifier	Description
	 * ||/y	Within a year
	 * ||/M	Within a month
	 * ||/w	Within a week
	 * ||/d	Within a day
	 * ||/h	Within an hour
	 * ||/m	Within a minute
	 * ||/s	Within a second
	 *
	 * sort specifies by which fields and direction (ASC/DESC) the result should be sorted.
	 *
	 * page specifies the page number to return.
	 *
	 * size specifies the number of items per page. The default value is 10.
	 * @throws {RESTError}
	 */
	async searchProjects(
		req: Dto.PubSearchDtoProjectMetadataDto
	): Promise<Dto.PubSearchResultDtoProjectMetadataDto> {
		const headers = await this.getHeaders()
		const rest = await this.rest
		return rest
			.post(`projects/search`, {
				headers,
				body: JSON.stringify(req),
			})
			.then((res) =>
				JSON.parse(this.decodeResponseOrThrow(res))
			) as Promise<Dto.PubSearchResultDtoProjectMetadataDto>
	}
}
