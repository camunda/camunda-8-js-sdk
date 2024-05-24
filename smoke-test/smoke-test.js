/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-var-requires */
const { Camunda8 } = require('..')

console.log('Running smoke test...')

const camunda = new Camunda8({
	CAMUNDA_OAUTH_DISABLED: true,
	ZEEBE_ADDRESS: 'localhost:26500', // to be deprecated
	ZEEBE_GRPC_ADDRESS: 'localhost:26500',
	ZEEBE_CLIENT_ID: 'zeebeClientId',
	ZEEBE_CLIENT_SECRET: 'zeebeClientSecret',
	CAMUNDA_CONSOLE_BASE_URL: 'http://localhost:8080',
	CAMUNDA_MODELER_BASE_URL: 'http://localhost:8080',
	CAMUNDA_TASKLIST_BASE_URL: 'http://localhost:8080',
	CAMUNDA_OPERATE_BASE_URL: 'http://localhost:8080',
	CAMUNDA_OPTIMIZE_BASE_URL: 'http://localhost:8080',
})

// console.log(camunda)

const zeebe = camunda.getZeebeGrpcApiClient()

// console.log(zeebe)

const tasklist = camunda.getTasklistApiClient()

// console.log(tasklist)

const modeler = camunda.getModelerApiClient()

// console.log(modeler)

const optimize = camunda.getOptimizeApiClient()

// console.log(optimize)

const admin = camunda.getAdminApiClient()

// console.log(admin)

const operate = camunda.getOperateApiClient()

// console.log(operate)

const zeebeRest = camunda.getZeebeRestClient()

// console.log(zeebeRest)

console.log('Smoke test passed!')
