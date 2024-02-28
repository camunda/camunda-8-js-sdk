import * as Console from './console'
import * as Modeler from './modeler'
import * as Operate from './operate'
import * as Optimize from './optimize'
import * as Tasklist from './tasklist'
import * as Zeebe from './zeebe'

export const C8 = {
	ZBClient: Zeebe.ZBClient,
	OptimizeApiClient: Optimize.OptimizeApiClient,
	OperateApiClient: Operate.OperateApiClient,
	TasklistApiClient: Tasklist.TasklistApiClient,
	ConsoleApiClient: Console.ConsoleApiClient,
	ModelerApiClient: Modeler.ModelerApiClient,
}

export { Console, Modeler, Operate, Optimize, Tasklist, Zeebe }
