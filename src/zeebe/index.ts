export { Duration } from 'typed-duration'
export { BpmnParser } from './lib/BpmnParser'
import { ZBSimpleLogger } from './lib/SimpleLogger'
import { ZBJsonLogger } from './lib/ZBJsonLogger'
import { ZBLogger } from './lib/ZBLogger'
import * as Interfaces from './lib/interfaces-1.0'
import * as GrpcInterfaces from './lib/interfaces-grpc-1.0'
import * as PublishedContract from './lib/interfaces-published-contract'

export * from './zb/ZBWorker'
export * from './zb/ZeebeGrpcClient'

/** @namespace */
export const Types = {
	...Interfaces,
	...GrpcInterfaces,
	...PublishedContract,
}

export const Logging = {
	ZBJsonLogger,
	ZBLogger,
	ZBSimpleLogger,
}
