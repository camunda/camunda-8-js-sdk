// source: zeebe.proto
/**
 * @fileoverview
 * @enhanceable
 * @suppress {missingRequire} reports error on implicit type usages.
 * @suppress {messageConventions} JS Compiler reports an error if a variable or
 *     field starts with 'MSG_' and isn't a translatable message.
 * @public
 */
// GENERATED CODE -- DO NOT EDIT!
/* eslint-disable */
// @ts-nocheck

var jspb = require('google-protobuf');
var goog = jspb;
var global = (function() {
  if (this) { return this; }
  if (typeof window !== 'undefined') { return window; }
  if (typeof global !== 'undefined') { return global; }
  if (typeof self !== 'undefined') { return self; }
  return Function('return this')();
}.call(null));

goog.exportSymbol('proto.gateway_protocol.ActivateJobsRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.ActivateJobsResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.ActivatedJob', null, global);
goog.exportSymbol('proto.gateway_protocol.BroadcastSignalRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.BroadcastSignalResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.BrokerInfo', null, global);
goog.exportSymbol('proto.gateway_protocol.CancelProcessInstanceRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.CancelProcessInstanceResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.CompleteJobRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.CompleteJobResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.CreateProcessInstanceRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.CreateProcessInstanceResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.CreateProcessInstanceWithResultRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.CreateProcessInstanceWithResultResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.DecisionMetadata', null, global);
goog.exportSymbol('proto.gateway_protocol.DecisionRequirementsMetadata', null, global);
goog.exportSymbol('proto.gateway_protocol.DeleteResourceRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.DeleteResourceResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.DeployProcessRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.DeployProcessResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.DeployResourceRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.DeployResourceResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.Deployment', null, global);
goog.exportSymbol('proto.gateway_protocol.Deployment.MetadataCase', null, global);
goog.exportSymbol('proto.gateway_protocol.EvaluateDecisionRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.EvaluateDecisionResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.EvaluatedDecision', null, global);
goog.exportSymbol('proto.gateway_protocol.EvaluatedDecisionInput', null, global);
goog.exportSymbol('proto.gateway_protocol.EvaluatedDecisionOutput', null, global);
goog.exportSymbol('proto.gateway_protocol.FailJobRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.FailJobResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.FormMetadata', null, global);
goog.exportSymbol('proto.gateway_protocol.MatchedDecisionRule', null, global);
goog.exportSymbol('proto.gateway_protocol.MigrateProcessInstanceRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction', null, global);
goog.exportSymbol('proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan', null, global);
goog.exportSymbol('proto.gateway_protocol.MigrateProcessInstanceResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.ModifyProcessInstanceRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction', null, global);
goog.exportSymbol('proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction', null, global);
goog.exportSymbol('proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction', null, global);
goog.exportSymbol('proto.gateway_protocol.ModifyProcessInstanceResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.Partition', null, global);
goog.exportSymbol('proto.gateway_protocol.Partition.PartitionBrokerHealth', null, global);
goog.exportSymbol('proto.gateway_protocol.Partition.PartitionBrokerRole', null, global);
goog.exportSymbol('proto.gateway_protocol.ProcessInstanceCreationStartInstruction', null, global);
goog.exportSymbol('proto.gateway_protocol.ProcessMetadata', null, global);
goog.exportSymbol('proto.gateway_protocol.ProcessRequestObject', null, global);
goog.exportSymbol('proto.gateway_protocol.PublishMessageRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.PublishMessageResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.ResolveIncidentRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.ResolveIncidentResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.Resource', null, global);
goog.exportSymbol('proto.gateway_protocol.SetVariablesRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.SetVariablesResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.StreamActivatedJobsRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.ThrowErrorRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.ThrowErrorResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.TopologyRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.TopologyResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.UpdateJobRetriesRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.UpdateJobRetriesResponse', null, global);
goog.exportSymbol('proto.gateway_protocol.UpdateJobTimeoutRequest', null, global);
goog.exportSymbol('proto.gateway_protocol.UpdateJobTimeoutResponse', null, global);
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.StreamActivatedJobsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.StreamActivatedJobsRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.StreamActivatedJobsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.StreamActivatedJobsRequest.displayName = 'proto.gateway_protocol.StreamActivatedJobsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ActivateJobsRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.ActivateJobsRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.ActivateJobsRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ActivateJobsRequest.displayName = 'proto.gateway_protocol.ActivateJobsRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ActivateJobsResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.ActivateJobsResponse.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.ActivateJobsResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ActivateJobsResponse.displayName = 'proto.gateway_protocol.ActivateJobsResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ActivatedJob = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ActivatedJob, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ActivatedJob.displayName = 'proto.gateway_protocol.ActivatedJob';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CancelProcessInstanceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.CancelProcessInstanceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CancelProcessInstanceRequest.displayName = 'proto.gateway_protocol.CancelProcessInstanceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CancelProcessInstanceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.CancelProcessInstanceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CancelProcessInstanceResponse.displayName = 'proto.gateway_protocol.CancelProcessInstanceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CompleteJobRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.CompleteJobRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CompleteJobRequest.displayName = 'proto.gateway_protocol.CompleteJobRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CompleteJobResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.CompleteJobResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CompleteJobResponse.displayName = 'proto.gateway_protocol.CompleteJobResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CreateProcessInstanceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.CreateProcessInstanceRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.CreateProcessInstanceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CreateProcessInstanceRequest.displayName = 'proto.gateway_protocol.CreateProcessInstanceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ProcessInstanceCreationStartInstruction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ProcessInstanceCreationStartInstruction.displayName = 'proto.gateway_protocol.ProcessInstanceCreationStartInstruction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CreateProcessInstanceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.CreateProcessInstanceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CreateProcessInstanceResponse.displayName = 'proto.gateway_protocol.CreateProcessInstanceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.CreateProcessInstanceWithResultRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.CreateProcessInstanceWithResultRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CreateProcessInstanceWithResultRequest.displayName = 'proto.gateway_protocol.CreateProcessInstanceWithResultRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.CreateProcessInstanceWithResultResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.CreateProcessInstanceWithResultResponse.displayName = 'proto.gateway_protocol.CreateProcessInstanceWithResultResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.EvaluateDecisionRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.EvaluateDecisionRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.EvaluateDecisionRequest.displayName = 'proto.gateway_protocol.EvaluateDecisionRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.EvaluateDecisionResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.EvaluateDecisionResponse.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.EvaluateDecisionResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.EvaluateDecisionResponse.displayName = 'proto.gateway_protocol.EvaluateDecisionResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.EvaluatedDecision = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.EvaluatedDecision.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.EvaluatedDecision, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.EvaluatedDecision.displayName = 'proto.gateway_protocol.EvaluatedDecision';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.EvaluatedDecisionInput = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.EvaluatedDecisionInput, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.EvaluatedDecisionInput.displayName = 'proto.gateway_protocol.EvaluatedDecisionInput';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.EvaluatedDecisionOutput = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.EvaluatedDecisionOutput, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.EvaluatedDecisionOutput.displayName = 'proto.gateway_protocol.EvaluatedDecisionOutput';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.MatchedDecisionRule = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.MatchedDecisionRule.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.MatchedDecisionRule, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.MatchedDecisionRule.displayName = 'proto.gateway_protocol.MatchedDecisionRule';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DeployProcessRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.DeployProcessRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.DeployProcessRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DeployProcessRequest.displayName = 'proto.gateway_protocol.DeployProcessRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ProcessRequestObject = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ProcessRequestObject, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ProcessRequestObject.displayName = 'proto.gateway_protocol.ProcessRequestObject';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DeployProcessResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.DeployProcessResponse.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.DeployProcessResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DeployProcessResponse.displayName = 'proto.gateway_protocol.DeployProcessResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DeployResourceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.DeployResourceRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.DeployResourceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DeployResourceRequest.displayName = 'proto.gateway_protocol.DeployResourceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.Resource = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.Resource, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.Resource.displayName = 'proto.gateway_protocol.Resource';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DeployResourceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.DeployResourceResponse.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.DeployResourceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DeployResourceResponse.displayName = 'proto.gateway_protocol.DeployResourceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.Deployment = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, proto.gateway_protocol.Deployment.oneofGroups_);
};
goog.inherits(proto.gateway_protocol.Deployment, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.Deployment.displayName = 'proto.gateway_protocol.Deployment';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ProcessMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ProcessMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ProcessMetadata.displayName = 'proto.gateway_protocol.ProcessMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DecisionMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.DecisionMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DecisionMetadata.displayName = 'proto.gateway_protocol.DecisionMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DecisionRequirementsMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.DecisionRequirementsMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DecisionRequirementsMetadata.displayName = 'proto.gateway_protocol.DecisionRequirementsMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.FormMetadata = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.FormMetadata, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.FormMetadata.displayName = 'proto.gateway_protocol.FormMetadata';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.FailJobRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.FailJobRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.FailJobRequest.displayName = 'proto.gateway_protocol.FailJobRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.FailJobResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.FailJobResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.FailJobResponse.displayName = 'proto.gateway_protocol.FailJobResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ThrowErrorRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ThrowErrorRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ThrowErrorRequest.displayName = 'proto.gateway_protocol.ThrowErrorRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ThrowErrorResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ThrowErrorResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ThrowErrorResponse.displayName = 'proto.gateway_protocol.ThrowErrorResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.PublishMessageRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.PublishMessageRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.PublishMessageRequest.displayName = 'proto.gateway_protocol.PublishMessageRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.PublishMessageResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.PublishMessageResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.PublishMessageResponse.displayName = 'proto.gateway_protocol.PublishMessageResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ResolveIncidentRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ResolveIncidentRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ResolveIncidentRequest.displayName = 'proto.gateway_protocol.ResolveIncidentRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ResolveIncidentResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ResolveIncidentResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ResolveIncidentResponse.displayName = 'proto.gateway_protocol.ResolveIncidentResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.TopologyRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.TopologyRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.TopologyRequest.displayName = 'proto.gateway_protocol.TopologyRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.TopologyResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.TopologyResponse.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.TopologyResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.TopologyResponse.displayName = 'proto.gateway_protocol.TopologyResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.BrokerInfo = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.BrokerInfo.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.BrokerInfo, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.BrokerInfo.displayName = 'proto.gateway_protocol.BrokerInfo';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.Partition = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.Partition, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.Partition.displayName = 'proto.gateway_protocol.Partition';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.UpdateJobRetriesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.UpdateJobRetriesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.UpdateJobRetriesRequest.displayName = 'proto.gateway_protocol.UpdateJobRetriesRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.UpdateJobRetriesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.UpdateJobRetriesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.UpdateJobRetriesResponse.displayName = 'proto.gateway_protocol.UpdateJobRetriesResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.UpdateJobTimeoutRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.UpdateJobTimeoutRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.UpdateJobTimeoutRequest.displayName = 'proto.gateway_protocol.UpdateJobTimeoutRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.UpdateJobTimeoutResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.UpdateJobTimeoutResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.UpdateJobTimeoutResponse.displayName = 'proto.gateway_protocol.UpdateJobTimeoutResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.SetVariablesRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.SetVariablesRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.SetVariablesRequest.displayName = 'proto.gateway_protocol.SetVariablesRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.SetVariablesResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.SetVariablesResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.SetVariablesResponse.displayName = 'proto.gateway_protocol.SetVariablesResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ModifyProcessInstanceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.ModifyProcessInstanceRequest.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.ModifyProcessInstanceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ModifyProcessInstanceRequest.displayName = 'proto.gateway_protocol.ModifyProcessInstanceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.displayName = 'proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.displayName = 'proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.displayName = 'proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.ModifyProcessInstanceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.ModifyProcessInstanceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.ModifyProcessInstanceResponse.displayName = 'proto.gateway_protocol.ModifyProcessInstanceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.MigrateProcessInstanceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.MigrateProcessInstanceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.MigrateProcessInstanceRequest.displayName = 'proto.gateway_protocol.MigrateProcessInstanceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.repeatedFields_, null);
};
goog.inherits(proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.displayName = 'proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.displayName = 'proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.MigrateProcessInstanceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.MigrateProcessInstanceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.MigrateProcessInstanceResponse.displayName = 'proto.gateway_protocol.MigrateProcessInstanceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DeleteResourceRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.DeleteResourceRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DeleteResourceRequest.displayName = 'proto.gateway_protocol.DeleteResourceRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.DeleteResourceResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.DeleteResourceResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.DeleteResourceResponse.displayName = 'proto.gateway_protocol.DeleteResourceResponse';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.BroadcastSignalRequest = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.BroadcastSignalRequest, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.BroadcastSignalRequest.displayName = 'proto.gateway_protocol.BroadcastSignalRequest';
}
/**
 * Generated by JsPbCodeGenerator.
 * @param {Array=} opt_data Optional initial data array, typically from a
 * server response, or constructed directly in Javascript. The array is used
 * in place and becomes part of the constructed object. It is not cloned.
 * If no data is provided, the constructed object will be empty, but still
 * valid.
 * @extends {jspb.Message}
 * @constructor
 */
proto.gateway_protocol.BroadcastSignalResponse = function(opt_data) {
  jspb.Message.initialize(this, opt_data, 0, -1, null, null);
};
goog.inherits(proto.gateway_protocol.BroadcastSignalResponse, jspb.Message);
if (goog.DEBUG && !COMPILED) {
  /**
   * @public
   * @override
   */
  proto.gateway_protocol.BroadcastSignalResponse.displayName = 'proto.gateway_protocol.BroadcastSignalResponse';
}

/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.StreamActivatedJobsRequest.repeatedFields_ = [5,6];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.StreamActivatedJobsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.StreamActivatedJobsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.StreamActivatedJobsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, ""),
    worker: jspb.Message.getFieldWithDefault(msg, 2, ""),
    timeout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    fetchvariableList: (f = jspb.Message.getRepeatedField(msg, 5)) == null ? undefined : f,
    tenantidsList: (f = jspb.Message.getRepeatedField(msg, 6)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.StreamActivatedJobsRequest;
  return proto.gateway_protocol.StreamActivatedJobsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.StreamActivatedJobsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setWorker(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimeout(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.addFetchvariable(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.addTenantids(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.StreamActivatedJobsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.StreamActivatedJobsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.StreamActivatedJobsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getWorker();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTimeout();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getFetchvariableList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      5,
      f
    );
  }
  f = message.getTenantidsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      6,
      f
    );
  }
};


/**
 * optional string type = 1;
 * @return {string}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string worker = 2;
 * @return {string}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.getWorker = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.setWorker = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int64 timeout = 3;
 * @return {number}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.getTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.setTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * repeated string fetchVariable = 5;
 * @return {!Array<string>}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.getFetchvariableList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 5));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.setFetchvariableList = function(value) {
  return jspb.Message.setField(this, 5, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.addFetchvariable = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 5, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.clearFetchvariableList = function() {
  return this.setFetchvariableList([]);
};


/**
 * repeated string tenantIds = 6;
 * @return {!Array<string>}
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.getTenantidsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 6));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.setTenantidsList = function(value) {
  return jspb.Message.setField(this, 6, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.addTenantids = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 6, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.StreamActivatedJobsRequest} returns this
 */
proto.gateway_protocol.StreamActivatedJobsRequest.prototype.clearTenantidsList = function() {
  return this.setTenantidsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.ActivateJobsRequest.repeatedFields_ = [5,7];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ActivateJobsRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ActivateJobsRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ActivateJobsRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    type: jspb.Message.getFieldWithDefault(msg, 1, ""),
    worker: jspb.Message.getFieldWithDefault(msg, 2, ""),
    timeout: jspb.Message.getFieldWithDefault(msg, 3, 0),
    maxjobstoactivate: jspb.Message.getFieldWithDefault(msg, 4, 0),
    fetchvariableList: (f = jspb.Message.getRepeatedField(msg, 5)) == null ? undefined : f,
    requesttimeout: jspb.Message.getFieldWithDefault(msg, 6, 0),
    tenantidsList: (f = jspb.Message.getRepeatedField(msg, 7)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ActivateJobsRequest}
 */
proto.gateway_protocol.ActivateJobsRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ActivateJobsRequest;
  return proto.gateway_protocol.ActivateJobsRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ActivateJobsRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ActivateJobsRequest}
 */
proto.gateway_protocol.ActivateJobsRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setWorker(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimeout(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setMaxjobstoactivate(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.addFetchvariable(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRequesttimeout(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.addTenantids(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ActivateJobsRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ActivateJobsRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ActivateJobsRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getWorker();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTimeout();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getMaxjobstoactivate();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getFetchvariableList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      5,
      f
    );
  }
  f = message.getRequesttimeout();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getTenantidsList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      7,
      f
    );
  }
};


/**
 * optional string type = 1;
 * @return {string}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string worker = 2;
 * @return {string}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getWorker = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setWorker = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int64 timeout = 3;
 * @return {number}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int32 maxJobsToActivate = 4;
 * @return {number}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getMaxjobstoactivate = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setMaxjobstoactivate = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * repeated string fetchVariable = 5;
 * @return {!Array<string>}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getFetchvariableList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 5));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setFetchvariableList = function(value) {
  return jspb.Message.setField(this, 5, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.addFetchvariable = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 5, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.clearFetchvariableList = function() {
  return this.setFetchvariableList([]);
};


/**
 * optional int64 requestTimeout = 6;
 * @return {number}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getRequesttimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setRequesttimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * repeated string tenantIds = 7;
 * @return {!Array<string>}
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.getTenantidsList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 7));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.setTenantidsList = function(value) {
  return jspb.Message.setField(this, 7, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.addTenantids = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 7, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.ActivateJobsRequest} returns this
 */
proto.gateway_protocol.ActivateJobsRequest.prototype.clearTenantidsList = function() {
  return this.setTenantidsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.ActivateJobsResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ActivateJobsResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ActivateJobsResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ActivateJobsResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ActivateJobsResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    jobsList: jspb.Message.toObjectList(msg.getJobsList(),
    proto.gateway_protocol.ActivatedJob.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ActivateJobsResponse}
 */
proto.gateway_protocol.ActivateJobsResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ActivateJobsResponse;
  return proto.gateway_protocol.ActivateJobsResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ActivateJobsResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ActivateJobsResponse}
 */
proto.gateway_protocol.ActivateJobsResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gateway_protocol.ActivatedJob;
      reader.readMessage(value,proto.gateway_protocol.ActivatedJob.deserializeBinaryFromReader);
      msg.addJobs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ActivateJobsResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ActivateJobsResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ActivateJobsResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ActivateJobsResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJobsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gateway_protocol.ActivatedJob.serializeBinaryToWriter
    );
  }
};


/**
 * repeated ActivatedJob jobs = 1;
 * @return {!Array<!proto.gateway_protocol.ActivatedJob>}
 */
proto.gateway_protocol.ActivateJobsResponse.prototype.getJobsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ActivatedJob>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ActivatedJob, 1));
};


/**
 * @param {!Array<!proto.gateway_protocol.ActivatedJob>} value
 * @return {!proto.gateway_protocol.ActivateJobsResponse} returns this
*/
proto.gateway_protocol.ActivateJobsResponse.prototype.setJobsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gateway_protocol.ActivatedJob=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ActivatedJob}
 */
proto.gateway_protocol.ActivateJobsResponse.prototype.addJobs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gateway_protocol.ActivatedJob, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.ActivateJobsResponse} returns this
 */
proto.gateway_protocol.ActivateJobsResponse.prototype.clearJobsList = function() {
  return this.setJobsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ActivatedJob.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ActivatedJob.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ActivatedJob} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ActivatedJob.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, 0),
    type: jspb.Message.getFieldWithDefault(msg, 2, ""),
    processinstancekey: jspb.Message.getFieldWithDefault(msg, 3, 0),
    bpmnprocessid: jspb.Message.getFieldWithDefault(msg, 4, ""),
    processdefinitionversion: jspb.Message.getFieldWithDefault(msg, 5, 0),
    processdefinitionkey: jspb.Message.getFieldWithDefault(msg, 6, 0),
    elementid: jspb.Message.getFieldWithDefault(msg, 7, ""),
    elementinstancekey: jspb.Message.getFieldWithDefault(msg, 8, 0),
    customheaders: jspb.Message.getFieldWithDefault(msg, 9, ""),
    worker: jspb.Message.getFieldWithDefault(msg, 10, ""),
    retries: jspb.Message.getFieldWithDefault(msg, 11, 0),
    deadline: jspb.Message.getFieldWithDefault(msg, 12, 0),
    variables: jspb.Message.getFieldWithDefault(msg, 13, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 14, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ActivatedJob}
 */
proto.gateway_protocol.ActivatedJob.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ActivatedJob;
  return proto.gateway_protocol.ActivatedJob.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ActivatedJob} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ActivatedJob}
 */
proto.gateway_protocol.ActivatedJob.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setType(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessinstancekey(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setBpmnprocessid(value);
      break;
    case 5:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setProcessdefinitionversion(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessdefinitionkey(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setElementid(value);
      break;
    case 8:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setElementinstancekey(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setCustomheaders(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.setWorker(value);
      break;
    case 11:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setRetries(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDeadline(value);
      break;
    case 13:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 14:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ActivatedJob.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ActivatedJob.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ActivatedJob} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ActivatedJob.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getType();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getProcessinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getBpmnprocessid();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getProcessdefinitionversion();
  if (f !== 0) {
    writer.writeInt32(
      5,
      f
    );
  }
  f = message.getProcessdefinitionkey();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getElementid();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getElementinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      8,
      f
    );
  }
  f = message.getCustomheaders();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getWorker();
  if (f.length > 0) {
    writer.writeString(
      10,
      f
    );
  }
  f = message.getRetries();
  if (f !== 0) {
    writer.writeInt32(
      11,
      f
    );
  }
  f = message.getDeadline();
  if (f !== 0) {
    writer.writeInt64(
      12,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      13,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      14,
      f
    );
  }
};


/**
 * optional int64 key = 1;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getKey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setKey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string type = 2;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getType = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setType = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int64 processInstanceKey = 3;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getProcessinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setProcessinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string bpmnProcessId = 4;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getBpmnprocessid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setBpmnprocessid = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional int32 processDefinitionVersion = 5;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getProcessdefinitionversion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 5, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setProcessdefinitionversion = function(value) {
  return jspb.Message.setProto3IntField(this, 5, value);
};


/**
 * optional int64 processDefinitionKey = 6;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getProcessdefinitionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setProcessdefinitionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string elementId = 7;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getElementid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setElementid = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * optional int64 elementInstanceKey = 8;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getElementinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 8, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setElementinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 8, value);
};


/**
 * optional string customHeaders = 9;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getCustomheaders = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setCustomheaders = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional string worker = 10;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getWorker = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setWorker = function(value) {
  return jspb.Message.setProto3StringField(this, 10, value);
};


/**
 * optional int32 retries = 11;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getRetries = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 11, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setRetries = function(value) {
  return jspb.Message.setProto3IntField(this, 11, value);
};


/**
 * optional int64 deadline = 12;
 * @return {number}
 */
proto.gateway_protocol.ActivatedJob.prototype.getDeadline = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 12, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setDeadline = function(value) {
  return jspb.Message.setProto3IntField(this, 12, value);
};


/**
 * optional string variables = 13;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 13, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 13, value);
};


/**
 * optional string tenantId = 14;
 * @return {string}
 */
proto.gateway_protocol.ActivatedJob.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 14, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ActivatedJob} returns this
 */
proto.gateway_protocol.ActivatedJob.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 14, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CancelProcessInstanceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CancelProcessInstanceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CancelProcessInstanceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CancelProcessInstanceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    processinstancekey: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CancelProcessInstanceRequest}
 */
proto.gateway_protocol.CancelProcessInstanceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CancelProcessInstanceRequest;
  return proto.gateway_protocol.CancelProcessInstanceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CancelProcessInstanceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CancelProcessInstanceRequest}
 */
proto.gateway_protocol.CancelProcessInstanceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessinstancekey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CancelProcessInstanceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CancelProcessInstanceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CancelProcessInstanceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CancelProcessInstanceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 processInstanceKey = 1;
 * @return {number}
 */
proto.gateway_protocol.CancelProcessInstanceRequest.prototype.getProcessinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CancelProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CancelProcessInstanceRequest.prototype.setProcessinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CancelProcessInstanceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CancelProcessInstanceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CancelProcessInstanceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CancelProcessInstanceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CancelProcessInstanceResponse}
 */
proto.gateway_protocol.CancelProcessInstanceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CancelProcessInstanceResponse;
  return proto.gateway_protocol.CancelProcessInstanceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CancelProcessInstanceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CancelProcessInstanceResponse}
 */
proto.gateway_protocol.CancelProcessInstanceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CancelProcessInstanceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CancelProcessInstanceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CancelProcessInstanceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CancelProcessInstanceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CompleteJobRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CompleteJobRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CompleteJobRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CompleteJobRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    jobkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    variables: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CompleteJobRequest}
 */
proto.gateway_protocol.CompleteJobRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CompleteJobRequest;
  return proto.gateway_protocol.CompleteJobRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CompleteJobRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CompleteJobRequest}
 */
proto.gateway_protocol.CompleteJobRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJobkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CompleteJobRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CompleteJobRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CompleteJobRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CompleteJobRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJobkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional int64 jobKey = 1;
 * @return {number}
 */
proto.gateway_protocol.CompleteJobRequest.prototype.getJobkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CompleteJobRequest} returns this
 */
proto.gateway_protocol.CompleteJobRequest.prototype.setJobkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string variables = 2;
 * @return {string}
 */
proto.gateway_protocol.CompleteJobRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CompleteJobRequest} returns this
 */
proto.gateway_protocol.CompleteJobRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CompleteJobResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CompleteJobResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CompleteJobResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CompleteJobResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CompleteJobResponse}
 */
proto.gateway_protocol.CompleteJobResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CompleteJobResponse;
  return proto.gateway_protocol.CompleteJobResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CompleteJobResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CompleteJobResponse}
 */
proto.gateway_protocol.CompleteJobResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CompleteJobResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CompleteJobResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CompleteJobResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CompleteJobResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.CreateProcessInstanceRequest.repeatedFields_ = [5];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CreateProcessInstanceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CreateProcessInstanceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    processdefinitionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    bpmnprocessid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    version: jspb.Message.getFieldWithDefault(msg, 3, 0),
    variables: jspb.Message.getFieldWithDefault(msg, 4, ""),
    startinstructionsList: jspb.Message.toObjectList(msg.getStartinstructionsList(),
    proto.gateway_protocol.ProcessInstanceCreationStartInstruction.toObject, includeInstance),
    tenantid: jspb.Message.getFieldWithDefault(msg, 6, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CreateProcessInstanceRequest;
  return proto.gateway_protocol.CreateProcessInstanceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CreateProcessInstanceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessdefinitionkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBpmnprocessid(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 5:
      var value = new proto.gateway_protocol.ProcessInstanceCreationStartInstruction;
      reader.readMessage(value,proto.gateway_protocol.ProcessInstanceCreationStartInstruction.deserializeBinaryFromReader);
      msg.addStartinstructions(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CreateProcessInstanceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CreateProcessInstanceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessdefinitionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getBpmnprocessid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getStartinstructionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      5,
      f,
      proto.gateway_protocol.ProcessInstanceCreationStartInstruction.serializeBinaryToWriter
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * optional int64 processDefinitionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.getProcessdefinitionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.setProcessdefinitionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string bpmnProcessId = 2;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.getBpmnprocessid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.setBpmnprocessid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 version = 3;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string variables = 4;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * repeated ProcessInstanceCreationStartInstruction startInstructions = 5;
 * @return {!Array<!proto.gateway_protocol.ProcessInstanceCreationStartInstruction>}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.getStartinstructionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ProcessInstanceCreationStartInstruction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ProcessInstanceCreationStartInstruction, 5));
};


/**
 * @param {!Array<!proto.gateway_protocol.ProcessInstanceCreationStartInstruction>} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
*/
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.setStartinstructionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 5, value);
};


/**
 * @param {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.addStartinstructions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 5, opt_value, proto.gateway_protocol.ProcessInstanceCreationStartInstruction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.clearStartinstructionsList = function() {
  return this.setStartinstructionsList([]);
};


/**
 * optional string tenantId = 6;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceRequest.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ProcessInstanceCreationStartInstruction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.toObject = function(includeInstance, msg) {
  var f, obj = {
    elementid: jspb.Message.getFieldWithDefault(msg, 1, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction}
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ProcessInstanceCreationStartInstruction;
  return proto.gateway_protocol.ProcessInstanceCreationStartInstruction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction}
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setElementid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ProcessInstanceCreationStartInstruction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getElementid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
};


/**
 * optional string elementId = 1;
 * @return {string}
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.prototype.getElementid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ProcessInstanceCreationStartInstruction} returns this
 */
proto.gateway_protocol.ProcessInstanceCreationStartInstruction.prototype.setElementid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CreateProcessInstanceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CreateProcessInstanceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    processdefinitionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    bpmnprocessid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    version: jspb.Message.getFieldWithDefault(msg, 3, 0),
    processinstancekey: jspb.Message.getFieldWithDefault(msg, 4, 0),
    tenantid: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CreateProcessInstanceResponse;
  return proto.gateway_protocol.CreateProcessInstanceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CreateProcessInstanceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessdefinitionkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBpmnprocessid(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessinstancekey(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CreateProcessInstanceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CreateProcessInstanceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessdefinitionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getBpmnprocessid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getProcessinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional int64 processDefinitionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.getProcessdefinitionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.setProcessdefinitionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string bpmnProcessId = 2;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.getBpmnprocessid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.setBpmnprocessid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 version = 3;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 processInstanceKey = 4;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.getProcessinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.setProcessinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string tenantId = 5;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceResponse.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CreateProcessInstanceWithResultRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    request: (f = msg.getRequest()) && proto.gateway_protocol.CreateProcessInstanceRequest.toObject(includeInstance, f),
    requesttimeout: jspb.Message.getFieldWithDefault(msg, 2, 0),
    fetchvariablesList: (f = jspb.Message.getRepeatedField(msg, 3)) == null ? undefined : f
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CreateProcessInstanceWithResultRequest;
  return proto.gateway_protocol.CreateProcessInstanceWithResultRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gateway_protocol.CreateProcessInstanceRequest;
      reader.readMessage(value,proto.gateway_protocol.CreateProcessInstanceRequest.deserializeBinaryFromReader);
      msg.setRequest(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRequesttimeout(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.addFetchvariables(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CreateProcessInstanceWithResultRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRequest();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gateway_protocol.CreateProcessInstanceRequest.serializeBinaryToWriter
    );
  }
  f = message.getRequesttimeout();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getFetchvariablesList();
  if (f.length > 0) {
    writer.writeRepeatedString(
      3,
      f
    );
  }
};


/**
 * optional CreateProcessInstanceRequest request = 1;
 * @return {?proto.gateway_protocol.CreateProcessInstanceRequest}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.getRequest = function() {
  return /** @type{?proto.gateway_protocol.CreateProcessInstanceRequest} */ (
    jspb.Message.getWrapperField(this, proto.gateway_protocol.CreateProcessInstanceRequest, 1));
};


/**
 * @param {?proto.gateway_protocol.CreateProcessInstanceRequest|undefined} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} returns this
*/
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.setRequest = function(value) {
  return jspb.Message.setWrapperField(this, 1, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.clearRequest = function() {
  return this.setRequest(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.hasRequest = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional int64 requestTimeout = 2;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.getRequesttimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.setRequesttimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated string fetchVariables = 3;
 * @return {!Array<string>}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.getFetchvariablesList = function() {
  return /** @type {!Array<string>} */ (jspb.Message.getRepeatedField(this, 3));
};


/**
 * @param {!Array<string>} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.setFetchvariablesList = function(value) {
  return jspb.Message.setField(this, 3, value || []);
};


/**
 * @param {string} value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.addFetchvariables = function(value, opt_index) {
  return jspb.Message.addToRepeatedField(this, 3, value, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultRequest} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultRequest.prototype.clearFetchvariablesList = function() {
  return this.setFetchvariablesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.CreateProcessInstanceWithResultResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    processdefinitionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    bpmnprocessid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    version: jspb.Message.getFieldWithDefault(msg, 3, 0),
    processinstancekey: jspb.Message.getFieldWithDefault(msg, 4, 0),
    variables: jspb.Message.getFieldWithDefault(msg, 5, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 6, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.CreateProcessInstanceWithResultResponse;
  return proto.gateway_protocol.CreateProcessInstanceWithResultResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessdefinitionkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setBpmnprocessid(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessinstancekey(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.CreateProcessInstanceWithResultResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessdefinitionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getBpmnprocessid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getProcessinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * optional int64 processDefinitionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.getProcessdefinitionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.setProcessdefinitionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string bpmnProcessId = 2;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.getBpmnprocessid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.setBpmnprocessid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 version = 3;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 processInstanceKey = 4;
 * @return {number}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.getProcessinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.setProcessinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string variables = 5;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string tenantId = 6;
 * @return {string}
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.CreateProcessInstanceWithResultResponse} returns this
 */
proto.gateway_protocol.CreateProcessInstanceWithResultResponse.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.EvaluateDecisionRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.EvaluateDecisionRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluateDecisionRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    decisionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    decisionid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    variables: jspb.Message.getFieldWithDefault(msg, 3, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.EvaluateDecisionRequest}
 */
proto.gateway_protocol.EvaluateDecisionRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.EvaluateDecisionRequest;
  return proto.gateway_protocol.EvaluateDecisionRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.EvaluateDecisionRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.EvaluateDecisionRequest}
 */
proto.gateway_protocol.EvaluateDecisionRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionid(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.EvaluateDecisionRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.EvaluateDecisionRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluateDecisionRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDecisionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getDecisionid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional int64 decisionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.getDecisionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluateDecisionRequest} returns this
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.setDecisionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string decisionId = 2;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.getDecisionid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionRequest} returns this
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.setDecisionid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string variables = 3;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionRequest} returns this
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string tenantId = 4;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionRequest} returns this
 */
proto.gateway_protocol.EvaluateDecisionRequest.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.EvaluateDecisionResponse.repeatedFields_ = [8];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.EvaluateDecisionResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.EvaluateDecisionResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluateDecisionResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    decisionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    decisionid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    decisionname: jspb.Message.getFieldWithDefault(msg, 3, ""),
    decisionversion: jspb.Message.getFieldWithDefault(msg, 4, 0),
    decisionrequirementsid: jspb.Message.getFieldWithDefault(msg, 5, ""),
    decisionrequirementskey: jspb.Message.getFieldWithDefault(msg, 6, 0),
    decisionoutput: jspb.Message.getFieldWithDefault(msg, 7, ""),
    evaluateddecisionsList: jspb.Message.toObjectList(msg.getEvaluateddecisionsList(),
    proto.gateway_protocol.EvaluatedDecision.toObject, includeInstance),
    faileddecisionid: jspb.Message.getFieldWithDefault(msg, 9, ""),
    failuremessage: jspb.Message.getFieldWithDefault(msg, 10, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 11, ""),
    decisioninstancekey: jspb.Message.getFieldWithDefault(msg, 12, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse}
 */
proto.gateway_protocol.EvaluateDecisionResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.EvaluateDecisionResponse;
  return proto.gateway_protocol.EvaluateDecisionResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.EvaluateDecisionResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse}
 */
proto.gateway_protocol.EvaluateDecisionResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionid(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionname(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDecisionversion(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionrequirementsid(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionrequirementskey(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionoutput(value);
      break;
    case 8:
      var value = new proto.gateway_protocol.EvaluatedDecision;
      reader.readMessage(value,proto.gateway_protocol.EvaluatedDecision.deserializeBinaryFromReader);
      msg.addEvaluateddecisions(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setFaileddecisionid(value);
      break;
    case 10:
      var value = /** @type {string} */ (reader.readString());
      msg.setFailuremessage(value);
      break;
    case 11:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    case 12:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisioninstancekey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.EvaluateDecisionResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.EvaluateDecisionResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluateDecisionResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDecisionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getDecisionid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getDecisionname();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDecisionversion();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getDecisionrequirementsid();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getDecisionrequirementskey();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getDecisionoutput();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
  f = message.getEvaluateddecisionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      8,
      f,
      proto.gateway_protocol.EvaluatedDecision.serializeBinaryToWriter
    );
  }
  f = message.getFaileddecisionid();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
  f = message.getFailuremessage();
  if (f.length > 0) {
    writer.writeString(
      10,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      11,
      f
    );
  }
  f = message.getDecisioninstancekey();
  if (f !== 0) {
    writer.writeInt64(
      12,
      f
    );
  }
};


/**
 * optional int64 decisionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string decisionId = 2;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string decisionName = 3;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionname = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int32 decisionVersion = 4;
 * @return {number}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionversion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionversion = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string decisionRequirementsId = 5;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionrequirementsid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionrequirementsid = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional int64 decisionRequirementsKey = 6;
 * @return {number}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionrequirementskey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionrequirementskey = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string decisionOutput = 7;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisionoutput = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisionoutput = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};


/**
 * repeated EvaluatedDecision evaluatedDecisions = 8;
 * @return {!Array<!proto.gateway_protocol.EvaluatedDecision>}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getEvaluateddecisionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.EvaluatedDecision>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.EvaluatedDecision, 8));
};


/**
 * @param {!Array<!proto.gateway_protocol.EvaluatedDecision>} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
*/
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setEvaluateddecisionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 8, value);
};


/**
 * @param {!proto.gateway_protocol.EvaluatedDecision=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.EvaluatedDecision}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.addEvaluateddecisions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 8, opt_value, proto.gateway_protocol.EvaluatedDecision, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.clearEvaluateddecisionsList = function() {
  return this.setEvaluateddecisionsList([]);
};


/**
 * optional string failedDecisionId = 9;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getFaileddecisionid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setFaileddecisionid = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};


/**
 * optional string failureMessage = 10;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getFailuremessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 10, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setFailuremessage = function(value) {
  return jspb.Message.setProto3StringField(this, 10, value);
};


/**
 * optional string tenantId = 11;
 * @return {string}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 11, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 11, value);
};


/**
 * optional int64 decisionInstanceKey = 12;
 * @return {number}
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.getDecisioninstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 12, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluateDecisionResponse} returns this
 */
proto.gateway_protocol.EvaluateDecisionResponse.prototype.setDecisioninstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 12, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.EvaluatedDecision.repeatedFields_ = [7,8];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.EvaluatedDecision.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.EvaluatedDecision} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluatedDecision.toObject = function(includeInstance, msg) {
  var f, obj = {
    decisionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    decisionid: jspb.Message.getFieldWithDefault(msg, 2, ""),
    decisionname: jspb.Message.getFieldWithDefault(msg, 3, ""),
    decisionversion: jspb.Message.getFieldWithDefault(msg, 4, 0),
    decisiontype: jspb.Message.getFieldWithDefault(msg, 5, ""),
    decisionoutput: jspb.Message.getFieldWithDefault(msg, 6, ""),
    matchedrulesList: jspb.Message.toObjectList(msg.getMatchedrulesList(),
    proto.gateway_protocol.MatchedDecisionRule.toObject, includeInstance),
    evaluatedinputsList: jspb.Message.toObjectList(msg.getEvaluatedinputsList(),
    proto.gateway_protocol.EvaluatedDecisionInput.toObject, includeInstance),
    tenantid: jspb.Message.getFieldWithDefault(msg, 9, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.EvaluatedDecision}
 */
proto.gateway_protocol.EvaluatedDecision.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.EvaluatedDecision;
  return proto.gateway_protocol.EvaluatedDecision.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.EvaluatedDecision} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.EvaluatedDecision}
 */
proto.gateway_protocol.EvaluatedDecision.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionid(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionname(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setDecisionversion(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisiontype(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setDecisionoutput(value);
      break;
    case 7:
      var value = new proto.gateway_protocol.MatchedDecisionRule;
      reader.readMessage(value,proto.gateway_protocol.MatchedDecisionRule.deserializeBinaryFromReader);
      msg.addMatchedrules(value);
      break;
    case 8:
      var value = new proto.gateway_protocol.EvaluatedDecisionInput;
      reader.readMessage(value,proto.gateway_protocol.EvaluatedDecisionInput.deserializeBinaryFromReader);
      msg.addEvaluatedinputs(value);
      break;
    case 9:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.EvaluatedDecision.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.EvaluatedDecision} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluatedDecision.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDecisionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getDecisionid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getDecisionname();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getDecisionversion();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getDecisiontype();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getDecisionoutput();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
  f = message.getMatchedrulesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      7,
      f,
      proto.gateway_protocol.MatchedDecisionRule.serializeBinaryToWriter
    );
  }
  f = message.getEvaluatedinputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      8,
      f,
      proto.gateway_protocol.EvaluatedDecisionInput.serializeBinaryToWriter
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      9,
      f
    );
  }
};


/**
 * optional int64 decisionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getDecisionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setDecisionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string decisionId = 2;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getDecisionid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setDecisionid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string decisionName = 3;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getDecisionname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setDecisionname = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int32 decisionVersion = 4;
 * @return {number}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getDecisionversion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setDecisionversion = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string decisionType = 5;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getDecisiontype = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setDecisiontype = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string decisionOutput = 6;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getDecisionoutput = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setDecisionoutput = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};


/**
 * repeated MatchedDecisionRule matchedRules = 7;
 * @return {!Array<!proto.gateway_protocol.MatchedDecisionRule>}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getMatchedrulesList = function() {
  return /** @type{!Array<!proto.gateway_protocol.MatchedDecisionRule>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.MatchedDecisionRule, 7));
};


/**
 * @param {!Array<!proto.gateway_protocol.MatchedDecisionRule>} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
*/
proto.gateway_protocol.EvaluatedDecision.prototype.setMatchedrulesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 7, value);
};


/**
 * @param {!proto.gateway_protocol.MatchedDecisionRule=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.MatchedDecisionRule}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.addMatchedrules = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 7, opt_value, proto.gateway_protocol.MatchedDecisionRule, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.clearMatchedrulesList = function() {
  return this.setMatchedrulesList([]);
};


/**
 * repeated EvaluatedDecisionInput evaluatedInputs = 8;
 * @return {!Array<!proto.gateway_protocol.EvaluatedDecisionInput>}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getEvaluatedinputsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.EvaluatedDecisionInput>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.EvaluatedDecisionInput, 8));
};


/**
 * @param {!Array<!proto.gateway_protocol.EvaluatedDecisionInput>} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
*/
proto.gateway_protocol.EvaluatedDecision.prototype.setEvaluatedinputsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 8, value);
};


/**
 * @param {!proto.gateway_protocol.EvaluatedDecisionInput=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.EvaluatedDecisionInput}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.addEvaluatedinputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 8, opt_value, proto.gateway_protocol.EvaluatedDecisionInput, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.clearEvaluatedinputsList = function() {
  return this.setEvaluatedinputsList([]);
};


/**
 * optional string tenantId = 9;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecision.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 9, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecision} returns this
 */
proto.gateway_protocol.EvaluatedDecision.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 9, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.EvaluatedDecisionInput.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.EvaluatedDecisionInput} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluatedDecisionInput.toObject = function(includeInstance, msg) {
  var f, obj = {
    inputid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    inputname: jspb.Message.getFieldWithDefault(msg, 2, ""),
    inputvalue: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.EvaluatedDecisionInput}
 */
proto.gateway_protocol.EvaluatedDecisionInput.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.EvaluatedDecisionInput;
  return proto.gateway_protocol.EvaluatedDecisionInput.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.EvaluatedDecisionInput} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.EvaluatedDecisionInput}
 */
proto.gateway_protocol.EvaluatedDecisionInput.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setInputid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setInputname(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setInputvalue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.EvaluatedDecisionInput.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.EvaluatedDecisionInput} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluatedDecisionInput.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getInputid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getInputname();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getInputvalue();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string inputId = 1;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.getInputid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecisionInput} returns this
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.setInputid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string inputName = 2;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.getInputname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecisionInput} returns this
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.setInputname = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string inputValue = 3;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.getInputvalue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecisionInput} returns this
 */
proto.gateway_protocol.EvaluatedDecisionInput.prototype.setInputvalue = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.EvaluatedDecisionOutput.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.EvaluatedDecisionOutput} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluatedDecisionOutput.toObject = function(includeInstance, msg) {
  var f, obj = {
    outputid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    outputname: jspb.Message.getFieldWithDefault(msg, 2, ""),
    outputvalue: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.EvaluatedDecisionOutput}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.EvaluatedDecisionOutput;
  return proto.gateway_protocol.EvaluatedDecisionOutput.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.EvaluatedDecisionOutput} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.EvaluatedDecisionOutput}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setOutputid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setOutputname(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setOutputvalue(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.EvaluatedDecisionOutput.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.EvaluatedDecisionOutput} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.EvaluatedDecisionOutput.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getOutputid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getOutputname();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getOutputvalue();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string outputId = 1;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.getOutputid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecisionOutput} returns this
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.setOutputid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string outputName = 2;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.getOutputname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecisionOutput} returns this
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.setOutputname = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string outputValue = 3;
 * @return {string}
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.getOutputvalue = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.EvaluatedDecisionOutput} returns this
 */
proto.gateway_protocol.EvaluatedDecisionOutput.prototype.setOutputvalue = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.MatchedDecisionRule.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.MatchedDecisionRule.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.MatchedDecisionRule} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MatchedDecisionRule.toObject = function(includeInstance, msg) {
  var f, obj = {
    ruleid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    ruleindex: jspb.Message.getFieldWithDefault(msg, 2, 0),
    evaluatedoutputsList: jspb.Message.toObjectList(msg.getEvaluatedoutputsList(),
    proto.gateway_protocol.EvaluatedDecisionOutput.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.MatchedDecisionRule}
 */
proto.gateway_protocol.MatchedDecisionRule.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.MatchedDecisionRule;
  return proto.gateway_protocol.MatchedDecisionRule.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.MatchedDecisionRule} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.MatchedDecisionRule}
 */
proto.gateway_protocol.MatchedDecisionRule.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setRuleid(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setRuleindex(value);
      break;
    case 3:
      var value = new proto.gateway_protocol.EvaluatedDecisionOutput;
      reader.readMessage(value,proto.gateway_protocol.EvaluatedDecisionOutput.deserializeBinaryFromReader);
      msg.addEvaluatedoutputs(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.MatchedDecisionRule.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.MatchedDecisionRule} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MatchedDecisionRule.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getRuleid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getRuleindex();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getEvaluatedoutputsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.gateway_protocol.EvaluatedDecisionOutput.serializeBinaryToWriter
    );
  }
};


/**
 * optional string ruleId = 1;
 * @return {string}
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.getRuleid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.MatchedDecisionRule} returns this
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.setRuleid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 ruleIndex = 2;
 * @return {number}
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.getRuleindex = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.MatchedDecisionRule} returns this
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.setRuleindex = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated EvaluatedDecisionOutput evaluatedOutputs = 3;
 * @return {!Array<!proto.gateway_protocol.EvaluatedDecisionOutput>}
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.getEvaluatedoutputsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.EvaluatedDecisionOutput>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.EvaluatedDecisionOutput, 3));
};


/**
 * @param {!Array<!proto.gateway_protocol.EvaluatedDecisionOutput>} value
 * @return {!proto.gateway_protocol.MatchedDecisionRule} returns this
*/
proto.gateway_protocol.MatchedDecisionRule.prototype.setEvaluatedoutputsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.gateway_protocol.EvaluatedDecisionOutput=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.EvaluatedDecisionOutput}
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.addEvaluatedoutputs = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.gateway_protocol.EvaluatedDecisionOutput, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.MatchedDecisionRule} returns this
 */
proto.gateway_protocol.MatchedDecisionRule.prototype.clearEvaluatedoutputsList = function() {
  return this.setEvaluatedoutputsList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.DeployProcessRequest.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DeployProcessRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DeployProcessRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DeployProcessRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployProcessRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    processesList: jspb.Message.toObjectList(msg.getProcessesList(),
    proto.gateway_protocol.ProcessRequestObject.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DeployProcessRequest}
 */
proto.gateway_protocol.DeployProcessRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DeployProcessRequest;
  return proto.gateway_protocol.DeployProcessRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DeployProcessRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DeployProcessRequest}
 */
proto.gateway_protocol.DeployProcessRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gateway_protocol.ProcessRequestObject;
      reader.readMessage(value,proto.gateway_protocol.ProcessRequestObject.deserializeBinaryFromReader);
      msg.addProcesses(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DeployProcessRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DeployProcessRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DeployProcessRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployProcessRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gateway_protocol.ProcessRequestObject.serializeBinaryToWriter
    );
  }
};


/**
 * repeated ProcessRequestObject processes = 1;
 * @return {!Array<!proto.gateway_protocol.ProcessRequestObject>}
 */
proto.gateway_protocol.DeployProcessRequest.prototype.getProcessesList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ProcessRequestObject>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ProcessRequestObject, 1));
};


/**
 * @param {!Array<!proto.gateway_protocol.ProcessRequestObject>} value
 * @return {!proto.gateway_protocol.DeployProcessRequest} returns this
*/
proto.gateway_protocol.DeployProcessRequest.prototype.setProcessesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gateway_protocol.ProcessRequestObject=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ProcessRequestObject}
 */
proto.gateway_protocol.DeployProcessRequest.prototype.addProcesses = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gateway_protocol.ProcessRequestObject, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.DeployProcessRequest} returns this
 */
proto.gateway_protocol.DeployProcessRequest.prototype.clearProcessesList = function() {
  return this.setProcessesList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ProcessRequestObject.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ProcessRequestObject.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ProcessRequestObject} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ProcessRequestObject.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    definition: msg.getDefinition_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ProcessRequestObject}
 */
proto.gateway_protocol.ProcessRequestObject.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ProcessRequestObject;
  return proto.gateway_protocol.ProcessRequestObject.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ProcessRequestObject} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ProcessRequestObject}
 */
proto.gateway_protocol.ProcessRequestObject.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setDefinition(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ProcessRequestObject.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ProcessRequestObject.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ProcessRequestObject} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ProcessRequestObject.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDefinition_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.gateway_protocol.ProcessRequestObject.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ProcessRequestObject} returns this
 */
proto.gateway_protocol.ProcessRequestObject.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bytes definition = 2;
 * @return {!(string|Uint8Array)}
 */
proto.gateway_protocol.ProcessRequestObject.prototype.getDefinition = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes definition = 2;
 * This is a type-conversion wrapper around `getDefinition()`
 * @return {string}
 */
proto.gateway_protocol.ProcessRequestObject.prototype.getDefinition_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getDefinition()));
};


/**
 * optional bytes definition = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getDefinition()`
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ProcessRequestObject.prototype.getDefinition_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getDefinition()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.gateway_protocol.ProcessRequestObject} returns this
 */
proto.gateway_protocol.ProcessRequestObject.prototype.setDefinition = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.DeployProcessResponse.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DeployProcessResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DeployProcessResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DeployProcessResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployProcessResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, 0),
    processesList: jspb.Message.toObjectList(msg.getProcessesList(),
    proto.gateway_protocol.ProcessMetadata.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DeployProcessResponse}
 */
proto.gateway_protocol.DeployProcessResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DeployProcessResponse;
  return proto.gateway_protocol.DeployProcessResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DeployProcessResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DeployProcessResponse}
 */
proto.gateway_protocol.DeployProcessResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setKey(value);
      break;
    case 2:
      var value = new proto.gateway_protocol.ProcessMetadata;
      reader.readMessage(value,proto.gateway_protocol.ProcessMetadata.deserializeBinaryFromReader);
      msg.addProcesses(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DeployProcessResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DeployProcessResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DeployProcessResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployProcessResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getProcessesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.gateway_protocol.ProcessMetadata.serializeBinaryToWriter
    );
  }
};


/**
 * optional int64 key = 1;
 * @return {number}
 */
proto.gateway_protocol.DeployProcessResponse.prototype.getKey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DeployProcessResponse} returns this
 */
proto.gateway_protocol.DeployProcessResponse.prototype.setKey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * repeated ProcessMetadata processes = 2;
 * @return {!Array<!proto.gateway_protocol.ProcessMetadata>}
 */
proto.gateway_protocol.DeployProcessResponse.prototype.getProcessesList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ProcessMetadata>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ProcessMetadata, 2));
};


/**
 * @param {!Array<!proto.gateway_protocol.ProcessMetadata>} value
 * @return {!proto.gateway_protocol.DeployProcessResponse} returns this
*/
proto.gateway_protocol.DeployProcessResponse.prototype.setProcessesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.gateway_protocol.ProcessMetadata=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ProcessMetadata}
 */
proto.gateway_protocol.DeployProcessResponse.prototype.addProcesses = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.gateway_protocol.ProcessMetadata, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.DeployProcessResponse} returns this
 */
proto.gateway_protocol.DeployProcessResponse.prototype.clearProcessesList = function() {
  return this.setProcessesList([]);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.DeployResourceRequest.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DeployResourceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DeployResourceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DeployResourceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployResourceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    resourcesList: jspb.Message.toObjectList(msg.getResourcesList(),
    proto.gateway_protocol.Resource.toObject, includeInstance),
    tenantid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DeployResourceRequest}
 */
proto.gateway_protocol.DeployResourceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DeployResourceRequest;
  return proto.gateway_protocol.DeployResourceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DeployResourceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DeployResourceRequest}
 */
proto.gateway_protocol.DeployResourceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gateway_protocol.Resource;
      reader.readMessage(value,proto.gateway_protocol.Resource.deserializeBinaryFromReader);
      msg.addResources(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DeployResourceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DeployResourceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DeployResourceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployResourceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResourcesList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gateway_protocol.Resource.serializeBinaryToWriter
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * repeated Resource resources = 1;
 * @return {!Array<!proto.gateway_protocol.Resource>}
 */
proto.gateway_protocol.DeployResourceRequest.prototype.getResourcesList = function() {
  return /** @type{!Array<!proto.gateway_protocol.Resource>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.Resource, 1));
};


/**
 * @param {!Array<!proto.gateway_protocol.Resource>} value
 * @return {!proto.gateway_protocol.DeployResourceRequest} returns this
*/
proto.gateway_protocol.DeployResourceRequest.prototype.setResourcesList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gateway_protocol.Resource=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.Resource}
 */
proto.gateway_protocol.DeployResourceRequest.prototype.addResources = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gateway_protocol.Resource, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.DeployResourceRequest} returns this
 */
proto.gateway_protocol.DeployResourceRequest.prototype.clearResourcesList = function() {
  return this.setResourcesList([]);
};


/**
 * optional string tenantId = 2;
 * @return {string}
 */
proto.gateway_protocol.DeployResourceRequest.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DeployResourceRequest} returns this
 */
proto.gateway_protocol.DeployResourceRequest.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.Resource.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.Resource.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.Resource} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.Resource.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    content: msg.getContent_asB64()
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.Resource}
 */
proto.gateway_protocol.Resource.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.Resource;
  return proto.gateway_protocol.Resource.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.Resource} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.Resource}
 */
proto.gateway_protocol.Resource.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {!Uint8Array} */ (reader.readBytes());
      msg.setContent(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.Resource.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.Resource.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.Resource} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.Resource.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getContent_asU8();
  if (f.length > 0) {
    writer.writeBytes(
      2,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.gateway_protocol.Resource.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.Resource} returns this
 */
proto.gateway_protocol.Resource.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional bytes content = 2;
 * @return {!(string|Uint8Array)}
 */
proto.gateway_protocol.Resource.prototype.getContent = function() {
  return /** @type {!(string|Uint8Array)} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * optional bytes content = 2;
 * This is a type-conversion wrapper around `getContent()`
 * @return {string}
 */
proto.gateway_protocol.Resource.prototype.getContent_asB64 = function() {
  return /** @type {string} */ (jspb.Message.bytesAsB64(
      this.getContent()));
};


/**
 * optional bytes content = 2;
 * Note that Uint8Array is not supported on all browsers.
 * @see http://caniuse.com/Uint8Array
 * This is a type-conversion wrapper around `getContent()`
 * @return {!Uint8Array}
 */
proto.gateway_protocol.Resource.prototype.getContent_asU8 = function() {
  return /** @type {!Uint8Array} */ (jspb.Message.bytesAsU8(
      this.getContent()));
};


/**
 * @param {!(string|Uint8Array)} value
 * @return {!proto.gateway_protocol.Resource} returns this
 */
proto.gateway_protocol.Resource.prototype.setContent = function(value) {
  return jspb.Message.setProto3BytesField(this, 2, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.DeployResourceResponse.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DeployResourceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DeployResourceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DeployResourceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployResourceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, 0),
    deploymentsList: jspb.Message.toObjectList(msg.getDeploymentsList(),
    proto.gateway_protocol.Deployment.toObject, includeInstance),
    tenantid: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DeployResourceResponse}
 */
proto.gateway_protocol.DeployResourceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DeployResourceResponse;
  return proto.gateway_protocol.DeployResourceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DeployResourceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DeployResourceResponse}
 */
proto.gateway_protocol.DeployResourceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setKey(value);
      break;
    case 2:
      var value = new proto.gateway_protocol.Deployment;
      reader.readMessage(value,proto.gateway_protocol.Deployment.deserializeBinaryFromReader);
      msg.addDeployments(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DeployResourceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DeployResourceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DeployResourceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeployResourceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getDeploymentsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.gateway_protocol.Deployment.serializeBinaryToWriter
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional int64 key = 1;
 * @return {number}
 */
proto.gateway_protocol.DeployResourceResponse.prototype.getKey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DeployResourceResponse} returns this
 */
proto.gateway_protocol.DeployResourceResponse.prototype.setKey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * repeated Deployment deployments = 2;
 * @return {!Array<!proto.gateway_protocol.Deployment>}
 */
proto.gateway_protocol.DeployResourceResponse.prototype.getDeploymentsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.Deployment>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.Deployment, 2));
};


/**
 * @param {!Array<!proto.gateway_protocol.Deployment>} value
 * @return {!proto.gateway_protocol.DeployResourceResponse} returns this
*/
proto.gateway_protocol.DeployResourceResponse.prototype.setDeploymentsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.gateway_protocol.Deployment=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.Deployment}
 */
proto.gateway_protocol.DeployResourceResponse.prototype.addDeployments = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.gateway_protocol.Deployment, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.DeployResourceResponse} returns this
 */
proto.gateway_protocol.DeployResourceResponse.prototype.clearDeploymentsList = function() {
  return this.setDeploymentsList([]);
};


/**
 * optional string tenantId = 3;
 * @return {string}
 */
proto.gateway_protocol.DeployResourceResponse.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DeployResourceResponse} returns this
 */
proto.gateway_protocol.DeployResourceResponse.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};



/**
 * Oneof group definitions for this message. Each group defines the field
 * numbers belonging to that group. When of these fields' value is set, all
 * other fields in the group are cleared. During deserialization, if multiple
 * fields are encountered for a group, only the last value seen will be kept.
 * @private {!Array<!Array<number>>}
 * @const
 */
proto.gateway_protocol.Deployment.oneofGroups_ = [[1,2,3,4]];

/**
 * @enum {number}
 */
proto.gateway_protocol.Deployment.MetadataCase = {
  METADATA_NOT_SET: 0,
  PROCESS: 1,
  DECISION: 2,
  DECISIONREQUIREMENTS: 3,
  FORM: 4
};

/**
 * @return {proto.gateway_protocol.Deployment.MetadataCase}
 */
proto.gateway_protocol.Deployment.prototype.getMetadataCase = function() {
  return /** @type {proto.gateway_protocol.Deployment.MetadataCase} */(jspb.Message.computeOneofCase(this, proto.gateway_protocol.Deployment.oneofGroups_[0]));
};



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.Deployment.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.Deployment.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.Deployment} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.Deployment.toObject = function(includeInstance, msg) {
  var f, obj = {
    process: (f = msg.getProcess()) && proto.gateway_protocol.ProcessMetadata.toObject(includeInstance, f),
    decision: (f = msg.getDecision()) && proto.gateway_protocol.DecisionMetadata.toObject(includeInstance, f),
    decisionrequirements: (f = msg.getDecisionrequirements()) && proto.gateway_protocol.DecisionRequirementsMetadata.toObject(includeInstance, f),
    form: (f = msg.getForm()) && proto.gateway_protocol.FormMetadata.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.Deployment}
 */
proto.gateway_protocol.Deployment.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.Deployment;
  return proto.gateway_protocol.Deployment.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.Deployment} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.Deployment}
 */
proto.gateway_protocol.Deployment.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gateway_protocol.ProcessMetadata;
      reader.readMessage(value,proto.gateway_protocol.ProcessMetadata.deserializeBinaryFromReader);
      msg.setProcess(value);
      break;
    case 2:
      var value = new proto.gateway_protocol.DecisionMetadata;
      reader.readMessage(value,proto.gateway_protocol.DecisionMetadata.deserializeBinaryFromReader);
      msg.setDecision(value);
      break;
    case 3:
      var value = new proto.gateway_protocol.DecisionRequirementsMetadata;
      reader.readMessage(value,proto.gateway_protocol.DecisionRequirementsMetadata.deserializeBinaryFromReader);
      msg.setDecisionrequirements(value);
      break;
    case 4:
      var value = new proto.gateway_protocol.FormMetadata;
      reader.readMessage(value,proto.gateway_protocol.FormMetadata.deserializeBinaryFromReader);
      msg.setForm(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.Deployment.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.Deployment.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.Deployment} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.Deployment.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcess();
  if (f != null) {
    writer.writeMessage(
      1,
      f,
      proto.gateway_protocol.ProcessMetadata.serializeBinaryToWriter
    );
  }
  f = message.getDecision();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.gateway_protocol.DecisionMetadata.serializeBinaryToWriter
    );
  }
  f = message.getDecisionrequirements();
  if (f != null) {
    writer.writeMessage(
      3,
      f,
      proto.gateway_protocol.DecisionRequirementsMetadata.serializeBinaryToWriter
    );
  }
  f = message.getForm();
  if (f != null) {
    writer.writeMessage(
      4,
      f,
      proto.gateway_protocol.FormMetadata.serializeBinaryToWriter
    );
  }
};


/**
 * optional ProcessMetadata process = 1;
 * @return {?proto.gateway_protocol.ProcessMetadata}
 */
proto.gateway_protocol.Deployment.prototype.getProcess = function() {
  return /** @type{?proto.gateway_protocol.ProcessMetadata} */ (
    jspb.Message.getWrapperField(this, proto.gateway_protocol.ProcessMetadata, 1));
};


/**
 * @param {?proto.gateway_protocol.ProcessMetadata|undefined} value
 * @return {!proto.gateway_protocol.Deployment} returns this
*/
proto.gateway_protocol.Deployment.prototype.setProcess = function(value) {
  return jspb.Message.setOneofWrapperField(this, 1, proto.gateway_protocol.Deployment.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gateway_protocol.Deployment} returns this
 */
proto.gateway_protocol.Deployment.prototype.clearProcess = function() {
  return this.setProcess(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gateway_protocol.Deployment.prototype.hasProcess = function() {
  return jspb.Message.getField(this, 1) != null;
};


/**
 * optional DecisionMetadata decision = 2;
 * @return {?proto.gateway_protocol.DecisionMetadata}
 */
proto.gateway_protocol.Deployment.prototype.getDecision = function() {
  return /** @type{?proto.gateway_protocol.DecisionMetadata} */ (
    jspb.Message.getWrapperField(this, proto.gateway_protocol.DecisionMetadata, 2));
};


/**
 * @param {?proto.gateway_protocol.DecisionMetadata|undefined} value
 * @return {!proto.gateway_protocol.Deployment} returns this
*/
proto.gateway_protocol.Deployment.prototype.setDecision = function(value) {
  return jspb.Message.setOneofWrapperField(this, 2, proto.gateway_protocol.Deployment.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gateway_protocol.Deployment} returns this
 */
proto.gateway_protocol.Deployment.prototype.clearDecision = function() {
  return this.setDecision(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gateway_protocol.Deployment.prototype.hasDecision = function() {
  return jspb.Message.getField(this, 2) != null;
};


/**
 * optional DecisionRequirementsMetadata decisionRequirements = 3;
 * @return {?proto.gateway_protocol.DecisionRequirementsMetadata}
 */
proto.gateway_protocol.Deployment.prototype.getDecisionrequirements = function() {
  return /** @type{?proto.gateway_protocol.DecisionRequirementsMetadata} */ (
    jspb.Message.getWrapperField(this, proto.gateway_protocol.DecisionRequirementsMetadata, 3));
};


/**
 * @param {?proto.gateway_protocol.DecisionRequirementsMetadata|undefined} value
 * @return {!proto.gateway_protocol.Deployment} returns this
*/
proto.gateway_protocol.Deployment.prototype.setDecisionrequirements = function(value) {
  return jspb.Message.setOneofWrapperField(this, 3, proto.gateway_protocol.Deployment.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gateway_protocol.Deployment} returns this
 */
proto.gateway_protocol.Deployment.prototype.clearDecisionrequirements = function() {
  return this.setDecisionrequirements(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gateway_protocol.Deployment.prototype.hasDecisionrequirements = function() {
  return jspb.Message.getField(this, 3) != null;
};


/**
 * optional FormMetadata form = 4;
 * @return {?proto.gateway_protocol.FormMetadata}
 */
proto.gateway_protocol.Deployment.prototype.getForm = function() {
  return /** @type{?proto.gateway_protocol.FormMetadata} */ (
    jspb.Message.getWrapperField(this, proto.gateway_protocol.FormMetadata, 4));
};


/**
 * @param {?proto.gateway_protocol.FormMetadata|undefined} value
 * @return {!proto.gateway_protocol.Deployment} returns this
*/
proto.gateway_protocol.Deployment.prototype.setForm = function(value) {
  return jspb.Message.setOneofWrapperField(this, 4, proto.gateway_protocol.Deployment.oneofGroups_[0], value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gateway_protocol.Deployment} returns this
 */
proto.gateway_protocol.Deployment.prototype.clearForm = function() {
  return this.setForm(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gateway_protocol.Deployment.prototype.hasForm = function() {
  return jspb.Message.getField(this, 4) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ProcessMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ProcessMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ProcessMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ProcessMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
    bpmnprocessid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, 0),
    processdefinitionkey: jspb.Message.getFieldWithDefault(msg, 3, 0),
    resourcename: jspb.Message.getFieldWithDefault(msg, 4, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ProcessMetadata}
 */
proto.gateway_protocol.ProcessMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ProcessMetadata;
  return proto.gateway_protocol.ProcessMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ProcessMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ProcessMetadata}
 */
proto.gateway_protocol.ProcessMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setBpmnprocessid(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessdefinitionkey(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setResourcename(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ProcessMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ProcessMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ProcessMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ProcessMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBpmnprocessid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getProcessdefinitionkey();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getResourcename();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string bpmnProcessId = 1;
 * @return {string}
 */
proto.gateway_protocol.ProcessMetadata.prototype.getBpmnprocessid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ProcessMetadata} returns this
 */
proto.gateway_protocol.ProcessMetadata.prototype.setBpmnprocessid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 version = 2;
 * @return {number}
 */
proto.gateway_protocol.ProcessMetadata.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ProcessMetadata} returns this
 */
proto.gateway_protocol.ProcessMetadata.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 processDefinitionKey = 3;
 * @return {number}
 */
proto.gateway_protocol.ProcessMetadata.prototype.getProcessdefinitionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ProcessMetadata} returns this
 */
proto.gateway_protocol.ProcessMetadata.prototype.setProcessdefinitionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string resourceName = 4;
 * @return {string}
 */
proto.gateway_protocol.ProcessMetadata.prototype.getResourcename = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ProcessMetadata} returns this
 */
proto.gateway_protocol.ProcessMetadata.prototype.setResourcename = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string tenantId = 5;
 * @return {string}
 */
proto.gateway_protocol.ProcessMetadata.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ProcessMetadata} returns this
 */
proto.gateway_protocol.ProcessMetadata.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DecisionMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DecisionMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DecisionMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DecisionMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
    dmndecisionid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    dmndecisionname: jspb.Message.getFieldWithDefault(msg, 2, ""),
    version: jspb.Message.getFieldWithDefault(msg, 3, 0),
    decisionkey: jspb.Message.getFieldWithDefault(msg, 4, 0),
    dmndecisionrequirementsid: jspb.Message.getFieldWithDefault(msg, 5, ""),
    decisionrequirementskey: jspb.Message.getFieldWithDefault(msg, 6, 0),
    tenantid: jspb.Message.getFieldWithDefault(msg, 7, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DecisionMetadata}
 */
proto.gateway_protocol.DecisionMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DecisionMetadata;
  return proto.gateway_protocol.DecisionMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DecisionMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DecisionMetadata}
 */
proto.gateway_protocol.DecisionMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setDmndecisionid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDmndecisionname(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionkey(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setDmndecisionrequirementsid(value);
      break;
    case 6:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionrequirementskey(value);
      break;
    case 7:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DecisionMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DecisionMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DecisionMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DecisionMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDmndecisionid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDmndecisionname();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getDecisionkey();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getDmndecisionrequirementsid();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getDecisionrequirementskey();
  if (f !== 0) {
    writer.writeInt64(
      6,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      7,
      f
    );
  }
};


/**
 * optional string dmnDecisionId = 1;
 * @return {string}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getDmndecisionid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setDmndecisionid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string dmnDecisionName = 2;
 * @return {string}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getDmndecisionname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setDmndecisionname = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 version = 3;
 * @return {number}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 decisionKey = 4;
 * @return {number}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getDecisionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setDecisionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string dmnDecisionRequirementsId = 5;
 * @return {string}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getDmndecisionrequirementsid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setDmndecisionrequirementsid = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional int64 decisionRequirementsKey = 6;
 * @return {number}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getDecisionrequirementskey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 6, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setDecisionrequirementskey = function(value) {
  return jspb.Message.setProto3IntField(this, 6, value);
};


/**
 * optional string tenantId = 7;
 * @return {string}
 */
proto.gateway_protocol.DecisionMetadata.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 7, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionMetadata} returns this
 */
proto.gateway_protocol.DecisionMetadata.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 7, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DecisionRequirementsMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DecisionRequirementsMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DecisionRequirementsMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
    dmndecisionrequirementsid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    dmndecisionrequirementsname: jspb.Message.getFieldWithDefault(msg, 2, ""),
    version: jspb.Message.getFieldWithDefault(msg, 3, 0),
    decisionrequirementskey: jspb.Message.getFieldWithDefault(msg, 4, 0),
    resourcename: jspb.Message.getFieldWithDefault(msg, 5, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 6, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DecisionRequirementsMetadata;
  return proto.gateway_protocol.DecisionRequirementsMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DecisionRequirementsMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setDmndecisionrequirementsid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setDmndecisionrequirementsname(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setDecisionrequirementskey(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setResourcename(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DecisionRequirementsMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DecisionRequirementsMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DecisionRequirementsMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getDmndecisionrequirementsid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getDmndecisionrequirementsname();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getDecisionrequirementskey();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getResourcename();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * optional string dmnDecisionRequirementsId = 1;
 * @return {string}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.getDmndecisionrequirementsid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata} returns this
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.setDmndecisionrequirementsid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string dmnDecisionRequirementsName = 2;
 * @return {string}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.getDmndecisionrequirementsname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata} returns this
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.setDmndecisionrequirementsname = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 version = 3;
 * @return {number}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata} returns this
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int64 decisionRequirementsKey = 4;
 * @return {number}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.getDecisionrequirementskey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata} returns this
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.setDecisionrequirementskey = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string resourceName = 5;
 * @return {string}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.getResourcename = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata} returns this
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.setResourcename = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string tenantId = 6;
 * @return {string}
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.DecisionRequirementsMetadata} returns this
 */
proto.gateway_protocol.DecisionRequirementsMetadata.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.FormMetadata.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.FormMetadata.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.FormMetadata} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.FormMetadata.toObject = function(includeInstance, msg) {
  var f, obj = {
    formid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    version: jspb.Message.getFieldWithDefault(msg, 2, 0),
    formkey: jspb.Message.getFieldWithDefault(msg, 3, 0),
    resourcename: jspb.Message.getFieldWithDefault(msg, 4, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.FormMetadata}
 */
proto.gateway_protocol.FormMetadata.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.FormMetadata;
  return proto.gateway_protocol.FormMetadata.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.FormMetadata} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.FormMetadata}
 */
proto.gateway_protocol.FormMetadata.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setFormid(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setVersion(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setFormkey(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setResourcename(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.FormMetadata.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.FormMetadata.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.FormMetadata} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.FormMetadata.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getFormid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVersion();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getFormkey();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getResourcename();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional string formId = 1;
 * @return {string}
 */
proto.gateway_protocol.FormMetadata.prototype.getFormid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.FormMetadata} returns this
 */
proto.gateway_protocol.FormMetadata.prototype.setFormid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int32 version = 2;
 * @return {number}
 */
proto.gateway_protocol.FormMetadata.prototype.getVersion = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.FormMetadata} returns this
 */
proto.gateway_protocol.FormMetadata.prototype.setVersion = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int64 formKey = 3;
 * @return {number}
 */
proto.gateway_protocol.FormMetadata.prototype.getFormkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.FormMetadata} returns this
 */
proto.gateway_protocol.FormMetadata.prototype.setFormkey = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string resourceName = 4;
 * @return {string}
 */
proto.gateway_protocol.FormMetadata.prototype.getResourcename = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.FormMetadata} returns this
 */
proto.gateway_protocol.FormMetadata.prototype.setResourcename = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string tenantId = 5;
 * @return {string}
 */
proto.gateway_protocol.FormMetadata.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.FormMetadata} returns this
 */
proto.gateway_protocol.FormMetadata.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.FailJobRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.FailJobRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.FailJobRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.FailJobRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    jobkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    retries: jspb.Message.getFieldWithDefault(msg, 2, 0),
    errormessage: jspb.Message.getFieldWithDefault(msg, 3, ""),
    retrybackoff: jspb.Message.getFieldWithDefault(msg, 4, 0),
    variables: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.FailJobRequest}
 */
proto.gateway_protocol.FailJobRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.FailJobRequest;
  return proto.gateway_protocol.FailJobRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.FailJobRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.FailJobRequest}
 */
proto.gateway_protocol.FailJobRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJobkey(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setRetries(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrormessage(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setRetrybackoff(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.FailJobRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.FailJobRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.FailJobRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.FailJobRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJobkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getRetries();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getErrormessage();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getRetrybackoff();
  if (f !== 0) {
    writer.writeInt64(
      4,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional int64 jobKey = 1;
 * @return {number}
 */
proto.gateway_protocol.FailJobRequest.prototype.getJobkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.FailJobRequest} returns this
 */
proto.gateway_protocol.FailJobRequest.prototype.setJobkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int32 retries = 2;
 * @return {number}
 */
proto.gateway_protocol.FailJobRequest.prototype.getRetries = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.FailJobRequest} returns this
 */
proto.gateway_protocol.FailJobRequest.prototype.setRetries = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional string errorMessage = 3;
 * @return {string}
 */
proto.gateway_protocol.FailJobRequest.prototype.getErrormessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.FailJobRequest} returns this
 */
proto.gateway_protocol.FailJobRequest.prototype.setErrormessage = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional int64 retryBackOff = 4;
 * @return {number}
 */
proto.gateway_protocol.FailJobRequest.prototype.getRetrybackoff = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.FailJobRequest} returns this
 */
proto.gateway_protocol.FailJobRequest.prototype.setRetrybackoff = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string variables = 5;
 * @return {string}
 */
proto.gateway_protocol.FailJobRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.FailJobRequest} returns this
 */
proto.gateway_protocol.FailJobRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.FailJobResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.FailJobResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.FailJobResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.FailJobResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.FailJobResponse}
 */
proto.gateway_protocol.FailJobResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.FailJobResponse;
  return proto.gateway_protocol.FailJobResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.FailJobResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.FailJobResponse}
 */
proto.gateway_protocol.FailJobResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.FailJobResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.FailJobResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.FailJobResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.FailJobResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ThrowErrorRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ThrowErrorRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ThrowErrorRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    jobkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    errorcode: jspb.Message.getFieldWithDefault(msg, 2, ""),
    errormessage: jspb.Message.getFieldWithDefault(msg, 3, ""),
    variables: jspb.Message.getFieldWithDefault(msg, 4, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ThrowErrorRequest}
 */
proto.gateway_protocol.ThrowErrorRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ThrowErrorRequest;
  return proto.gateway_protocol.ThrowErrorRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ThrowErrorRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ThrowErrorRequest}
 */
proto.gateway_protocol.ThrowErrorRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJobkey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrorcode(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setErrormessage(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ThrowErrorRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ThrowErrorRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ThrowErrorRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJobkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getErrorcode();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getErrormessage();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
};


/**
 * optional int64 jobKey = 1;
 * @return {number}
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.getJobkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ThrowErrorRequest} returns this
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.setJobkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string errorCode = 2;
 * @return {string}
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.getErrorcode = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ThrowErrorRequest} returns this
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.setErrorcode = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string errorMessage = 3;
 * @return {string}
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.getErrormessage = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ThrowErrorRequest} returns this
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.setErrormessage = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};


/**
 * optional string variables = 4;
 * @return {string}
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ThrowErrorRequest} returns this
 */
proto.gateway_protocol.ThrowErrorRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ThrowErrorResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ThrowErrorResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ThrowErrorResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ThrowErrorResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ThrowErrorResponse}
 */
proto.gateway_protocol.ThrowErrorResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ThrowErrorResponse;
  return proto.gateway_protocol.ThrowErrorResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ThrowErrorResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ThrowErrorResponse}
 */
proto.gateway_protocol.ThrowErrorResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ThrowErrorResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ThrowErrorResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ThrowErrorResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ThrowErrorResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.PublishMessageRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.PublishMessageRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.PublishMessageRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    name: jspb.Message.getFieldWithDefault(msg, 1, ""),
    correlationkey: jspb.Message.getFieldWithDefault(msg, 2, ""),
    timetolive: jspb.Message.getFieldWithDefault(msg, 3, 0),
    messageid: jspb.Message.getFieldWithDefault(msg, 4, ""),
    variables: jspb.Message.getFieldWithDefault(msg, 5, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 6, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.PublishMessageRequest}
 */
proto.gateway_protocol.PublishMessageRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.PublishMessageRequest;
  return proto.gateway_protocol.PublishMessageRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.PublishMessageRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.PublishMessageRequest}
 */
proto.gateway_protocol.PublishMessageRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setName(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setCorrelationkey(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimetolive(value);
      break;
    case 4:
      var value = /** @type {string} */ (reader.readString());
      msg.setMessageid(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 6:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.PublishMessageRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.PublishMessageRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.PublishMessageRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getName();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getCorrelationkey();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTimetolive();
  if (f !== 0) {
    writer.writeInt64(
      3,
      f
    );
  }
  f = message.getMessageid();
  if (f.length > 0) {
    writer.writeString(
      4,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      6,
      f
    );
  }
};


/**
 * optional string name = 1;
 * @return {string}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.getName = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.PublishMessageRequest} returns this
 */
proto.gateway_protocol.PublishMessageRequest.prototype.setName = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string correlationKey = 2;
 * @return {string}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.getCorrelationkey = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.PublishMessageRequest} returns this
 */
proto.gateway_protocol.PublishMessageRequest.prototype.setCorrelationkey = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int64 timeToLive = 3;
 * @return {number}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.getTimetolive = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.PublishMessageRequest} returns this
 */
proto.gateway_protocol.PublishMessageRequest.prototype.setTimetolive = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional string messageId = 4;
 * @return {string}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.getMessageid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 4, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.PublishMessageRequest} returns this
 */
proto.gateway_protocol.PublishMessageRequest.prototype.setMessageid = function(value) {
  return jspb.Message.setProto3StringField(this, 4, value);
};


/**
 * optional string variables = 5;
 * @return {string}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.PublishMessageRequest} returns this
 */
proto.gateway_protocol.PublishMessageRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};


/**
 * optional string tenantId = 6;
 * @return {string}
 */
proto.gateway_protocol.PublishMessageRequest.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 6, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.PublishMessageRequest} returns this
 */
proto.gateway_protocol.PublishMessageRequest.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 6, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.PublishMessageResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.PublishMessageResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.PublishMessageResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.PublishMessageResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, 0),
    tenantid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.PublishMessageResponse}
 */
proto.gateway_protocol.PublishMessageResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.PublishMessageResponse;
  return proto.gateway_protocol.PublishMessageResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.PublishMessageResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.PublishMessageResponse}
 */
proto.gateway_protocol.PublishMessageResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.PublishMessageResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.PublishMessageResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.PublishMessageResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.PublishMessageResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional int64 key = 1;
 * @return {number}
 */
proto.gateway_protocol.PublishMessageResponse.prototype.getKey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.PublishMessageResponse} returns this
 */
proto.gateway_protocol.PublishMessageResponse.prototype.setKey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string tenantId = 2;
 * @return {string}
 */
proto.gateway_protocol.PublishMessageResponse.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.PublishMessageResponse} returns this
 */
proto.gateway_protocol.PublishMessageResponse.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ResolveIncidentRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ResolveIncidentRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ResolveIncidentRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ResolveIncidentRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    incidentkey: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ResolveIncidentRequest}
 */
proto.gateway_protocol.ResolveIncidentRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ResolveIncidentRequest;
  return proto.gateway_protocol.ResolveIncidentRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ResolveIncidentRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ResolveIncidentRequest}
 */
proto.gateway_protocol.ResolveIncidentRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setIncidentkey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ResolveIncidentRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ResolveIncidentRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ResolveIncidentRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ResolveIncidentRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getIncidentkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 incidentKey = 1;
 * @return {number}
 */
proto.gateway_protocol.ResolveIncidentRequest.prototype.getIncidentkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ResolveIncidentRequest} returns this
 */
proto.gateway_protocol.ResolveIncidentRequest.prototype.setIncidentkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ResolveIncidentResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ResolveIncidentResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ResolveIncidentResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ResolveIncidentResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ResolveIncidentResponse}
 */
proto.gateway_protocol.ResolveIncidentResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ResolveIncidentResponse;
  return proto.gateway_protocol.ResolveIncidentResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ResolveIncidentResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ResolveIncidentResponse}
 */
proto.gateway_protocol.ResolveIncidentResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ResolveIncidentResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ResolveIncidentResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ResolveIncidentResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ResolveIncidentResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.TopologyRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.TopologyRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.TopologyRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.TopologyRequest.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.TopologyRequest}
 */
proto.gateway_protocol.TopologyRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.TopologyRequest;
  return proto.gateway_protocol.TopologyRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.TopologyRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.TopologyRequest}
 */
proto.gateway_protocol.TopologyRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.TopologyRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.TopologyRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.TopologyRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.TopologyRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.TopologyResponse.repeatedFields_ = [1];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.TopologyResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.TopologyResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.TopologyResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.TopologyResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    brokersList: jspb.Message.toObjectList(msg.getBrokersList(),
    proto.gateway_protocol.BrokerInfo.toObject, includeInstance),
    clustersize: jspb.Message.getFieldWithDefault(msg, 2, 0),
    partitionscount: jspb.Message.getFieldWithDefault(msg, 3, 0),
    replicationfactor: jspb.Message.getFieldWithDefault(msg, 4, 0),
    gatewayversion: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.TopologyResponse}
 */
proto.gateway_protocol.TopologyResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.TopologyResponse;
  return proto.gateway_protocol.TopologyResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.TopologyResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.TopologyResponse}
 */
proto.gateway_protocol.TopologyResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = new proto.gateway_protocol.BrokerInfo;
      reader.readMessage(value,proto.gateway_protocol.BrokerInfo.deserializeBinaryFromReader);
      msg.addBrokers(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setClustersize(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPartitionscount(value);
      break;
    case 4:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setReplicationfactor(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setGatewayversion(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.TopologyResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.TopologyResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.TopologyResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.TopologyResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getBrokersList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      1,
      f,
      proto.gateway_protocol.BrokerInfo.serializeBinaryToWriter
    );
  }
  f = message.getClustersize();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
  f = message.getPartitionscount();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getReplicationfactor();
  if (f !== 0) {
    writer.writeInt32(
      4,
      f
    );
  }
  f = message.getGatewayversion();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * repeated BrokerInfo brokers = 1;
 * @return {!Array<!proto.gateway_protocol.BrokerInfo>}
 */
proto.gateway_protocol.TopologyResponse.prototype.getBrokersList = function() {
  return /** @type{!Array<!proto.gateway_protocol.BrokerInfo>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.BrokerInfo, 1));
};


/**
 * @param {!Array<!proto.gateway_protocol.BrokerInfo>} value
 * @return {!proto.gateway_protocol.TopologyResponse} returns this
*/
proto.gateway_protocol.TopologyResponse.prototype.setBrokersList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 1, value);
};


/**
 * @param {!proto.gateway_protocol.BrokerInfo=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.BrokerInfo}
 */
proto.gateway_protocol.TopologyResponse.prototype.addBrokers = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 1, opt_value, proto.gateway_protocol.BrokerInfo, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.TopologyResponse} returns this
 */
proto.gateway_protocol.TopologyResponse.prototype.clearBrokersList = function() {
  return this.setBrokersList([]);
};


/**
 * optional int32 clusterSize = 2;
 * @return {number}
 */
proto.gateway_protocol.TopologyResponse.prototype.getClustersize = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.TopologyResponse} returns this
 */
proto.gateway_protocol.TopologyResponse.prototype.setClustersize = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * optional int32 partitionsCount = 3;
 * @return {number}
 */
proto.gateway_protocol.TopologyResponse.prototype.getPartitionscount = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.TopologyResponse} returns this
 */
proto.gateway_protocol.TopologyResponse.prototype.setPartitionscount = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * optional int32 replicationFactor = 4;
 * @return {number}
 */
proto.gateway_protocol.TopologyResponse.prototype.getReplicationfactor = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 4, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.TopologyResponse} returns this
 */
proto.gateway_protocol.TopologyResponse.prototype.setReplicationfactor = function(value) {
  return jspb.Message.setProto3IntField(this, 4, value);
};


/**
 * optional string gatewayVersion = 5;
 * @return {string}
 */
proto.gateway_protocol.TopologyResponse.prototype.getGatewayversion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.TopologyResponse} returns this
 */
proto.gateway_protocol.TopologyResponse.prototype.setGatewayversion = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.BrokerInfo.repeatedFields_ = [4];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.BrokerInfo.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.BrokerInfo.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.BrokerInfo} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.BrokerInfo.toObject = function(includeInstance, msg) {
  var f, obj = {
    nodeid: jspb.Message.getFieldWithDefault(msg, 1, 0),
    host: jspb.Message.getFieldWithDefault(msg, 2, ""),
    port: jspb.Message.getFieldWithDefault(msg, 3, 0),
    partitionsList: jspb.Message.toObjectList(msg.getPartitionsList(),
    proto.gateway_protocol.Partition.toObject, includeInstance),
    version: jspb.Message.getFieldWithDefault(msg, 5, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.BrokerInfo}
 */
proto.gateway_protocol.BrokerInfo.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.BrokerInfo;
  return proto.gateway_protocol.BrokerInfo.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.BrokerInfo} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.BrokerInfo}
 */
proto.gateway_protocol.BrokerInfo.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setNodeid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setHost(value);
      break;
    case 3:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPort(value);
      break;
    case 4:
      var value = new proto.gateway_protocol.Partition;
      reader.readMessage(value,proto.gateway_protocol.Partition.deserializeBinaryFromReader);
      msg.addPartitions(value);
      break;
    case 5:
      var value = /** @type {string} */ (reader.readString());
      msg.setVersion(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.BrokerInfo.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.BrokerInfo.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.BrokerInfo} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.BrokerInfo.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getNodeid();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getHost();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getPort();
  if (f !== 0) {
    writer.writeInt32(
      3,
      f
    );
  }
  f = message.getPartitionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      4,
      f,
      proto.gateway_protocol.Partition.serializeBinaryToWriter
    );
  }
  f = message.getVersion();
  if (f.length > 0) {
    writer.writeString(
      5,
      f
    );
  }
};


/**
 * optional int32 nodeId = 1;
 * @return {number}
 */
proto.gateway_protocol.BrokerInfo.prototype.getNodeid = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.BrokerInfo} returns this
 */
proto.gateway_protocol.BrokerInfo.prototype.setNodeid = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string host = 2;
 * @return {string}
 */
proto.gateway_protocol.BrokerInfo.prototype.getHost = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.BrokerInfo} returns this
 */
proto.gateway_protocol.BrokerInfo.prototype.setHost = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int32 port = 3;
 * @return {number}
 */
proto.gateway_protocol.BrokerInfo.prototype.getPort = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.BrokerInfo} returns this
 */
proto.gateway_protocol.BrokerInfo.prototype.setPort = function(value) {
  return jspb.Message.setProto3IntField(this, 3, value);
};


/**
 * repeated Partition partitions = 4;
 * @return {!Array<!proto.gateway_protocol.Partition>}
 */
proto.gateway_protocol.BrokerInfo.prototype.getPartitionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.Partition>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.Partition, 4));
};


/**
 * @param {!Array<!proto.gateway_protocol.Partition>} value
 * @return {!proto.gateway_protocol.BrokerInfo} returns this
*/
proto.gateway_protocol.BrokerInfo.prototype.setPartitionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 4, value);
};


/**
 * @param {!proto.gateway_protocol.Partition=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.Partition}
 */
proto.gateway_protocol.BrokerInfo.prototype.addPartitions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 4, opt_value, proto.gateway_protocol.Partition, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.BrokerInfo} returns this
 */
proto.gateway_protocol.BrokerInfo.prototype.clearPartitionsList = function() {
  return this.setPartitionsList([]);
};


/**
 * optional string version = 5;
 * @return {string}
 */
proto.gateway_protocol.BrokerInfo.prototype.getVersion = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 5, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.BrokerInfo} returns this
 */
proto.gateway_protocol.BrokerInfo.prototype.setVersion = function(value) {
  return jspb.Message.setProto3StringField(this, 5, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.Partition.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.Partition.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.Partition} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.Partition.toObject = function(includeInstance, msg) {
  var f, obj = {
    partitionid: jspb.Message.getFieldWithDefault(msg, 1, 0),
    role: jspb.Message.getFieldWithDefault(msg, 2, 0),
    health: jspb.Message.getFieldWithDefault(msg, 3, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.Partition}
 */
proto.gateway_protocol.Partition.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.Partition;
  return proto.gateway_protocol.Partition.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.Partition} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.Partition}
 */
proto.gateway_protocol.Partition.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setPartitionid(value);
      break;
    case 2:
      var value = /** @type {!proto.gateway_protocol.Partition.PartitionBrokerRole} */ (reader.readEnum());
      msg.setRole(value);
      break;
    case 3:
      var value = /** @type {!proto.gateway_protocol.Partition.PartitionBrokerHealth} */ (reader.readEnum());
      msg.setHealth(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.Partition.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.Partition.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.Partition} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.Partition.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getPartitionid();
  if (f !== 0) {
    writer.writeInt32(
      1,
      f
    );
  }
  f = message.getRole();
  if (f !== 0.0) {
    writer.writeEnum(
      2,
      f
    );
  }
  f = message.getHealth();
  if (f !== 0.0) {
    writer.writeEnum(
      3,
      f
    );
  }
};


/**
 * @enum {number}
 */
proto.gateway_protocol.Partition.PartitionBrokerRole = {
  LEADER: 0,
  FOLLOWER: 1,
  INACTIVE: 2
};

/**
 * @enum {number}
 */
proto.gateway_protocol.Partition.PartitionBrokerHealth = {
  HEALTHY: 0,
  UNHEALTHY: 1,
  DEAD: 2
};

/**
 * optional int32 partitionId = 1;
 * @return {number}
 */
proto.gateway_protocol.Partition.prototype.getPartitionid = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.Partition} returns this
 */
proto.gateway_protocol.Partition.prototype.setPartitionid = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional PartitionBrokerRole role = 2;
 * @return {!proto.gateway_protocol.Partition.PartitionBrokerRole}
 */
proto.gateway_protocol.Partition.prototype.getRole = function() {
  return /** @type {!proto.gateway_protocol.Partition.PartitionBrokerRole} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {!proto.gateway_protocol.Partition.PartitionBrokerRole} value
 * @return {!proto.gateway_protocol.Partition} returns this
 */
proto.gateway_protocol.Partition.prototype.setRole = function(value) {
  return jspb.Message.setProto3EnumField(this, 2, value);
};


/**
 * optional PartitionBrokerHealth health = 3;
 * @return {!proto.gateway_protocol.Partition.PartitionBrokerHealth}
 */
proto.gateway_protocol.Partition.prototype.getHealth = function() {
  return /** @type {!proto.gateway_protocol.Partition.PartitionBrokerHealth} */ (jspb.Message.getFieldWithDefault(this, 3, 0));
};


/**
 * @param {!proto.gateway_protocol.Partition.PartitionBrokerHealth} value
 * @return {!proto.gateway_protocol.Partition} returns this
 */
proto.gateway_protocol.Partition.prototype.setHealth = function(value) {
  return jspb.Message.setProto3EnumField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.UpdateJobRetriesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.UpdateJobRetriesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.UpdateJobRetriesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobRetriesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    jobkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    retries: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.UpdateJobRetriesRequest}
 */
proto.gateway_protocol.UpdateJobRetriesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.UpdateJobRetriesRequest;
  return proto.gateway_protocol.UpdateJobRetriesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.UpdateJobRetriesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.UpdateJobRetriesRequest}
 */
proto.gateway_protocol.UpdateJobRetriesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJobkey(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt32());
      msg.setRetries(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.UpdateJobRetriesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.UpdateJobRetriesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.UpdateJobRetriesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobRetriesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJobkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getRetries();
  if (f !== 0) {
    writer.writeInt32(
      2,
      f
    );
  }
};


/**
 * optional int64 jobKey = 1;
 * @return {number}
 */
proto.gateway_protocol.UpdateJobRetriesRequest.prototype.getJobkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.UpdateJobRetriesRequest} returns this
 */
proto.gateway_protocol.UpdateJobRetriesRequest.prototype.setJobkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int32 retries = 2;
 * @return {number}
 */
proto.gateway_protocol.UpdateJobRetriesRequest.prototype.getRetries = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.UpdateJobRetriesRequest} returns this
 */
proto.gateway_protocol.UpdateJobRetriesRequest.prototype.setRetries = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.UpdateJobRetriesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.UpdateJobRetriesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.UpdateJobRetriesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobRetriesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.UpdateJobRetriesResponse}
 */
proto.gateway_protocol.UpdateJobRetriesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.UpdateJobRetriesResponse;
  return proto.gateway_protocol.UpdateJobRetriesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.UpdateJobRetriesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.UpdateJobRetriesResponse}
 */
proto.gateway_protocol.UpdateJobRetriesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.UpdateJobRetriesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.UpdateJobRetriesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.UpdateJobRetriesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobRetriesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.UpdateJobTimeoutRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.UpdateJobTimeoutRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    jobkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    timeout: jspb.Message.getFieldWithDefault(msg, 2, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.UpdateJobTimeoutRequest}
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.UpdateJobTimeoutRequest;
  return proto.gateway_protocol.UpdateJobTimeoutRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.UpdateJobTimeoutRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.UpdateJobTimeoutRequest}
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setJobkey(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTimeout(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.UpdateJobTimeoutRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.UpdateJobTimeoutRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getJobkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getTimeout();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
};


/**
 * optional int64 jobKey = 1;
 * @return {number}
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.prototype.getJobkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.UpdateJobTimeoutRequest} returns this
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.prototype.setJobkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 timeout = 2;
 * @return {number}
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.prototype.getTimeout = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.UpdateJobTimeoutRequest} returns this
 */
proto.gateway_protocol.UpdateJobTimeoutRequest.prototype.setTimeout = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.UpdateJobTimeoutResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.UpdateJobTimeoutResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.UpdateJobTimeoutResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobTimeoutResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.UpdateJobTimeoutResponse}
 */
proto.gateway_protocol.UpdateJobTimeoutResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.UpdateJobTimeoutResponse;
  return proto.gateway_protocol.UpdateJobTimeoutResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.UpdateJobTimeoutResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.UpdateJobTimeoutResponse}
 */
proto.gateway_protocol.UpdateJobTimeoutResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.UpdateJobTimeoutResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.UpdateJobTimeoutResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.UpdateJobTimeoutResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.UpdateJobTimeoutResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.SetVariablesRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.SetVariablesRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.SetVariablesRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.SetVariablesRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    elementinstancekey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    variables: jspb.Message.getFieldWithDefault(msg, 2, ""),
    local: jspb.Message.getBooleanFieldWithDefault(msg, 3, false)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.SetVariablesRequest}
 */
proto.gateway_protocol.SetVariablesRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.SetVariablesRequest;
  return proto.gateway_protocol.SetVariablesRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.SetVariablesRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.SetVariablesRequest}
 */
proto.gateway_protocol.SetVariablesRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setElementinstancekey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 3:
      var value = /** @type {boolean} */ (reader.readBool());
      msg.setLocal(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.SetVariablesRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.SetVariablesRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.SetVariablesRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.SetVariablesRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getElementinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getLocal();
  if (f) {
    writer.writeBool(
      3,
      f
    );
  }
};


/**
 * optional int64 elementInstanceKey = 1;
 * @return {number}
 */
proto.gateway_protocol.SetVariablesRequest.prototype.getElementinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.SetVariablesRequest} returns this
 */
proto.gateway_protocol.SetVariablesRequest.prototype.setElementinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string variables = 2;
 * @return {string}
 */
proto.gateway_protocol.SetVariablesRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.SetVariablesRequest} returns this
 */
proto.gateway_protocol.SetVariablesRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional bool local = 3;
 * @return {boolean}
 */
proto.gateway_protocol.SetVariablesRequest.prototype.getLocal = function() {
  return /** @type {boolean} */ (jspb.Message.getBooleanFieldWithDefault(this, 3, false));
};


/**
 * @param {boolean} value
 * @return {!proto.gateway_protocol.SetVariablesRequest} returns this
 */
proto.gateway_protocol.SetVariablesRequest.prototype.setLocal = function(value) {
  return jspb.Message.setProto3BooleanField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.SetVariablesResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.SetVariablesResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.SetVariablesResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.SetVariablesResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.SetVariablesResponse}
 */
proto.gateway_protocol.SetVariablesResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.SetVariablesResponse;
  return proto.gateway_protocol.SetVariablesResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.SetVariablesResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.SetVariablesResponse}
 */
proto.gateway_protocol.SetVariablesResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setKey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.SetVariablesResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.SetVariablesResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.SetVariablesResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.SetVariablesResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 key = 1;
 * @return {number}
 */
proto.gateway_protocol.SetVariablesResponse.prototype.getKey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.SetVariablesResponse} returns this
 */
proto.gateway_protocol.SetVariablesResponse.prototype.setKey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.repeatedFields_ = [2,3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ModifyProcessInstanceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    processinstancekey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    activateinstructionsList: jspb.Message.toObjectList(msg.getActivateinstructionsList(),
    proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.toObject, includeInstance),
    terminateinstructionsList: jspb.Message.toObjectList(msg.getTerminateinstructionsList(),
    proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ModifyProcessInstanceRequest;
  return proto.gateway_protocol.ModifyProcessInstanceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessinstancekey(value);
      break;
    case 2:
      var value = new proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction;
      reader.readMessage(value,proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.deserializeBinaryFromReader);
      msg.addActivateinstructions(value);
      break;
    case 3:
      var value = new proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction;
      reader.readMessage(value,proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.deserializeBinaryFromReader);
      msg.addTerminateinstructions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ModifyProcessInstanceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getActivateinstructionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.serializeBinaryToWriter
    );
  }
  f = message.getTerminateinstructionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.repeatedFields_ = [3];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.toObject = function(includeInstance, msg) {
  var f, obj = {
    elementid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    ancestorelementinstancekey: jspb.Message.getFieldWithDefault(msg, 2, 0),
    variableinstructionsList: jspb.Message.toObjectList(msg.getVariableinstructionsList(),
    proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction;
  return proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setElementid(value);
      break;
    case 2:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setAncestorelementinstancekey(value);
      break;
    case 3:
      var value = new proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction;
      reader.readMessage(value,proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.deserializeBinaryFromReader);
      msg.addVariableinstructions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getElementid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getAncestorelementinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      2,
      f
    );
  }
  f = message.getVariableinstructionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      3,
      f,
      proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.serializeBinaryToWriter
    );
  }
};


/**
 * optional string elementId = 1;
 * @return {string}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.getElementid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.setElementid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional int64 ancestorElementInstanceKey = 2;
 * @return {number}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.getAncestorelementinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 2, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.setAncestorelementinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 2, value);
};


/**
 * repeated VariableInstruction variableInstructions = 3;
 * @return {!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction>}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.getVariableinstructionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction, 3));
};


/**
 * @param {!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction>} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} returns this
*/
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.setVariableinstructionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.addVariableinstructions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction.prototype.clearVariableinstructionsList = function() {
  return this.setVariableinstructionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.toObject = function(includeInstance, msg) {
  var f, obj = {
    variables: jspb.Message.getFieldWithDefault(msg, 1, ""),
    scopeid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction;
  return proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setScopeid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getScopeid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string variables = 1;
 * @return {string}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string scopeId = 2;
 * @return {string}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.prototype.getScopeid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.VariableInstruction.prototype.setScopeid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.toObject = function(includeInstance, msg) {
  var f, obj = {
    elementinstancekey: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction;
  return proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setElementinstancekey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getElementinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 elementInstanceKey = 1;
 * @return {number}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.prototype.getElementinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction.prototype.setElementinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional int64 processInstanceKey = 1;
 * @return {number}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.getProcessinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.setProcessinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * repeated ActivateInstruction activateInstructions = 2;
 * @return {!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction>}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.getActivateinstructionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction, 2));
};


/**
 * @param {!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction>} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest} returns this
*/
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.setActivateinstructionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.addActivateinstructions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.gateway_protocol.ModifyProcessInstanceRequest.ActivateInstruction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.clearActivateinstructionsList = function() {
  return this.setActivateinstructionsList([]);
};


/**
 * repeated TerminateInstruction terminateInstructions = 3;
 * @return {!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction>}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.getTerminateinstructionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction, 3));
};


/**
 * @param {!Array<!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction>} value
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest} returns this
*/
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.setTerminateinstructionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 3, value);
};


/**
 * @param {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction}
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.addTerminateinstructions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 3, opt_value, proto.gateway_protocol.ModifyProcessInstanceRequest.TerminateInstruction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceRequest} returns this
 */
proto.gateway_protocol.ModifyProcessInstanceRequest.prototype.clearTerminateinstructionsList = function() {
  return this.setTerminateinstructionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.ModifyProcessInstanceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.ModifyProcessInstanceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.ModifyProcessInstanceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceResponse}
 */
proto.gateway_protocol.ModifyProcessInstanceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.ModifyProcessInstanceResponse;
  return proto.gateway_protocol.ModifyProcessInstanceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.ModifyProcessInstanceResponse}
 */
proto.gateway_protocol.ModifyProcessInstanceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.ModifyProcessInstanceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.ModifyProcessInstanceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.ModifyProcessInstanceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.ModifyProcessInstanceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.MigrateProcessInstanceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    processinstancekey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    migrationplan: (f = msg.getMigrationplan()) && proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.toObject(includeInstance, f)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.MigrateProcessInstanceRequest;
  return proto.gateway_protocol.MigrateProcessInstanceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setProcessinstancekey(value);
      break;
    case 2:
      var value = new proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan;
      reader.readMessage(value,proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.deserializeBinaryFromReader);
      msg.setMigrationplan(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.MigrateProcessInstanceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getProcessinstancekey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getMigrationplan();
  if (f != null) {
    writer.writeMessage(
      2,
      f,
      proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.serializeBinaryToWriter
    );
  }
};



/**
 * List of repeated fields within this message type.
 * @private {!Array<number>}
 * @const
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.repeatedFields_ = [2];



if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.toObject = function(includeInstance, msg) {
  var f, obj = {
    targetprocessdefinitionkey: jspb.Message.getFieldWithDefault(msg, 1, 0),
    mappinginstructionsList: jspb.Message.toObjectList(msg.getMappinginstructionsList(),
    proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.toObject, includeInstance)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan;
  return proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setTargetprocessdefinitionkey(value);
      break;
    case 2:
      var value = new proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction;
      reader.readMessage(value,proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.deserializeBinaryFromReader);
      msg.addMappinginstructions(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getTargetprocessdefinitionkey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getMappinginstructionsList();
  if (f.length > 0) {
    writer.writeRepeatedMessage(
      2,
      f,
      proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.serializeBinaryToWriter
    );
  }
};


/**
 * optional int64 targetProcessDefinitionKey = 1;
 * @return {number}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.getTargetprocessdefinitionkey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} returns this
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.setTargetprocessdefinitionkey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * repeated MappingInstruction mappingInstructions = 2;
 * @return {!Array<!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction>}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.getMappinginstructionsList = function() {
  return /** @type{!Array<!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction>} */ (
    jspb.Message.getRepeatedWrapperField(this, proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction, 2));
};


/**
 * @param {!Array<!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction>} value
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} returns this
*/
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.setMappinginstructionsList = function(value) {
  return jspb.Message.setRepeatedWrapperField(this, 2, value);
};


/**
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction=} opt_value
 * @param {number=} opt_index
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.addMappinginstructions = function(opt_value, opt_index) {
  return jspb.Message.addToRepeatedWrapperField(this, 2, opt_value, proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction, opt_index);
};


/**
 * Clears the list making it empty but non-null.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} returns this
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan.prototype.clearMappinginstructionsList = function() {
  return this.setMappinginstructionsList([]);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.toObject = function(includeInstance, msg) {
  var f, obj = {
    sourceelementid: jspb.Message.getFieldWithDefault(msg, 1, ""),
    targetelementid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction;
  return proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSourceelementid(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTargetelementid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSourceelementid();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getTargetelementid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional string sourceElementId = 1;
 * @return {string}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.prototype.getSourceelementid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction} returns this
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.prototype.setSourceelementid = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string targetElementId = 2;
 * @return {string}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.prototype.getTargetelementid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction} returns this
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.MappingInstruction.prototype.setTargetelementid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional int64 processInstanceKey = 1;
 * @return {number}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.getProcessinstancekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.setProcessinstancekey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional MigrationPlan migrationPlan = 2;
 * @return {?proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.getMigrationplan = function() {
  return /** @type{?proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan} */ (
    jspb.Message.getWrapperField(this, proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan, 2));
};


/**
 * @param {?proto.gateway_protocol.MigrateProcessInstanceRequest.MigrationPlan|undefined} value
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest} returns this
*/
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.setMigrationplan = function(value) {
  return jspb.Message.setWrapperField(this, 2, value);
};


/**
 * Clears the message field making it undefined.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceRequest} returns this
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.clearMigrationplan = function() {
  return this.setMigrationplan(undefined);
};


/**
 * Returns whether this field is set.
 * @return {boolean}
 */
proto.gateway_protocol.MigrateProcessInstanceRequest.prototype.hasMigrationplan = function() {
  return jspb.Message.getField(this, 2) != null;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.MigrateProcessInstanceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.MigrateProcessInstanceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.MigrateProcessInstanceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceResponse}
 */
proto.gateway_protocol.MigrateProcessInstanceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.MigrateProcessInstanceResponse;
  return proto.gateway_protocol.MigrateProcessInstanceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.MigrateProcessInstanceResponse}
 */
proto.gateway_protocol.MigrateProcessInstanceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.MigrateProcessInstanceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.MigrateProcessInstanceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.MigrateProcessInstanceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.MigrateProcessInstanceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DeleteResourceRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DeleteResourceRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DeleteResourceRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeleteResourceRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    resourcekey: jspb.Message.getFieldWithDefault(msg, 1, 0)
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DeleteResourceRequest}
 */
proto.gateway_protocol.DeleteResourceRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DeleteResourceRequest;
  return proto.gateway_protocol.DeleteResourceRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DeleteResourceRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DeleteResourceRequest}
 */
proto.gateway_protocol.DeleteResourceRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setResourcekey(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DeleteResourceRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DeleteResourceRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DeleteResourceRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeleteResourceRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getResourcekey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
};


/**
 * optional int64 resourceKey = 1;
 * @return {number}
 */
proto.gateway_protocol.DeleteResourceRequest.prototype.getResourcekey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.DeleteResourceRequest} returns this
 */
proto.gateway_protocol.DeleteResourceRequest.prototype.setResourcekey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.DeleteResourceResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.DeleteResourceResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.DeleteResourceResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeleteResourceResponse.toObject = function(includeInstance, msg) {
  var f, obj = {

  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.DeleteResourceResponse}
 */
proto.gateway_protocol.DeleteResourceResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.DeleteResourceResponse;
  return proto.gateway_protocol.DeleteResourceResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.DeleteResourceResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.DeleteResourceResponse}
 */
proto.gateway_protocol.DeleteResourceResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.DeleteResourceResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.DeleteResourceResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.DeleteResourceResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.DeleteResourceResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.BroadcastSignalRequest.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.BroadcastSignalRequest} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.BroadcastSignalRequest.toObject = function(includeInstance, msg) {
  var f, obj = {
    signalname: jspb.Message.getFieldWithDefault(msg, 1, ""),
    variables: jspb.Message.getFieldWithDefault(msg, 2, ""),
    tenantid: jspb.Message.getFieldWithDefault(msg, 3, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.BroadcastSignalRequest}
 */
proto.gateway_protocol.BroadcastSignalRequest.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.BroadcastSignalRequest;
  return proto.gateway_protocol.BroadcastSignalRequest.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.BroadcastSignalRequest} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.BroadcastSignalRequest}
 */
proto.gateway_protocol.BroadcastSignalRequest.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {string} */ (reader.readString());
      msg.setSignalname(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setVariables(value);
      break;
    case 3:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.BroadcastSignalRequest.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.BroadcastSignalRequest} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.BroadcastSignalRequest.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getSignalname();
  if (f.length > 0) {
    writer.writeString(
      1,
      f
    );
  }
  f = message.getVariables();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      3,
      f
    );
  }
};


/**
 * optional string signalName = 1;
 * @return {string}
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.getSignalname = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 1, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.BroadcastSignalRequest} returns this
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.setSignalname = function(value) {
  return jspb.Message.setProto3StringField(this, 1, value);
};


/**
 * optional string variables = 2;
 * @return {string}
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.getVariables = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.BroadcastSignalRequest} returns this
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.setVariables = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


/**
 * optional string tenantId = 3;
 * @return {string}
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 3, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.BroadcastSignalRequest} returns this
 */
proto.gateway_protocol.BroadcastSignalRequest.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 3, value);
};





if (jspb.Message.GENERATE_TO_OBJECT) {
/**
 * Creates an object representation of this proto.
 * Field names that are reserved in JavaScript and will be renamed to pb_name.
 * Optional fields that are not set will be set to undefined.
 * To access a reserved field use, foo.pb_<name>, eg, foo.pb_default.
 * For the list of reserved names please see:
 *     net/proto2/compiler/js/internal/generator.cc#kKeyword.
 * @param {boolean=} opt_includeInstance Deprecated. whether to include the
 *     JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @return {!Object}
 */
proto.gateway_protocol.BroadcastSignalResponse.prototype.toObject = function(opt_includeInstance) {
  return proto.gateway_protocol.BroadcastSignalResponse.toObject(opt_includeInstance, this);
};


/**
 * Static version of the {@see toObject} method.
 * @param {boolean|undefined} includeInstance Deprecated. Whether to include
 *     the JSPB instance for transitional soy proto support:
 *     http://goto/soy-param-migration
 * @param {!proto.gateway_protocol.BroadcastSignalResponse} msg The msg instance to transform.
 * @return {!Object}
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.BroadcastSignalResponse.toObject = function(includeInstance, msg) {
  var f, obj = {
    key: jspb.Message.getFieldWithDefault(msg, 1, 0),
    tenantid: jspb.Message.getFieldWithDefault(msg, 2, "")
  };

  if (includeInstance) {
    obj.$jspbMessageInstance = msg;
  }
  return obj;
};
}


/**
 * Deserializes binary data (in protobuf wire format).
 * @param {jspb.ByteSource} bytes The bytes to deserialize.
 * @return {!proto.gateway_protocol.BroadcastSignalResponse}
 */
proto.gateway_protocol.BroadcastSignalResponse.deserializeBinary = function(bytes) {
  var reader = new jspb.BinaryReader(bytes);
  var msg = new proto.gateway_protocol.BroadcastSignalResponse;
  return proto.gateway_protocol.BroadcastSignalResponse.deserializeBinaryFromReader(msg, reader);
};


/**
 * Deserializes binary data (in protobuf wire format) from the
 * given reader into the given message object.
 * @param {!proto.gateway_protocol.BroadcastSignalResponse} msg The message object to deserialize into.
 * @param {!jspb.BinaryReader} reader The BinaryReader to use.
 * @return {!proto.gateway_protocol.BroadcastSignalResponse}
 */
proto.gateway_protocol.BroadcastSignalResponse.deserializeBinaryFromReader = function(msg, reader) {
  while (reader.nextField()) {
    if (reader.isEndGroup()) {
      break;
    }
    var field = reader.getFieldNumber();
    switch (field) {
    case 1:
      var value = /** @type {number} */ (reader.readInt64());
      msg.setKey(value);
      break;
    case 2:
      var value = /** @type {string} */ (reader.readString());
      msg.setTenantid(value);
      break;
    default:
      reader.skipField();
      break;
    }
  }
  return msg;
};


/**
 * Serializes the message to binary data (in protobuf wire format).
 * @return {!Uint8Array}
 */
proto.gateway_protocol.BroadcastSignalResponse.prototype.serializeBinary = function() {
  var writer = new jspb.BinaryWriter();
  proto.gateway_protocol.BroadcastSignalResponse.serializeBinaryToWriter(this, writer);
  return writer.getResultBuffer();
};


/**
 * Serializes the given message to binary data (in protobuf wire
 * format), writing to the given BinaryWriter.
 * @param {!proto.gateway_protocol.BroadcastSignalResponse} message
 * @param {!jspb.BinaryWriter} writer
 * @suppress {unusedLocalVariables} f is only used for nested messages
 */
proto.gateway_protocol.BroadcastSignalResponse.serializeBinaryToWriter = function(message, writer) {
  var f = undefined;
  f = message.getKey();
  if (f !== 0) {
    writer.writeInt64(
      1,
      f
    );
  }
  f = message.getTenantid();
  if (f.length > 0) {
    writer.writeString(
      2,
      f
    );
  }
};


/**
 * optional int64 key = 1;
 * @return {number}
 */
proto.gateway_protocol.BroadcastSignalResponse.prototype.getKey = function() {
  return /** @type {number} */ (jspb.Message.getFieldWithDefault(this, 1, 0));
};


/**
 * @param {number} value
 * @return {!proto.gateway_protocol.BroadcastSignalResponse} returns this
 */
proto.gateway_protocol.BroadcastSignalResponse.prototype.setKey = function(value) {
  return jspb.Message.setProto3IntField(this, 1, value);
};


/**
 * optional string tenantId = 2;
 * @return {string}
 */
proto.gateway_protocol.BroadcastSignalResponse.prototype.getTenantid = function() {
  return /** @type {string} */ (jspb.Message.getFieldWithDefault(this, 2, ""));
};


/**
 * @param {string} value
 * @return {!proto.gateway_protocol.BroadcastSignalResponse} returns this
 */
proto.gateway_protocol.BroadcastSignalResponse.prototype.setTenantid = function(value) {
  return jspb.Message.setProto3StringField(this, 2, value);
};


goog.object.extend(exports, proto.gateway_protocol);
