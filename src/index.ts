import * as Admin from './admin'
import { Camunda8 } from './c8'
import { CamundaRestClient } from './c8/lib/CamundaRestClient'
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
import * as Modeler from './modeler'
import * as Auth from './oauth'
import * as Operate from './operate'
import * as Optimize from './optimize'
import * as Tasklist from './tasklist'
import * as Zeebe from './zeebe'

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

export {
	Admin,
	Auth,
	Camunda8,
	CamundaRestClient,
	Modeler,
	Operate,
	Optimize,
	Tasklist,
	Zeebe,
}
