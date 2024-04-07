import { expectType } from 'tsd'

import {
	Admin,
	Camunda8,
	Modeler,
	Operate,
	Optimize,
	Tasklist,
	Zeebe,
} from '..'

expectType<Camunda8>(new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }))
expectType<Operate.OperateApiClient>(
	new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }).getOperateApiClient()
)
expectType<Admin.AdminApiClient>(
	new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }).getAdminApiClient()
)
expectType<Modeler.ModelerApiClient>(
	new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }).getModelerApiClient()
)
expectType<Optimize.OptimizeApiClient>(
	new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }).getOptimizeApiClient()
)
expectType<Tasklist.TasklistApiClient>(
	new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }).getTasklistApiClient()
)
expectType<Zeebe.ZeebeGrpcClient>(
	new Camunda8({ CAMUNDA_OAUTH_DISABLED: true }).getZeebeGrpcApiClient()
)
