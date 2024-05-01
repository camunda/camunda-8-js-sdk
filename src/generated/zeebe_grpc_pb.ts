// GENERATED CODE -- DO NOT EDIT!

'use strict'
const grpc = require('grpc')

const zeebe_pb = require('./zeebe_pb.js')

function serialize_gateway_protocol_ActivateJobsRequest(arg) {
	if (!(arg instanceof zeebe_pb.ActivateJobsRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ActivateJobsRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ActivateJobsRequest(buffer_arg) {
	return zeebe_pb.ActivateJobsRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ActivateJobsResponse(arg) {
	if (!(arg instanceof zeebe_pb.ActivateJobsResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ActivateJobsResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ActivateJobsResponse(buffer_arg) {
	return zeebe_pb.ActivateJobsResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ActivatedJob(arg) {
	if (!(arg instanceof zeebe_pb.ActivatedJob)) {
		throw new Error('Expected argument of type gateway_protocol.ActivatedJob')
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ActivatedJob(buffer_arg) {
	return zeebe_pb.ActivatedJob.deserializeBinary(new Uint8Array(buffer_arg))
}

function serialize_gateway_protocol_BroadcastSignalRequest(arg) {
	if (!(arg instanceof zeebe_pb.BroadcastSignalRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.BroadcastSignalRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_BroadcastSignalRequest(buffer_arg) {
	return zeebe_pb.BroadcastSignalRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_BroadcastSignalResponse(arg) {
	if (!(arg instanceof zeebe_pb.BroadcastSignalResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.BroadcastSignalResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_BroadcastSignalResponse(buffer_arg) {
	return zeebe_pb.BroadcastSignalResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CancelProcessInstanceRequest(arg) {
	if (!(arg instanceof zeebe_pb.CancelProcessInstanceRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CancelProcessInstanceRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CancelProcessInstanceRequest(buffer_arg) {
	return zeebe_pb.CancelProcessInstanceRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CancelProcessInstanceResponse(arg) {
	if (!(arg instanceof zeebe_pb.CancelProcessInstanceResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CancelProcessInstanceResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CancelProcessInstanceResponse(
	buffer_arg
) {
	return zeebe_pb.CancelProcessInstanceResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CompleteJobRequest(arg) {
	if (!(arg instanceof zeebe_pb.CompleteJobRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CompleteJobRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CompleteJobRequest(buffer_arg) {
	return zeebe_pb.CompleteJobRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CompleteJobResponse(arg) {
	if (!(arg instanceof zeebe_pb.CompleteJobResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CompleteJobResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CompleteJobResponse(buffer_arg) {
	return zeebe_pb.CompleteJobResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CreateProcessInstanceRequest(arg) {
	if (!(arg instanceof zeebe_pb.CreateProcessInstanceRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CreateProcessInstanceRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CreateProcessInstanceRequest(buffer_arg) {
	return zeebe_pb.CreateProcessInstanceRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CreateProcessInstanceResponse(arg) {
	if (!(arg instanceof zeebe_pb.CreateProcessInstanceResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CreateProcessInstanceResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CreateProcessInstanceResponse(
	buffer_arg
) {
	return zeebe_pb.CreateProcessInstanceResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CreateProcessInstanceWithResultRequest(
	arg
) {
	if (!(arg instanceof zeebe_pb.CreateProcessInstanceWithResultRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CreateProcessInstanceWithResultRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CreateProcessInstanceWithResultRequest(
	buffer_arg
) {
	return zeebe_pb.CreateProcessInstanceWithResultRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_CreateProcessInstanceWithResultResponse(
	arg
) {
	if (!(arg instanceof zeebe_pb.CreateProcessInstanceWithResultResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.CreateProcessInstanceWithResultResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_CreateProcessInstanceWithResultResponse(
	buffer_arg
) {
	return zeebe_pb.CreateProcessInstanceWithResultResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_DeleteResourceRequest(arg) {
	if (!(arg instanceof zeebe_pb.DeleteResourceRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.DeleteResourceRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_DeleteResourceRequest(buffer_arg) {
	return zeebe_pb.DeleteResourceRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_DeleteResourceResponse(arg) {
	if (!(arg instanceof zeebe_pb.DeleteResourceResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.DeleteResourceResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_DeleteResourceResponse(buffer_arg) {
	return zeebe_pb.DeleteResourceResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_DeployProcessRequest(arg) {
	if (!(arg instanceof zeebe_pb.DeployProcessRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.DeployProcessRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_DeployProcessRequest(buffer_arg) {
	return zeebe_pb.DeployProcessRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_DeployProcessResponse(arg) {
	if (!(arg instanceof zeebe_pb.DeployProcessResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.DeployProcessResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_DeployProcessResponse(buffer_arg) {
	return zeebe_pb.DeployProcessResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_DeployResourceRequest(arg) {
	if (!(arg instanceof zeebe_pb.DeployResourceRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.DeployResourceRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_DeployResourceRequest(buffer_arg) {
	return zeebe_pb.DeployResourceRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_DeployResourceResponse(arg) {
	if (!(arg instanceof zeebe_pb.DeployResourceResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.DeployResourceResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_DeployResourceResponse(buffer_arg) {
	return zeebe_pb.DeployResourceResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_EvaluateDecisionRequest(arg) {
	if (!(arg instanceof zeebe_pb.EvaluateDecisionRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.EvaluateDecisionRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_EvaluateDecisionRequest(buffer_arg) {
	return zeebe_pb.EvaluateDecisionRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_EvaluateDecisionResponse(arg) {
	if (!(arg instanceof zeebe_pb.EvaluateDecisionResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.EvaluateDecisionResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_EvaluateDecisionResponse(buffer_arg) {
	return zeebe_pb.EvaluateDecisionResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_FailJobRequest(arg) {
	if (!(arg instanceof zeebe_pb.FailJobRequest)) {
		throw new Error('Expected argument of type gateway_protocol.FailJobRequest')
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_FailJobRequest(buffer_arg) {
	return zeebe_pb.FailJobRequest.deserializeBinary(new Uint8Array(buffer_arg))
}

function serialize_gateway_protocol_FailJobResponse(arg) {
	if (!(arg instanceof zeebe_pb.FailJobResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.FailJobResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_FailJobResponse(buffer_arg) {
	return zeebe_pb.FailJobResponse.deserializeBinary(new Uint8Array(buffer_arg))
}

function serialize_gateway_protocol_MigrateProcessInstanceRequest(arg) {
	if (!(arg instanceof zeebe_pb.MigrateProcessInstanceRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.MigrateProcessInstanceRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_MigrateProcessInstanceRequest(
	buffer_arg
) {
	return zeebe_pb.MigrateProcessInstanceRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_MigrateProcessInstanceResponse(arg) {
	if (!(arg instanceof zeebe_pb.MigrateProcessInstanceResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.MigrateProcessInstanceResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_MigrateProcessInstanceResponse(
	buffer_arg
) {
	return zeebe_pb.MigrateProcessInstanceResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ModifyProcessInstanceRequest(arg) {
	if (!(arg instanceof zeebe_pb.ModifyProcessInstanceRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ModifyProcessInstanceRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ModifyProcessInstanceRequest(buffer_arg) {
	return zeebe_pb.ModifyProcessInstanceRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ModifyProcessInstanceResponse(arg) {
	if (!(arg instanceof zeebe_pb.ModifyProcessInstanceResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ModifyProcessInstanceResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ModifyProcessInstanceResponse(
	buffer_arg
) {
	return zeebe_pb.ModifyProcessInstanceResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_PublishMessageRequest(arg) {
	if (!(arg instanceof zeebe_pb.PublishMessageRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.PublishMessageRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_PublishMessageRequest(buffer_arg) {
	return zeebe_pb.PublishMessageRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_PublishMessageResponse(arg) {
	if (!(arg instanceof zeebe_pb.PublishMessageResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.PublishMessageResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_PublishMessageResponse(buffer_arg) {
	return zeebe_pb.PublishMessageResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ResolveIncidentRequest(arg) {
	if (!(arg instanceof zeebe_pb.ResolveIncidentRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ResolveIncidentRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ResolveIncidentRequest(buffer_arg) {
	return zeebe_pb.ResolveIncidentRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ResolveIncidentResponse(arg) {
	if (!(arg instanceof zeebe_pb.ResolveIncidentResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ResolveIncidentResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ResolveIncidentResponse(buffer_arg) {
	return zeebe_pb.ResolveIncidentResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_SetVariablesRequest(arg) {
	if (!(arg instanceof zeebe_pb.SetVariablesRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.SetVariablesRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_SetVariablesRequest(buffer_arg) {
	return zeebe_pb.SetVariablesRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_SetVariablesResponse(arg) {
	if (!(arg instanceof zeebe_pb.SetVariablesResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.SetVariablesResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_SetVariablesResponse(buffer_arg) {
	return zeebe_pb.SetVariablesResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_StreamActivatedJobsRequest(arg) {
	if (!(arg instanceof zeebe_pb.StreamActivatedJobsRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.StreamActivatedJobsRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_StreamActivatedJobsRequest(buffer_arg) {
	return zeebe_pb.StreamActivatedJobsRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ThrowErrorRequest(arg) {
	if (!(arg instanceof zeebe_pb.ThrowErrorRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ThrowErrorRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ThrowErrorRequest(buffer_arg) {
	return zeebe_pb.ThrowErrorRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_ThrowErrorResponse(arg) {
	if (!(arg instanceof zeebe_pb.ThrowErrorResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.ThrowErrorResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_ThrowErrorResponse(buffer_arg) {
	return zeebe_pb.ThrowErrorResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_TopologyRequest(arg) {
	if (!(arg instanceof zeebe_pb.TopologyRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.TopologyRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_TopologyRequest(buffer_arg) {
	return zeebe_pb.TopologyRequest.deserializeBinary(new Uint8Array(buffer_arg))
}

function serialize_gateway_protocol_TopologyResponse(arg) {
	if (!(arg instanceof zeebe_pb.TopologyResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.TopologyResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_TopologyResponse(buffer_arg) {
	return zeebe_pb.TopologyResponse.deserializeBinary(new Uint8Array(buffer_arg))
}

function serialize_gateway_protocol_UpdateJobRetriesRequest(arg) {
	if (!(arg instanceof zeebe_pb.UpdateJobRetriesRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.UpdateJobRetriesRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_UpdateJobRetriesRequest(buffer_arg) {
	return zeebe_pb.UpdateJobRetriesRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_UpdateJobRetriesResponse(arg) {
	if (!(arg instanceof zeebe_pb.UpdateJobRetriesResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.UpdateJobRetriesResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_UpdateJobRetriesResponse(buffer_arg) {
	return zeebe_pb.UpdateJobRetriesResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_UpdateJobTimeoutRequest(arg) {
	if (!(arg instanceof zeebe_pb.UpdateJobTimeoutRequest)) {
		throw new Error(
			'Expected argument of type gateway_protocol.UpdateJobTimeoutRequest'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_UpdateJobTimeoutRequest(buffer_arg) {
	return zeebe_pb.UpdateJobTimeoutRequest.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

function serialize_gateway_protocol_UpdateJobTimeoutResponse(arg) {
	if (!(arg instanceof zeebe_pb.UpdateJobTimeoutResponse)) {
		throw new Error(
			'Expected argument of type gateway_protocol.UpdateJobTimeoutResponse'
		)
	}
	return Buffer.from(arg.serializeBinary())
}

function deserialize_gateway_protocol_UpdateJobTimeoutResponse(buffer_arg) {
	return zeebe_pb.UpdateJobTimeoutResponse.deserializeBinary(
		new Uint8Array(buffer_arg)
	)
}

const GatewayService = (exports.GatewayService = {
	//
	// Iterates through all known partitions round-robin and activates up to the requested
	// maximum and streams them back to the client as they are activated.
	//
	// Errors:
	// INVALID_ARGUMENT:
	// - type is blank (empty string, null)
	// - worker is blank (empty string, null)
	// - timeout less than 1
	// - maxJobsToActivate is less than 1
	activateJobs: {
		path: '/gateway_protocol.Gateway/ActivateJobs',
		requestStream: false,
		responseStream: true,
		requestType: zeebe_pb.ActivateJobsRequest,
		responseType: zeebe_pb.ActivateJobsResponse,
		requestSerialize: serialize_gateway_protocol_ActivateJobsRequest,
		requestDeserialize: deserialize_gateway_protocol_ActivateJobsRequest,
		responseSerialize: serialize_gateway_protocol_ActivateJobsResponse,
		responseDeserialize: deserialize_gateway_protocol_ActivateJobsResponse,
	},
	//
	// Registers client to a job stream that will stream jobs back to the client as
	// they become activatable.
	//
	// Errors:
	// INVALID_ARGUMENT:
	// - type is blank (empty string, null)
	// - timeout less than 1
	// - If multi-tenancy is enabled, and tenantIds is empty (empty list)
	// - If multi-tenancy is enabled, and an invalid tenant ID is provided. A tenant ID is considered invalid if:
	// - The tenant ID is blank (empty string, null)
	// - The tenant ID is longer than 31 characters
	// - The tenant ID contains anything other than alphanumeric characters, dot (.), dash (-), or underscore (_)
	// - If multi-tenancy is disabled, and tenantIds is not empty (empty list), or has an ID other than <default>
	streamActivatedJobs: {
		path: '/gateway_protocol.Gateway/StreamActivatedJobs',
		requestStream: false,
		responseStream: true,
		requestType: zeebe_pb.StreamActivatedJobsRequest,
		responseType: zeebe_pb.ActivatedJob,
		requestSerialize: serialize_gateway_protocol_StreamActivatedJobsRequest,
		requestDeserialize: deserialize_gateway_protocol_StreamActivatedJobsRequest,
		responseSerialize: serialize_gateway_protocol_ActivatedJob,
		responseDeserialize: deserialize_gateway_protocol_ActivatedJob,
	},
	//
	// Cancels a running process instance
	//
	// Errors:
	// NOT_FOUND:
	// - no process instance exists with the given key
	cancelProcessInstance: {
		path: '/gateway_protocol.Gateway/CancelProcessInstance',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.CancelProcessInstanceRequest,
		responseType: zeebe_pb.CancelProcessInstanceResponse,
		requestSerialize: serialize_gateway_protocol_CancelProcessInstanceRequest,
		requestDeserialize:
			deserialize_gateway_protocol_CancelProcessInstanceRequest,
		responseSerialize: serialize_gateway_protocol_CancelProcessInstanceResponse,
		responseDeserialize:
			deserialize_gateway_protocol_CancelProcessInstanceResponse,
	},
	//
	// Completes a job with the given variables, which allows completing the associated service task.
	//
	// Errors:
	// NOT_FOUND:
	// - no job exists with the given job key. Note that since jobs are removed once completed,
	// it could be that this job did exist at some point.
	//
	// FAILED_PRECONDITION:
	// - the job was marked as failed. In that case, the related incident must be resolved before
	// the job can be activated again and completed.
	completeJob: {
		path: '/gateway_protocol.Gateway/CompleteJob',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.CompleteJobRequest,
		responseType: zeebe_pb.CompleteJobResponse,
		requestSerialize: serialize_gateway_protocol_CompleteJobRequest,
		requestDeserialize: deserialize_gateway_protocol_CompleteJobRequest,
		responseSerialize: serialize_gateway_protocol_CompleteJobResponse,
		responseDeserialize: deserialize_gateway_protocol_CompleteJobResponse,
	},
	//
	// Creates and starts an instance of the specified process. The process definition to use to
	// create the instance can be specified either using its unique key (as returned by
	// DeployProcess), or using the BPMN process ID and a version. Pass -1 as the version to use the
	// latest deployed version. Note that only processes with none start events can be started through
	// this command.
	//
	// Errors:
	// NOT_FOUND:
	// - no process with the given key exists (if processDefinitionKey was given)
	// - no process with the given process ID exists (if bpmnProcessId was given but version was -1)
	// - no process with the given process ID and version exists (if both bpmnProcessId and version were given)
	//
	// FAILED_PRECONDITION:
	// - the process definition does not contain a none start event; only processes with none
	// start event can be started manually.
	//
	// INVALID_ARGUMENT:
	// - the given variables argument is not a valid JSON document; it is expected to be a valid
	// JSON document where the root node is an object.
	createProcessInstance: {
		path: '/gateway_protocol.Gateway/CreateProcessInstance',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.CreateProcessInstanceRequest,
		responseType: zeebe_pb.CreateProcessInstanceResponse,
		requestSerialize: serialize_gateway_protocol_CreateProcessInstanceRequest,
		requestDeserialize:
			deserialize_gateway_protocol_CreateProcessInstanceRequest,
		responseSerialize: serialize_gateway_protocol_CreateProcessInstanceResponse,
		responseDeserialize:
			deserialize_gateway_protocol_CreateProcessInstanceResponse,
	},
	//
	// Behaves similarly to `rpc CreateProcessInstance`, except that a successful response is received when the process completes successfully.
	createProcessInstanceWithResult: {
		path: '/gateway_protocol.Gateway/CreateProcessInstanceWithResult',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.CreateProcessInstanceWithResultRequest,
		responseType: zeebe_pb.CreateProcessInstanceWithResultResponse,
		requestSerialize:
			serialize_gateway_protocol_CreateProcessInstanceWithResultRequest,
		requestDeserialize:
			deserialize_gateway_protocol_CreateProcessInstanceWithResultRequest,
		responseSerialize:
			serialize_gateway_protocol_CreateProcessInstanceWithResultResponse,
		responseDeserialize:
			deserialize_gateway_protocol_CreateProcessInstanceWithResultResponse,
	},
	//
	// Evaluates a decision. The decision to evaluate can be specified either by
	// using its unique key (as returned by DeployResource), or using the decision
	// ID. When using the decision ID, the latest deployed version of the decision
	// is used.
	//
	// Errors:
	// INVALID_ARGUMENT:
	// - no decision with the given key exists (if decisionKey was given)
	// - no decision with the given decision ID exists (if decisionId was given)
	// - both decision ID and decision KEY were provided, or are missing
	evaluateDecision: {
		path: '/gateway_protocol.Gateway/EvaluateDecision',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.EvaluateDecisionRequest,
		responseType: zeebe_pb.EvaluateDecisionResponse,
		requestSerialize: serialize_gateway_protocol_EvaluateDecisionRequest,
		requestDeserialize: deserialize_gateway_protocol_EvaluateDecisionRequest,
		responseSerialize: serialize_gateway_protocol_EvaluateDecisionResponse,
		responseDeserialize: deserialize_gateway_protocol_EvaluateDecisionResponse,
	},
	//
	// Deploys one or more processes to Zeebe. Note that this is an atomic call,
	// i.e. either all processes are deployed, or none of them are.
	//
	// Errors:
	// INVALID_ARGUMENT:
	// - no resources given.
	// - if at least one resource is invalid. A resource is considered invalid if:
	// - the resource data is not deserializable (e.g. detected as BPMN, but it's broken XML)
	// - the process is invalid (e.g. an event-based gateway has an outgoing sequence flow to a task)
	deployProcess: {
		path: '/gateway_protocol.Gateway/DeployProcess',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.DeployProcessRequest,
		responseType: zeebe_pb.DeployProcessResponse,
		requestSerialize: serialize_gateway_protocol_DeployProcessRequest,
		requestDeserialize: deserialize_gateway_protocol_DeployProcessRequest,
		responseSerialize: serialize_gateway_protocol_DeployProcessResponse,
		responseDeserialize: deserialize_gateway_protocol_DeployProcessResponse,
	},
	//
	// Deploys one or more resources (e.g. processes or decision models) to Zeebe.
	// Note that this is an atomic call, i.e. either all resources are deployed, or none of them are.
	//
	// Errors:
	// PERMISSION_DENIED:
	// - if a deployment to an unauthorized tenant is performed
	// INVALID_ARGUMENT:
	// - no resources given.
	// - if at least one resource is invalid. A resource is considered invalid if:
	// - the content is not deserializable (e.g. detected as BPMN, but it's broken XML)
	// - the content is invalid (e.g. an event-based gateway has an outgoing sequence flow to a task)
	// - if multi-tenancy is enabled, and:
	// - a tenant id is not provided
	// - a tenant id with an invalid format is provided
	// - if multi-tenancy is disabled and a tenant id is provided
	deployResource: {
		path: '/gateway_protocol.Gateway/DeployResource',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.DeployResourceRequest,
		responseType: zeebe_pb.DeployResourceResponse,
		requestSerialize: serialize_gateway_protocol_DeployResourceRequest,
		requestDeserialize: deserialize_gateway_protocol_DeployResourceRequest,
		responseSerialize: serialize_gateway_protocol_DeployResourceResponse,
		responseDeserialize: deserialize_gateway_protocol_DeployResourceResponse,
	},
	//
	// Marks the job as failed; if the retries argument is positive, then the job will be immediately
	// activatable again, and a worker could try again to process it. If it is zero or negative however,
	// an incident will be raised, tagged with the given errorMessage, and the job will not be
	// activatable until the incident is resolved.
	//
	// Errors:
	// NOT_FOUND:
	// - no job was found with the given key
	//
	// FAILED_PRECONDITION:
	// - the job was not activated
	// - the job is already in a failed state, i.e. ran out of retries
	failJob: {
		path: '/gateway_protocol.Gateway/FailJob',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.FailJobRequest,
		responseType: zeebe_pb.FailJobResponse,
		requestSerialize: serialize_gateway_protocol_FailJobRequest,
		requestDeserialize: deserialize_gateway_protocol_FailJobRequest,
		responseSerialize: serialize_gateway_protocol_FailJobResponse,
		responseDeserialize: deserialize_gateway_protocol_FailJobResponse,
	},
	//
	// Reports a business error (i.e. non-technical) that occurs while processing a job. The error is handled in the process by an error catch event. If there is no error catch event with the specified errorCode then an incident will be raised instead.
	//
	// Errors:
	// NOT_FOUND:
	// - no job was found with the given key
	//
	// FAILED_PRECONDITION:
	// - the job is not in an activated state
	throwError: {
		path: '/gateway_protocol.Gateway/ThrowError',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.ThrowErrorRequest,
		responseType: zeebe_pb.ThrowErrorResponse,
		requestSerialize: serialize_gateway_protocol_ThrowErrorRequest,
		requestDeserialize: deserialize_gateway_protocol_ThrowErrorRequest,
		responseSerialize: serialize_gateway_protocol_ThrowErrorResponse,
		responseDeserialize: deserialize_gateway_protocol_ThrowErrorResponse,
	},
	//
	// Publishes a single message. Messages are published to specific partitions computed from their
	// correlation keys.
	//
	// Errors:
	// ALREADY_EXISTS:
	// - a message with the same ID was previously published (and is still alive)
	publishMessage: {
		path: '/gateway_protocol.Gateway/PublishMessage',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.PublishMessageRequest,
		responseType: zeebe_pb.PublishMessageResponse,
		requestSerialize: serialize_gateway_protocol_PublishMessageRequest,
		requestDeserialize: deserialize_gateway_protocol_PublishMessageRequest,
		responseSerialize: serialize_gateway_protocol_PublishMessageResponse,
		responseDeserialize: deserialize_gateway_protocol_PublishMessageResponse,
	},
	//
	// Resolves a given incident. This simply marks the incident as resolved; most likely a call to
	// UpdateJobRetries or SetVariables will be necessary to actually resolve the
	// problem, following by this call.
	//
	// Errors:
	// NOT_FOUND:
	// - no incident with the given key exists
	resolveIncident: {
		path: '/gateway_protocol.Gateway/ResolveIncident',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.ResolveIncidentRequest,
		responseType: zeebe_pb.ResolveIncidentResponse,
		requestSerialize: serialize_gateway_protocol_ResolveIncidentRequest,
		requestDeserialize: deserialize_gateway_protocol_ResolveIncidentRequest,
		responseSerialize: serialize_gateway_protocol_ResolveIncidentResponse,
		responseDeserialize: deserialize_gateway_protocol_ResolveIncidentResponse,
	},
	//
	// Updates all the variables of a particular scope (e.g. process instance, flow element instance)
	// from the given JSON document.
	//
	// Errors:
	// NOT_FOUND:
	// - no element with the given elementInstanceKey exists
	// INVALID_ARGUMENT:
	// - the given variables document is not a valid JSON document; valid documents are expected to
	// be JSON documents where the root node is an object.
	setVariables: {
		path: '/gateway_protocol.Gateway/SetVariables',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.SetVariablesRequest,
		responseType: zeebe_pb.SetVariablesResponse,
		requestSerialize: serialize_gateway_protocol_SetVariablesRequest,
		requestDeserialize: deserialize_gateway_protocol_SetVariablesRequest,
		responseSerialize: serialize_gateway_protocol_SetVariablesResponse,
		responseDeserialize: deserialize_gateway_protocol_SetVariablesResponse,
	},
	//
	// Obtains the current topology of the cluster the gateway is part of.
	topology: {
		path: '/gateway_protocol.Gateway/Topology',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.TopologyRequest,
		responseType: zeebe_pb.TopologyResponse,
		requestSerialize: serialize_gateway_protocol_TopologyRequest,
		requestDeserialize: deserialize_gateway_protocol_TopologyRequest,
		responseSerialize: serialize_gateway_protocol_TopologyResponse,
		responseDeserialize: deserialize_gateway_protocol_TopologyResponse,
	},
	//
	// Updates the number of retries a job has left. This is mostly useful for jobs that have run out of
	// retries, should the underlying problem be solved.
	//
	// Errors:
	// NOT_FOUND:
	// - no job exists with the given key
	//
	// INVALID_ARGUMENT:
	// - retries is not greater than 0
	updateJobRetries: {
		path: '/gateway_protocol.Gateway/UpdateJobRetries',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.UpdateJobRetriesRequest,
		responseType: zeebe_pb.UpdateJobRetriesResponse,
		requestSerialize: serialize_gateway_protocol_UpdateJobRetriesRequest,
		requestDeserialize: deserialize_gateway_protocol_UpdateJobRetriesRequest,
		responseSerialize: serialize_gateway_protocol_UpdateJobRetriesResponse,
		responseDeserialize: deserialize_gateway_protocol_UpdateJobRetriesResponse,
	},
	//
	// Modifies the process instance. This is done by activating and/or terminating specific elements of the instance.
	//
	// Errors:
	// NOT_FOUND:
	// - no process instance exists with the given key
	//
	// FAILED_PRECONDITION:
	// - trying to activate element inside of a multi-instance
	//
	// INVALID_ARGUMENT:
	// - activating or terminating unknown element
	// - ancestor of element for activation doesn't exist
	// - scope of variable is unknown
	modifyProcessInstance: {
		path: '/gateway_protocol.Gateway/ModifyProcessInstance',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.ModifyProcessInstanceRequest,
		responseType: zeebe_pb.ModifyProcessInstanceResponse,
		requestSerialize: serialize_gateway_protocol_ModifyProcessInstanceRequest,
		requestDeserialize:
			deserialize_gateway_protocol_ModifyProcessInstanceRequest,
		responseSerialize: serialize_gateway_protocol_ModifyProcessInstanceResponse,
		responseDeserialize:
			deserialize_gateway_protocol_ModifyProcessInstanceResponse,
	},
	//
	// Migrates the process instance to the specified process definition.
	// In simple terms, this is handled by updating the active element's process.
	//
	// Errors:
	// NOT_FOUND:
	// - no process instance exists with the given key, or it is not active
	// - no process definition exists with the given target definition key
	// - no process instance exists with the given key for the tenants the user is authorized to work with.
	//
	// FAILED_PRECONDITION:
	// - not all active elements in the given process instance are mapped to the elements in the target process definition
	// - a mapping instruction changes the type of an element or event
	// - a mapping instruction refers to an unsupported element (i.e. some elements will be supported later on)
	// - a mapping instruction refers to element in unsupported scenarios.
	// (i.e. migration is not supported when process instance or target process elements contains event subscriptions)
	//
	// INVALID_ARGUMENT:
	// - A `sourceElementId` does not refer to an element in the process instance's process definition
	// - A `targetElementId` does not refer to an element in the target process definition
	// - A `sourceElementId` is mapped by multiple mapping instructions.
	// For example, the engine cannot determine how to migrate a process instance when the instructions are: [A->B, A->C].
	migrateProcessInstance: {
		path: '/gateway_protocol.Gateway/MigrateProcessInstance',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.MigrateProcessInstanceRequest,
		responseType: zeebe_pb.MigrateProcessInstanceResponse,
		requestSerialize: serialize_gateway_protocol_MigrateProcessInstanceRequest,
		requestDeserialize:
			deserialize_gateway_protocol_MigrateProcessInstanceRequest,
		responseSerialize:
			serialize_gateway_protocol_MigrateProcessInstanceResponse,
		responseDeserialize:
			deserialize_gateway_protocol_MigrateProcessInstanceResponse,
	},
	//
	// Updates the deadline of a job using the timeout (in ms) provided. This can be used
	// for extending or shortening the job deadline.
	//
	// Errors:
	// NOT_FOUND:
	// - no job exists with the given key
	//
	// INVALID_STATE:
	// - no deadline exists for the given job key
	updateJobTimeout: {
		path: '/gateway_protocol.Gateway/UpdateJobTimeout',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.UpdateJobTimeoutRequest,
		responseType: zeebe_pb.UpdateJobTimeoutResponse,
		requestSerialize: serialize_gateway_protocol_UpdateJobTimeoutRequest,
		requestDeserialize: deserialize_gateway_protocol_UpdateJobTimeoutRequest,
		responseSerialize: serialize_gateway_protocol_UpdateJobTimeoutResponse,
		responseDeserialize: deserialize_gateway_protocol_UpdateJobTimeoutResponse,
	},
	//
	// Deletes a resource from the state. Once a resource has been deleted it cannot
	// be recovered. If the resource needs to be available again, a new deployment
	// of the resource is required.
	//
	// Deleting a process will cancel any running instances of this process
	// definition. New instances of a deleted process are created using
	// the lastest version that hasn't been deleted. Creating a new
	// process instance is impossible when all versions have been
	// deleted.
	//
	// Deleting a decision requirement definitions could cause incidents in process
	// instances referencing these decisions in a business rule task. A decision
	// will be evaluated with the latest version that hasn't been deleted. If all
	// versions of a decision have been deleted the evaluation is rejected.
	//
	// Errors:
	// NOT_FOUND:
	// - No resource exists with the given key
	//
	deleteResource: {
		path: '/gateway_protocol.Gateway/DeleteResource',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.DeleteResourceRequest,
		responseType: zeebe_pb.DeleteResourceResponse,
		requestSerialize: serialize_gateway_protocol_DeleteResourceRequest,
		requestDeserialize: deserialize_gateway_protocol_DeleteResourceRequest,
		responseSerialize: serialize_gateway_protocol_DeleteResourceResponse,
		responseDeserialize: deserialize_gateway_protocol_DeleteResourceResponse,
	},
	//
	// Broadcasts a signal.
	broadcastSignal: {
		path: '/gateway_protocol.Gateway/BroadcastSignal',
		requestStream: false,
		responseStream: false,
		requestType: zeebe_pb.BroadcastSignalRequest,
		responseType: zeebe_pb.BroadcastSignalResponse,
		requestSerialize: serialize_gateway_protocol_BroadcastSignalRequest,
		requestDeserialize: deserialize_gateway_protocol_BroadcastSignalRequest,
		responseSerialize: serialize_gateway_protocol_BroadcastSignalResponse,
		responseDeserialize: deserialize_gateway_protocol_BroadcastSignalResponse,
	},
})

exports.GatewayClient = grpc.makeGenericClientConstructor(GatewayService)
