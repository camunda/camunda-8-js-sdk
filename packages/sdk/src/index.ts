import * as Console from '@camunda8/console'
import * as Modeler from '@camunda8/modeler'
import * as Operate from '@camunda8/operate'
import * as Optimize from '@camunda8/optimize'
import * as Tasklist from '@camunda8/tasklist'
import * as Zeebe from '@camunda8/zeebe'

export const C8 = {
	ZBClient: Zeebe.ZBClient,
	OptimizeApiClient: Optimize.OptimizeApiClient,
	OperateApiClient: Operate.OperateApiClient,
	TasklistApiClient: Tasklist.TasklistApiClient,
	ConsoleApiClient: Console.ConsoleApiClient,
	ModelerApiClient: Modeler.ModelerApiClient,
}

export { Console, Modeler, Operate, Optimize, Tasklist, Zeebe }
