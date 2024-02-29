export interface InfoDto {
	version: string
	authorizedOrganization: string
	createPermission: boolean
	readPermission: boolean
	updatePermission: boolean
	deletePermission: boolean
}

type Role = 'project_admin' | 'editor' | 'viewer' | 'commenter'

export interface CreateCollaboratorDto {
	email: string
	projectId: string
	role: Role
}

export interface ProjectCollaboratorDto {
	name: string
	email: string
	projectId: string
	role: string
}

export interface SortDto {
	field: string
	direction: 'ASC' | 'DESC'
}

export interface PubSearchDtoProjectCollaboratorDto {
	filter: Partial<ProjectCollaboratorDto>
	sort?: SortDto[]
	/** minimum 0 */
	page?: number
	/** minumum 0, maximum 50 */
	size?: number
}

export interface PubSearchResultDtoProjectCollaboratorDto {
	items: ProjectCollaboratorDto[]
	total: number
}

export interface CreateFileDto {
	/** maxLength: 255, minLength: 1 */
	name: string
	/** maxLength: 255, minLength: 1 */
	folderId: string
	/** maxLength: 255, minLength: 1 */
	projectId: string
	content: string
	fileType: string
	pattern: 'bpmn' | 'dmn' | 'form' | 'connector_template'
}

export interface PathElementDto {
	id: string
	name: string
}

export interface UserDto {
	name: string
	email: string
}

export interface FileMetadataDto {
	id: string
	name: string
	projectId: string
	folderId: string
	simplePath: string
	canonicalPath: PathElementDto[]
	revision: number
	type: string
	created: string
	createdBy: UserDto
	updated: string
	updatedBy: UserDto
}

export interface FileDto {
	metadata: FileMetadataDto
	content: string
}

export interface UpdateFileDto {
	/** maxLength: 255, minLength: 1 */
	name: string
	content: string
	revision: number
	/** maxLength: 255, minLength: 1 */
	projectId: string
	/** maxLength: 255, minLength: 1 */
	folderId: string
}

export interface PubSearchDtoFileMetadataDto {
	filter: Partial<FileMetadataDto>
	sort?: SortDto[]
	/**  minimum: 0 */
	page?: number
	/** maximum: 50 minimum: 0 */
	size?: number
}

export interface PubSearchResultDtoFileMetadataDto {
	items: FileMetadataDto[]
	total: number
}

export interface CreateFolderDto {
	/** maxLength: 255 minLength: 1 */
	name: string
	/** maxLength: 255 minLength: 1 */
	projectId: string
	/** maxLength: 255 minLength: 1 */
	parentId: string
}

export interface FolderMetadataDto {
	id: string
	name: string
	projectId: string
	parentId: string
	created: string
	updated: string
	createdBy: UserDto
	updatedBy: UserDto
}

export interface FolderContentDto {
	folders: FolderMetadataDto[]
	files: FileMetadataDto[]
}

export interface FolderDto {
	metadata: FolderMetadataDto
	content: FolderContentDto
}

export interface UpdateFolderDto {
	/** maxLength: 255 minLength: 1 */
	name: string
	/** maxLength: 255 minLength: 1 */
	projectId: string
	/** maxLength: 255 minLength: 1 */
	parentId: string
}

export interface CreateMilestoneDto {
	/** maxLength: 255 minLength: 1 */
	name: string
	/** maxLength: 255 minLength: 1 */
	fileId: string
}

export interface MilestoneMetadataDto {
	id: string
	name: string
	fileId: string
	created: string
	createdBy: UserDto
	updated: string
	updatedBy: UserDto
}

export interface MilestoneDto {
	metadata: MilestoneMetadataDto
	content: string
}

export interface PubSearchDtoMilestoneMetadataDto {
	filter: Partial<MilestoneMetadataDto>
	sort?: SortDto[]
	/** minimum: 0 */
	page?: number
	/** maximum: 50 minimum: 0 */
	size?: number
}

export interface PubSearchResultDtoMilestoneMetadataDto {
	items: MilestoneMetadataDto[]
	total: number
}

export interface ProjectMetadataDto {
	id: string
	name: string
	created: string
	createdBy: UserDto
	updated: string
	updatedBy: UserDto
}

export interface ProjectContent {
	folders: FolderMetadataDto[]
	files: FileMetadataDto[]
}

export interface ProjectDto {
	metadata: ProjectMetadataDto
	content: ProjectContent
}

export interface PubSearchDtoProjectMetadataDto {
	filter: Partial<ProjectMetadataDto>
	sort?: SortDto[]
	/** minimum: 0 */
	page?: number
	/** maximum: 50, minimum: 0 */
	size?: number
}

export interface PubSearchResultDtoProjectMetadataDto {
	items: ProjectMetadataDto[]
	total: number
}
