import { Int64String, LosslessDto } from '../../lib'

import {
	DecisionDeployment,
	DecisionRequirementsDeployment,
	FormDeployment,
	ProcessDeployment,
} from './C8Dto'

export class DeployResourceResponseDto extends LosslessDto {
	@Int64String
	deploymentKey!: string
	deployments!: (
		| { processDefinition: ProcessDeployment }
		| { decisionDefinition: DecisionDeployment }
		| { decisionRequirements: DecisionRequirementsDeployment }
		| { form: FormDeployment }
	)[]
	tenantId!: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Ctor<T> = new (obj: any) => T // eslint-disable-next-line @typescript-eslint/no-explicit-any

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type UnknownRequestBody = Record<string, any> // Interface for requests that return JSON (json=true or undefined)

export interface JsonApiEndpointRequest<
	T extends UnknownRequestBody = UnknownRequestBody,
> extends BaseApiEndpointRequest<T> {
	/** JSON-parse response? Default: true */
	json?: true | undefined
}
// Interface for requests that return raw response (json=false)

export interface RawApiEndpointRequest<
	T extends UnknownRequestBody = UnknownRequestBody,
> extends BaseApiEndpointRequest<T> {
	/** JSON-parse response? */
	json: false
}
// Combined type for use in function signatures

export type ApiEndpointRequest<
	T extends UnknownRequestBody = UnknownRequestBody,
> = JsonApiEndpointRequest<T> | RawApiEndpointRequest<T>

export type SearchSortRequest<T = string> = Array<{
	/** The field to sort by. */
	field: T
	/** The order in which to sort the related field. Default value: ASC */
	order?: 'ASC' | 'DESC'
}> // Base interface with common properties

interface BaseApiEndpointRequest<
	T extends UnknownRequestBody = UnknownRequestBody,
> {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
	/** The URL path of the API endpoint. */
	urlPath: string
	/** The request body. */
	body?: T
	/** TODO: multi-part form support needs to be implemented */
	formData?: FormData
	/** The query parameters. */
	queryParams?: { [key: string]: string | number | boolean | undefined }
	/** The headers. */
	headers?: { [key: string]: string | number | boolean }
	/** A custom JSON parsing function */
	parseJson?: typeof JSON.parse
}
