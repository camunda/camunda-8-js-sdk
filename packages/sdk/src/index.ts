import * as Zeebe from '@jwulf/zeebe'
import * as Optimize from '@jwulf/optimize'
import * as Operate from '@jwulf/operate'
import * as Tasklist from '@jwulf/tasklist'
import * as Console from '@jwulf/console'
import * as Modeler from '@jwulf/modeler'

export const C8 = {
	ZBClient: Zeebe.ZBClient,
	OptimizeApiClient: Optimize.OptimizeApiClient,
	OperateApiClient: Operate.OperateApiClient,
	TasklistApiClient: Tasklist.TasklistApiClient,
	ConsoleApiClient: Console.ConsoleApiClient,
	ModelerApiClient: Modeler.ModelerApiClient,
}

export { Zeebe, Optimize, Operate, Tasklist, Console, Modeler }
