import * as Zeebe from 'zeebe-node'
import * as Optimize from 'optimize-api-client'
import * as Operate from 'operate-api-client'
import * as Tasklist from 'camunda-tasklist-client'
import * as Console from 'camunda-console-client'

export const C8 = { 
    ZBClient: Zeebe.ZBClient, 
    OptimizeApiClient: Optimize.OptimizeApiClient, 
    OperateApiClient: Operate.OperateApiClient, 
    TasklistApiClient: Tasklist.TasklistApiClient,
    ConsoleApiClient: Console.ConsoleApiClient
}

export { Zeebe, Optimize, Operate, Tasklist, Console }