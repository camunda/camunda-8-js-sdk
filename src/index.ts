import * as Admin from './admin'
import { Camunda8 } from './c8'
import { BigIntValue, ChildDto, Int64String, LosslessDto } from './lib'
import * as Modeler from './modeler'
import * as Auth from './oauth'
import * as Operate from './operate'
import * as Optimize from './optimize'
import * as Tasklist from './tasklist'
import * as Zeebe from './zeebe'

export { /*HTTPError,*/ RESTError } from './lib'

export const Dto = { ChildDto, BigIntValue, Int64String, LosslessDto }

export { Admin, Auth, Camunda8, Modeler, Operate, Optimize, Tasklist, Zeebe }
