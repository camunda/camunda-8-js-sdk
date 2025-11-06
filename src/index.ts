export * as Admin from './admin'
export { Camunda8 } from './c8'
export { CamundaRestClient } from './c8/lib/CamundaRestClient'
import {
	BigIntValue,
	BigIntValueArray,
	ChildDto,
	Int64String,
	Int64StringArray,
	LosslessDto,
	createDtoInstance,
} from './lib'
import { CamundaSupportLogger } from './lib/CamundaSupportLogger'

export * as Modeler from './modeler'
export * as Auth from './oauth'
export * as Operate from './operate'
export * as Optimize from './optimize'
export * as Tasklist from './tasklist'
export * as Zeebe from './zeebe'

export { PollingOperation } from './lib/PollingOperation'
export { QuerySubscription } from './lib/QuerySubscription'

export type { CamundaJobWorker } from './c8/lib/CamundaJobWorker'

CamundaSupportLogger.getInstance()

export { CamundaSDKConfiguration } from './lib'

export { HTTPError } from './lib'

/**
 * These are decorators and infrastructure that are used to create Dtos for the Camunda 8 SDK.
 * A `LosslessDto` is used to represent data that is sent and received by the SDK - including job variables and headers.
 * They enable the lossless transformation of `int64` number values between the SDK and the Camunda 8 API —
 * representing the `int64` numbers as either `string` or `bigint` type in the SDK.
 *
 * See the {@link LosslessDto} for more information.
 */
export const Dto = {
	ChildDto,
	BigIntValue,
	BigIntValueArray,
	Int64String,
	Int64StringArray,
	LosslessDto,
	createDtoInstance,
}

export * as CamundaRestApiTypes from './c8/lib/C8Dto'
export { OrchestrationLifters } from './oca/lifters'
