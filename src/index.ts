import * as Admin from './admin'
import { Camunda8 } from './c8'
import { CamundaRestClient } from './c8/lib/CamundaRestClient'
import {
	BigIntValue,
	ChildDto,
	Int64String,
	LosslessDto,
	createDtoInstance,
} from './lib'
import * as Modeler from './modeler'
import * as Auth from './oauth'
import * as Operate from './operate'
import * as Optimize from './optimize'
import * as Tasklist from './tasklist'
import * as Zeebe from './zeebe'

export { HTTPError } from './lib'

export const Dto = {
	ChildDto,
	BigIntValue,
	Int64String,
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
