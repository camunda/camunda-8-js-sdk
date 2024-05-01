// package: gateway_protocol
// file: zeebe.proto

import * as jspb from 'google-protobuf'

export class StreamActivatedJobsRequest extends jspb.Message {
	getType(): string
	setType(value: string): void

	getWorker(): string
	setWorker(value: string): void

	getTimeout(): number
	setTimeout(value: number): void

	clearFetchvariableList(): void
	getFetchvariableList(): Array<string>
	setFetchvariableList(value: Array<string>): void
	addFetchvariable(value: string, index?: number): string

	clearTenantidsList(): void
	getTenantidsList(): Array<string>
	setTenantidsList(value: Array<string>): void
	addTenantids(value: string, index?: number): string

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): StreamActivatedJobsRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: StreamActivatedJobsRequest
	): StreamActivatedJobsRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: StreamActivatedJobsRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): StreamActivatedJobsRequest
	static deserializeBinaryFromReader(
		message: StreamActivatedJobsRequest,
		reader: jspb.BinaryReader
	): StreamActivatedJobsRequest
}

export namespace StreamActivatedJobsRequest {
	export type AsObject = {
		type: string
		worker: string
		timeout: number
		fetchvariableList: Array<string>
		tenantidsList: Array<string>
	}
}

export class ActivateJobsRequest extends jspb.Message {
	getType(): string
	setType(value: string): void

	getWorker(): string
	setWorker(value: string): void

	getTimeout(): number
	setTimeout(value: number): void

	getMaxjobstoactivate(): number
	setMaxjobstoactivate(value: number): void

	clearFetchvariableList(): void
	getFetchvariableList(): Array<string>
	setFetchvariableList(value: Array<string>): void
	addFetchvariable(value: string, index?: number): string

	getRequesttimeout(): number
	setRequesttimeout(value: number): void

	clearTenantidsList(): void
	getTenantidsList(): Array<string>
	setTenantidsList(value: Array<string>): void
	addTenantids(value: string, index?: number): string

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ActivateJobsRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ActivateJobsRequest
	): ActivateJobsRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ActivateJobsRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ActivateJobsRequest
	static deserializeBinaryFromReader(
		message: ActivateJobsRequest,
		reader: jspb.BinaryReader
	): ActivateJobsRequest
}

export namespace ActivateJobsRequest {
	export type AsObject = {
		type: string
		worker: string
		timeout: number
		maxjobstoactivate: number
		fetchvariableList: Array<string>
		requesttimeout: number
		tenantidsList: Array<string>
	}
}

export class ActivateJobsResponse extends jspb.Message {
	clearJobsList(): void
	getJobsList(): Array<ActivatedJob>
	setJobsList(value: Array<ActivatedJob>): void
	addJobs(value?: ActivatedJob, index?: number): ActivatedJob

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ActivateJobsResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ActivateJobsResponse
	): ActivateJobsResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ActivateJobsResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ActivateJobsResponse
	static deserializeBinaryFromReader(
		message: ActivateJobsResponse,
		reader: jspb.BinaryReader
	): ActivateJobsResponse
}

export namespace ActivateJobsResponse {
	export type AsObject = {
		jobsList: Array<ActivatedJob.AsObject>
	}
}

export class ActivatedJob extends jspb.Message {
	getKey(): number
	setKey(value: number): void

	getType(): string
	setType(value: string): void

	getProcessinstancekey(): number
	setProcessinstancekey(value: number): void

	getBpmnprocessid(): string
	setBpmnprocessid(value: string): void

	getProcessdefinitionversion(): number
	setProcessdefinitionversion(value: number): void

	getProcessdefinitionkey(): number
	setProcessdefinitionkey(value: number): void

	getElementid(): string
	setElementid(value: string): void

	getElementinstancekey(): number
	setElementinstancekey(value: number): void

	getCustomheaders(): string
	setCustomheaders(value: string): void

	getWorker(): string
	setWorker(value: string): void

	getRetries(): number
	setRetries(value: number): void

	getDeadline(): number
	setDeadline(value: number): void

	getVariables(): string
	setVariables(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ActivatedJob.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ActivatedJob
	): ActivatedJob.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ActivatedJob,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ActivatedJob
	static deserializeBinaryFromReader(
		message: ActivatedJob,
		reader: jspb.BinaryReader
	): ActivatedJob
}

export namespace ActivatedJob {
	export type AsObject = {
		key: number
		type: string
		processinstancekey: number
		bpmnprocessid: string
		processdefinitionversion: number
		processdefinitionkey: number
		elementid: string
		elementinstancekey: number
		customheaders: string
		worker: string
		retries: number
		deadline: number
		variables: string
		tenantid: string
	}
}

export class CancelProcessInstanceRequest extends jspb.Message {
	getProcessinstancekey(): number
	setProcessinstancekey(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): CancelProcessInstanceRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CancelProcessInstanceRequest
	): CancelProcessInstanceRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CancelProcessInstanceRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): CancelProcessInstanceRequest
	static deserializeBinaryFromReader(
		message: CancelProcessInstanceRequest,
		reader: jspb.BinaryReader
	): CancelProcessInstanceRequest
}

export namespace CancelProcessInstanceRequest {
	export type AsObject = {
		processinstancekey: number
	}
}

export class CancelProcessInstanceResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): CancelProcessInstanceResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CancelProcessInstanceResponse
	): CancelProcessInstanceResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CancelProcessInstanceResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): CancelProcessInstanceResponse
	static deserializeBinaryFromReader(
		message: CancelProcessInstanceResponse,
		reader: jspb.BinaryReader
	): CancelProcessInstanceResponse
}

export namespace CancelProcessInstanceResponse {
	export type AsObject = {}
}

export class CompleteJobRequest extends jspb.Message {
	getJobkey(): number
	setJobkey(value: number): void

	getVariables(): string
	setVariables(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): CompleteJobRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CompleteJobRequest
	): CompleteJobRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CompleteJobRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): CompleteJobRequest
	static deserializeBinaryFromReader(
		message: CompleteJobRequest,
		reader: jspb.BinaryReader
	): CompleteJobRequest
}

export namespace CompleteJobRequest {
	export type AsObject = {
		jobkey: number
		variables: string
	}
}

export class CompleteJobResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): CompleteJobResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CompleteJobResponse
	): CompleteJobResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CompleteJobResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): CompleteJobResponse
	static deserializeBinaryFromReader(
		message: CompleteJobResponse,
		reader: jspb.BinaryReader
	): CompleteJobResponse
}

export namespace CompleteJobResponse {
	export type AsObject = {}
}

export class CreateProcessInstanceRequest extends jspb.Message {
	getProcessdefinitionkey(): number
	setProcessdefinitionkey(value: number): void

	getBpmnprocessid(): string
	setBpmnprocessid(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getVariables(): string
	setVariables(value: string): void

	clearStartinstructionsList(): void
	getStartinstructionsList(): Array<ProcessInstanceCreationStartInstruction>
	setStartinstructionsList(
		value: Array<ProcessInstanceCreationStartInstruction>
	): void
	addStartinstructions(
		value?: ProcessInstanceCreationStartInstruction,
		index?: number
	): ProcessInstanceCreationStartInstruction

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): CreateProcessInstanceRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CreateProcessInstanceRequest
	): CreateProcessInstanceRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CreateProcessInstanceRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): CreateProcessInstanceRequest
	static deserializeBinaryFromReader(
		message: CreateProcessInstanceRequest,
		reader: jspb.BinaryReader
	): CreateProcessInstanceRequest
}

export namespace CreateProcessInstanceRequest {
	export type AsObject = {
		processdefinitionkey: number
		bpmnprocessid: string
		version: number
		variables: string
		startinstructionsList: Array<ProcessInstanceCreationStartInstruction.AsObject>
		tenantid: string
	}
}

export class ProcessInstanceCreationStartInstruction extends jspb.Message {
	getElementid(): string
	setElementid(value: string): void

	serializeBinary(): Uint8Array
	toObject(
		includeInstance?: boolean
	): ProcessInstanceCreationStartInstruction.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ProcessInstanceCreationStartInstruction
	): ProcessInstanceCreationStartInstruction.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ProcessInstanceCreationStartInstruction,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(
		bytes: Uint8Array
	): ProcessInstanceCreationStartInstruction
	static deserializeBinaryFromReader(
		message: ProcessInstanceCreationStartInstruction,
		reader: jspb.BinaryReader
	): ProcessInstanceCreationStartInstruction
}

export namespace ProcessInstanceCreationStartInstruction {
	export type AsObject = {
		elementid: string
	}
}

export class CreateProcessInstanceResponse extends jspb.Message {
	getProcessdefinitionkey(): number
	setProcessdefinitionkey(value: number): void

	getBpmnprocessid(): string
	setBpmnprocessid(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getProcessinstancekey(): number
	setProcessinstancekey(value: number): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): CreateProcessInstanceResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CreateProcessInstanceResponse
	): CreateProcessInstanceResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CreateProcessInstanceResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): CreateProcessInstanceResponse
	static deserializeBinaryFromReader(
		message: CreateProcessInstanceResponse,
		reader: jspb.BinaryReader
	): CreateProcessInstanceResponse
}

export namespace CreateProcessInstanceResponse {
	export type AsObject = {
		processdefinitionkey: number
		bpmnprocessid: string
		version: number
		processinstancekey: number
		tenantid: string
	}
}

export class CreateProcessInstanceWithResultRequest extends jspb.Message {
	hasRequest(): boolean
	clearRequest(): void
	getRequest(): CreateProcessInstanceRequest | undefined
	setRequest(value?: CreateProcessInstanceRequest): void

	getRequesttimeout(): number
	setRequesttimeout(value: number): void

	clearFetchvariablesList(): void
	getFetchvariablesList(): Array<string>
	setFetchvariablesList(value: Array<string>): void
	addFetchvariables(value: string, index?: number): string

	serializeBinary(): Uint8Array
	toObject(
		includeInstance?: boolean
	): CreateProcessInstanceWithResultRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CreateProcessInstanceWithResultRequest
	): CreateProcessInstanceWithResultRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CreateProcessInstanceWithResultRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(
		bytes: Uint8Array
	): CreateProcessInstanceWithResultRequest
	static deserializeBinaryFromReader(
		message: CreateProcessInstanceWithResultRequest,
		reader: jspb.BinaryReader
	): CreateProcessInstanceWithResultRequest
}

export namespace CreateProcessInstanceWithResultRequest {
	export type AsObject = {
		request?: CreateProcessInstanceRequest.AsObject
		requesttimeout: number
		fetchvariablesList: Array<string>
	}
}

export class CreateProcessInstanceWithResultResponse extends jspb.Message {
	getProcessdefinitionkey(): number
	setProcessdefinitionkey(value: number): void

	getBpmnprocessid(): string
	setBpmnprocessid(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getProcessinstancekey(): number
	setProcessinstancekey(value: number): void

	getVariables(): string
	setVariables(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(
		includeInstance?: boolean
	): CreateProcessInstanceWithResultResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: CreateProcessInstanceWithResultResponse
	): CreateProcessInstanceWithResultResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: CreateProcessInstanceWithResultResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(
		bytes: Uint8Array
	): CreateProcessInstanceWithResultResponse
	static deserializeBinaryFromReader(
		message: CreateProcessInstanceWithResultResponse,
		reader: jspb.BinaryReader
	): CreateProcessInstanceWithResultResponse
}

export namespace CreateProcessInstanceWithResultResponse {
	export type AsObject = {
		processdefinitionkey: number
		bpmnprocessid: string
		version: number
		processinstancekey: number
		variables: string
		tenantid: string
	}
}

export class EvaluateDecisionRequest extends jspb.Message {
	getDecisionkey(): number
	setDecisionkey(value: number): void

	getDecisionid(): string
	setDecisionid(value: string): void

	getVariables(): string
	setVariables(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): EvaluateDecisionRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: EvaluateDecisionRequest
	): EvaluateDecisionRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: EvaluateDecisionRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): EvaluateDecisionRequest
	static deserializeBinaryFromReader(
		message: EvaluateDecisionRequest,
		reader: jspb.BinaryReader
	): EvaluateDecisionRequest
}

export namespace EvaluateDecisionRequest {
	export type AsObject = {
		decisionkey: number
		decisionid: string
		variables: string
		tenantid: string
	}
}

export class EvaluateDecisionResponse extends jspb.Message {
	getDecisionkey(): number
	setDecisionkey(value: number): void

	getDecisionid(): string
	setDecisionid(value: string): void

	getDecisionname(): string
	setDecisionname(value: string): void

	getDecisionversion(): number
	setDecisionversion(value: number): void

	getDecisionrequirementsid(): string
	setDecisionrequirementsid(value: string): void

	getDecisionrequirementskey(): number
	setDecisionrequirementskey(value: number): void

	getDecisionoutput(): string
	setDecisionoutput(value: string): void

	clearEvaluateddecisionsList(): void
	getEvaluateddecisionsList(): Array<EvaluatedDecision>
	setEvaluateddecisionsList(value: Array<EvaluatedDecision>): void
	addEvaluateddecisions(
		value?: EvaluatedDecision,
		index?: number
	): EvaluatedDecision

	getFaileddecisionid(): string
	setFaileddecisionid(value: string): void

	getFailuremessage(): string
	setFailuremessage(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	getDecisioninstancekey(): number
	setDecisioninstancekey(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): EvaluateDecisionResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: EvaluateDecisionResponse
	): EvaluateDecisionResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: EvaluateDecisionResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): EvaluateDecisionResponse
	static deserializeBinaryFromReader(
		message: EvaluateDecisionResponse,
		reader: jspb.BinaryReader
	): EvaluateDecisionResponse
}

export namespace EvaluateDecisionResponse {
	export type AsObject = {
		decisionkey: number
		decisionid: string
		decisionname: string
		decisionversion: number
		decisionrequirementsid: string
		decisionrequirementskey: number
		decisionoutput: string
		evaluateddecisionsList: Array<EvaluatedDecision.AsObject>
		faileddecisionid: string
		failuremessage: string
		tenantid: string
		decisioninstancekey: number
	}
}

export class EvaluatedDecision extends jspb.Message {
	getDecisionkey(): number
	setDecisionkey(value: number): void

	getDecisionid(): string
	setDecisionid(value: string): void

	getDecisionname(): string
	setDecisionname(value: string): void

	getDecisionversion(): number
	setDecisionversion(value: number): void

	getDecisiontype(): string
	setDecisiontype(value: string): void

	getDecisionoutput(): string
	setDecisionoutput(value: string): void

	clearMatchedrulesList(): void
	getMatchedrulesList(): Array<MatchedDecisionRule>
	setMatchedrulesList(value: Array<MatchedDecisionRule>): void
	addMatchedrules(
		value?: MatchedDecisionRule,
		index?: number
	): MatchedDecisionRule

	clearEvaluatedinputsList(): void
	getEvaluatedinputsList(): Array<EvaluatedDecisionInput>
	setEvaluatedinputsList(value: Array<EvaluatedDecisionInput>): void
	addEvaluatedinputs(
		value?: EvaluatedDecisionInput,
		index?: number
	): EvaluatedDecisionInput

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): EvaluatedDecision.AsObject
	static toObject(
		includeInstance: boolean,
		msg: EvaluatedDecision
	): EvaluatedDecision.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: EvaluatedDecision,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): EvaluatedDecision
	static deserializeBinaryFromReader(
		message: EvaluatedDecision,
		reader: jspb.BinaryReader
	): EvaluatedDecision
}

export namespace EvaluatedDecision {
	export type AsObject = {
		decisionkey: number
		decisionid: string
		decisionname: string
		decisionversion: number
		decisiontype: string
		decisionoutput: string
		matchedrulesList: Array<MatchedDecisionRule.AsObject>
		evaluatedinputsList: Array<EvaluatedDecisionInput.AsObject>
		tenantid: string
	}
}

export class EvaluatedDecisionInput extends jspb.Message {
	getInputid(): string
	setInputid(value: string): void

	getInputname(): string
	setInputname(value: string): void

	getInputvalue(): string
	setInputvalue(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): EvaluatedDecisionInput.AsObject
	static toObject(
		includeInstance: boolean,
		msg: EvaluatedDecisionInput
	): EvaluatedDecisionInput.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: EvaluatedDecisionInput,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): EvaluatedDecisionInput
	static deserializeBinaryFromReader(
		message: EvaluatedDecisionInput,
		reader: jspb.BinaryReader
	): EvaluatedDecisionInput
}

export namespace EvaluatedDecisionInput {
	export type AsObject = {
		inputid: string
		inputname: string
		inputvalue: string
	}
}

export class EvaluatedDecisionOutput extends jspb.Message {
	getOutputid(): string
	setOutputid(value: string): void

	getOutputname(): string
	setOutputname(value: string): void

	getOutputvalue(): string
	setOutputvalue(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): EvaluatedDecisionOutput.AsObject
	static toObject(
		includeInstance: boolean,
		msg: EvaluatedDecisionOutput
	): EvaluatedDecisionOutput.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: EvaluatedDecisionOutput,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): EvaluatedDecisionOutput
	static deserializeBinaryFromReader(
		message: EvaluatedDecisionOutput,
		reader: jspb.BinaryReader
	): EvaluatedDecisionOutput
}

export namespace EvaluatedDecisionOutput {
	export type AsObject = {
		outputid: string
		outputname: string
		outputvalue: string
	}
}

export class MatchedDecisionRule extends jspb.Message {
	getRuleid(): string
	setRuleid(value: string): void

	getRuleindex(): number
	setRuleindex(value: number): void

	clearEvaluatedoutputsList(): void
	getEvaluatedoutputsList(): Array<EvaluatedDecisionOutput>
	setEvaluatedoutputsList(value: Array<EvaluatedDecisionOutput>): void
	addEvaluatedoutputs(
		value?: EvaluatedDecisionOutput,
		index?: number
	): EvaluatedDecisionOutput

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): MatchedDecisionRule.AsObject
	static toObject(
		includeInstance: boolean,
		msg: MatchedDecisionRule
	): MatchedDecisionRule.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: MatchedDecisionRule,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): MatchedDecisionRule
	static deserializeBinaryFromReader(
		message: MatchedDecisionRule,
		reader: jspb.BinaryReader
	): MatchedDecisionRule
}

export namespace MatchedDecisionRule {
	export type AsObject = {
		ruleid: string
		ruleindex: number
		evaluatedoutputsList: Array<EvaluatedDecisionOutput.AsObject>
	}
}

export class DeployProcessRequest extends jspb.Message {
	clearProcessesList(): void
	getProcessesList(): Array<ProcessRequestObject>
	setProcessesList(value: Array<ProcessRequestObject>): void
	addProcesses(
		value?: ProcessRequestObject,
		index?: number
	): ProcessRequestObject

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DeployProcessRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DeployProcessRequest
	): DeployProcessRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DeployProcessRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DeployProcessRequest
	static deserializeBinaryFromReader(
		message: DeployProcessRequest,
		reader: jspb.BinaryReader
	): DeployProcessRequest
}

export namespace DeployProcessRequest {
	export type AsObject = {
		processesList: Array<ProcessRequestObject.AsObject>
	}
}

export class ProcessRequestObject extends jspb.Message {
	getName(): string
	setName(value: string): void

	getDefinition(): Uint8Array | string
	getDefinition_asU8(): Uint8Array
	getDefinition_asB64(): string
	setDefinition(value: Uint8Array | string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ProcessRequestObject.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ProcessRequestObject
	): ProcessRequestObject.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ProcessRequestObject,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ProcessRequestObject
	static deserializeBinaryFromReader(
		message: ProcessRequestObject,
		reader: jspb.BinaryReader
	): ProcessRequestObject
}

export namespace ProcessRequestObject {
	export type AsObject = {
		name: string
		definition: Uint8Array | string
	}
}

export class DeployProcessResponse extends jspb.Message {
	getKey(): number
	setKey(value: number): void

	clearProcessesList(): void
	getProcessesList(): Array<ProcessMetadata>
	setProcessesList(value: Array<ProcessMetadata>): void
	addProcesses(value?: ProcessMetadata, index?: number): ProcessMetadata

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DeployProcessResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DeployProcessResponse
	): DeployProcessResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DeployProcessResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DeployProcessResponse
	static deserializeBinaryFromReader(
		message: DeployProcessResponse,
		reader: jspb.BinaryReader
	): DeployProcessResponse
}

export namespace DeployProcessResponse {
	export type AsObject = {
		key: number
		processesList: Array<ProcessMetadata.AsObject>
	}
}

export class DeployResourceRequest extends jspb.Message {
	clearResourcesList(): void
	getResourcesList(): Array<Resource>
	setResourcesList(value: Array<Resource>): void
	addResources(value?: Resource, index?: number): Resource

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DeployResourceRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DeployResourceRequest
	): DeployResourceRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DeployResourceRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DeployResourceRequest
	static deserializeBinaryFromReader(
		message: DeployResourceRequest,
		reader: jspb.BinaryReader
	): DeployResourceRequest
}

export namespace DeployResourceRequest {
	export type AsObject = {
		resourcesList: Array<Resource.AsObject>
		tenantid: string
	}
}

export class Resource extends jspb.Message {
	getName(): string
	setName(value: string): void

	getContent(): Uint8Array | string
	getContent_asU8(): Uint8Array
	getContent_asB64(): string
	setContent(value: Uint8Array | string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): Resource.AsObject
	static toObject(includeInstance: boolean, msg: Resource): Resource.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: Resource,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): Resource
	static deserializeBinaryFromReader(
		message: Resource,
		reader: jspb.BinaryReader
	): Resource
}

export namespace Resource {
	export type AsObject = {
		name: string
		content: Uint8Array | string
	}
}

export class DeployResourceResponse extends jspb.Message {
	getKey(): number
	setKey(value: number): void

	clearDeploymentsList(): void
	getDeploymentsList(): Array<Deployment>
	setDeploymentsList(value: Array<Deployment>): void
	addDeployments(value?: Deployment, index?: number): Deployment

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DeployResourceResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DeployResourceResponse
	): DeployResourceResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DeployResourceResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DeployResourceResponse
	static deserializeBinaryFromReader(
		message: DeployResourceResponse,
		reader: jspb.BinaryReader
	): DeployResourceResponse
}

export namespace DeployResourceResponse {
	export type AsObject = {
		key: number
		deploymentsList: Array<Deployment.AsObject>
		tenantid: string
	}
}

export class Deployment extends jspb.Message {
	hasProcess(): boolean
	clearProcess(): void
	getProcess(): ProcessMetadata | undefined
	setProcess(value?: ProcessMetadata): void

	hasDecision(): boolean
	clearDecision(): void
	getDecision(): DecisionMetadata | undefined
	setDecision(value?: DecisionMetadata): void

	hasDecisionrequirements(): boolean
	clearDecisionrequirements(): void
	getDecisionrequirements(): DecisionRequirementsMetadata | undefined
	setDecisionrequirements(value?: DecisionRequirementsMetadata): void

	hasForm(): boolean
	clearForm(): void
	getForm(): FormMetadata | undefined
	setForm(value?: FormMetadata): void

	getMetadataCase(): Deployment.MetadataCase
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): Deployment.AsObject
	static toObject(
		includeInstance: boolean,
		msg: Deployment
	): Deployment.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: Deployment,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): Deployment
	static deserializeBinaryFromReader(
		message: Deployment,
		reader: jspb.BinaryReader
	): Deployment
}

export namespace Deployment {
	export type AsObject = {
		process?: ProcessMetadata.AsObject
		decision?: DecisionMetadata.AsObject
		decisionrequirements?: DecisionRequirementsMetadata.AsObject
		form?: FormMetadata.AsObject
	}

	export enum MetadataCase {
		METADATA_NOT_SET = 0,
		PROCESS = 1,
		DECISION = 2,
		DECISIONREQUIREMENTS = 3,
		FORM = 4,
	}
}

export class ProcessMetadata extends jspb.Message {
	getBpmnprocessid(): string
	setBpmnprocessid(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getProcessdefinitionkey(): number
	setProcessdefinitionkey(value: number): void

	getResourcename(): string
	setResourcename(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ProcessMetadata.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ProcessMetadata
	): ProcessMetadata.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ProcessMetadata,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ProcessMetadata
	static deserializeBinaryFromReader(
		message: ProcessMetadata,
		reader: jspb.BinaryReader
	): ProcessMetadata
}

export namespace ProcessMetadata {
	export type AsObject = {
		bpmnprocessid: string
		version: number
		processdefinitionkey: number
		resourcename: string
		tenantid: string
	}
}

export class DecisionMetadata extends jspb.Message {
	getDmndecisionid(): string
	setDmndecisionid(value: string): void

	getDmndecisionname(): string
	setDmndecisionname(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getDecisionkey(): number
	setDecisionkey(value: number): void

	getDmndecisionrequirementsid(): string
	setDmndecisionrequirementsid(value: string): void

	getDecisionrequirementskey(): number
	setDecisionrequirementskey(value: number): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DecisionMetadata.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DecisionMetadata
	): DecisionMetadata.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DecisionMetadata,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DecisionMetadata
	static deserializeBinaryFromReader(
		message: DecisionMetadata,
		reader: jspb.BinaryReader
	): DecisionMetadata
}

export namespace DecisionMetadata {
	export type AsObject = {
		dmndecisionid: string
		dmndecisionname: string
		version: number
		decisionkey: number
		dmndecisionrequirementsid: string
		decisionrequirementskey: number
		tenantid: string
	}
}

export class DecisionRequirementsMetadata extends jspb.Message {
	getDmndecisionrequirementsid(): string
	setDmndecisionrequirementsid(value: string): void

	getDmndecisionrequirementsname(): string
	setDmndecisionrequirementsname(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getDecisionrequirementskey(): number
	setDecisionrequirementskey(value: number): void

	getResourcename(): string
	setResourcename(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DecisionRequirementsMetadata.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DecisionRequirementsMetadata
	): DecisionRequirementsMetadata.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DecisionRequirementsMetadata,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DecisionRequirementsMetadata
	static deserializeBinaryFromReader(
		message: DecisionRequirementsMetadata,
		reader: jspb.BinaryReader
	): DecisionRequirementsMetadata
}

export namespace DecisionRequirementsMetadata {
	export type AsObject = {
		dmndecisionrequirementsid: string
		dmndecisionrequirementsname: string
		version: number
		decisionrequirementskey: number
		resourcename: string
		tenantid: string
	}
}

export class FormMetadata extends jspb.Message {
	getFormid(): string
	setFormid(value: string): void

	getVersion(): number
	setVersion(value: number): void

	getFormkey(): number
	setFormkey(value: number): void

	getResourcename(): string
	setResourcename(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): FormMetadata.AsObject
	static toObject(
		includeInstance: boolean,
		msg: FormMetadata
	): FormMetadata.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: FormMetadata,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): FormMetadata
	static deserializeBinaryFromReader(
		message: FormMetadata,
		reader: jspb.BinaryReader
	): FormMetadata
}

export namespace FormMetadata {
	export type AsObject = {
		formid: string
		version: number
		formkey: number
		resourcename: string
		tenantid: string
	}
}

export class FailJobRequest extends jspb.Message {
	getJobkey(): number
	setJobkey(value: number): void

	getRetries(): number
	setRetries(value: number): void

	getErrormessage(): string
	setErrormessage(value: string): void

	getRetrybackoff(): number
	setRetrybackoff(value: number): void

	getVariables(): string
	setVariables(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): FailJobRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: FailJobRequest
	): FailJobRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: FailJobRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): FailJobRequest
	static deserializeBinaryFromReader(
		message: FailJobRequest,
		reader: jspb.BinaryReader
	): FailJobRequest
}

export namespace FailJobRequest {
	export type AsObject = {
		jobkey: number
		retries: number
		errormessage: string
		retrybackoff: number
		variables: string
	}
}

export class FailJobResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): FailJobResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: FailJobResponse
	): FailJobResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: FailJobResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): FailJobResponse
	static deserializeBinaryFromReader(
		message: FailJobResponse,
		reader: jspb.BinaryReader
	): FailJobResponse
}

export namespace FailJobResponse {
	export type AsObject = {}
}

export class ThrowErrorRequest extends jspb.Message {
	getJobkey(): number
	setJobkey(value: number): void

	getErrorcode(): string
	setErrorcode(value: string): void

	getErrormessage(): string
	setErrormessage(value: string): void

	getVariables(): string
	setVariables(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ThrowErrorRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ThrowErrorRequest
	): ThrowErrorRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ThrowErrorRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ThrowErrorRequest
	static deserializeBinaryFromReader(
		message: ThrowErrorRequest,
		reader: jspb.BinaryReader
	): ThrowErrorRequest
}

export namespace ThrowErrorRequest {
	export type AsObject = {
		jobkey: number
		errorcode: string
		errormessage: string
		variables: string
	}
}

export class ThrowErrorResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ThrowErrorResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ThrowErrorResponse
	): ThrowErrorResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ThrowErrorResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ThrowErrorResponse
	static deserializeBinaryFromReader(
		message: ThrowErrorResponse,
		reader: jspb.BinaryReader
	): ThrowErrorResponse
}

export namespace ThrowErrorResponse {
	export type AsObject = {}
}

export class PublishMessageRequest extends jspb.Message {
	getName(): string
	setName(value: string): void

	getCorrelationkey(): string
	setCorrelationkey(value: string): void

	getTimetolive(): number
	setTimetolive(value: number): void

	getMessageid(): string
	setMessageid(value: string): void

	getVariables(): string
	setVariables(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): PublishMessageRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: PublishMessageRequest
	): PublishMessageRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: PublishMessageRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): PublishMessageRequest
	static deserializeBinaryFromReader(
		message: PublishMessageRequest,
		reader: jspb.BinaryReader
	): PublishMessageRequest
}

export namespace PublishMessageRequest {
	export type AsObject = {
		name: string
		correlationkey: string
		timetolive: number
		messageid: string
		variables: string
		tenantid: string
	}
}

export class PublishMessageResponse extends jspb.Message {
	getKey(): number
	setKey(value: number): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): PublishMessageResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: PublishMessageResponse
	): PublishMessageResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: PublishMessageResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): PublishMessageResponse
	static deserializeBinaryFromReader(
		message: PublishMessageResponse,
		reader: jspb.BinaryReader
	): PublishMessageResponse
}

export namespace PublishMessageResponse {
	export type AsObject = {
		key: number
		tenantid: string
	}
}

export class ResolveIncidentRequest extends jspb.Message {
	getIncidentkey(): number
	setIncidentkey(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ResolveIncidentRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ResolveIncidentRequest
	): ResolveIncidentRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ResolveIncidentRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ResolveIncidentRequest
	static deserializeBinaryFromReader(
		message: ResolveIncidentRequest,
		reader: jspb.BinaryReader
	): ResolveIncidentRequest
}

export namespace ResolveIncidentRequest {
	export type AsObject = {
		incidentkey: number
	}
}

export class ResolveIncidentResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ResolveIncidentResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ResolveIncidentResponse
	): ResolveIncidentResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ResolveIncidentResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ResolveIncidentResponse
	static deserializeBinaryFromReader(
		message: ResolveIncidentResponse,
		reader: jspb.BinaryReader
	): ResolveIncidentResponse
}

export namespace ResolveIncidentResponse {
	export type AsObject = {}
}

export class TopologyRequest extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): TopologyRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: TopologyRequest
	): TopologyRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: TopologyRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): TopologyRequest
	static deserializeBinaryFromReader(
		message: TopologyRequest,
		reader: jspb.BinaryReader
	): TopologyRequest
}

export namespace TopologyRequest {
	export type AsObject = {}
}

export class TopologyResponse extends jspb.Message {
	clearBrokersList(): void
	getBrokersList(): Array<BrokerInfo>
	setBrokersList(value: Array<BrokerInfo>): void
	addBrokers(value?: BrokerInfo, index?: number): BrokerInfo

	getClustersize(): number
	setClustersize(value: number): void

	getPartitionscount(): number
	setPartitionscount(value: number): void

	getReplicationfactor(): number
	setReplicationfactor(value: number): void

	getGatewayversion(): string
	setGatewayversion(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): TopologyResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: TopologyResponse
	): TopologyResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: TopologyResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): TopologyResponse
	static deserializeBinaryFromReader(
		message: TopologyResponse,
		reader: jspb.BinaryReader
	): TopologyResponse
}

export namespace TopologyResponse {
	export type AsObject = {
		brokersList: Array<BrokerInfo.AsObject>
		clustersize: number
		partitionscount: number
		replicationfactor: number
		gatewayversion: string
	}
}

export class BrokerInfo extends jspb.Message {
	getNodeid(): number
	setNodeid(value: number): void

	getHost(): string
	setHost(value: string): void

	getPort(): number
	setPort(value: number): void

	clearPartitionsList(): void
	getPartitionsList(): Array<Partition>
	setPartitionsList(value: Array<Partition>): void
	addPartitions(value?: Partition, index?: number): Partition

	getVersion(): string
	setVersion(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): BrokerInfo.AsObject
	static toObject(
		includeInstance: boolean,
		msg: BrokerInfo
	): BrokerInfo.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: BrokerInfo,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): BrokerInfo
	static deserializeBinaryFromReader(
		message: BrokerInfo,
		reader: jspb.BinaryReader
	): BrokerInfo
}

export namespace BrokerInfo {
	export type AsObject = {
		nodeid: number
		host: string
		port: number
		partitionsList: Array<Partition.AsObject>
		version: string
	}
}

export class Partition extends jspb.Message {
	getPartitionid(): number
	setPartitionid(value: number): void

	getRole(): Partition.PartitionBrokerRoleMap[keyof Partition.PartitionBrokerRoleMap]
	setRole(
		value: Partition.PartitionBrokerRoleMap[keyof Partition.PartitionBrokerRoleMap]
	): void

	getHealth(): Partition.PartitionBrokerHealthMap[keyof Partition.PartitionBrokerHealthMap]
	setHealth(
		value: Partition.PartitionBrokerHealthMap[keyof Partition.PartitionBrokerHealthMap]
	): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): Partition.AsObject
	static toObject(includeInstance: boolean, msg: Partition): Partition.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: Partition,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): Partition
	static deserializeBinaryFromReader(
		message: Partition,
		reader: jspb.BinaryReader
	): Partition
}

export namespace Partition {
	export type AsObject = {
		partitionid: number
		role: Partition.PartitionBrokerRoleMap[keyof Partition.PartitionBrokerRoleMap]
		health: Partition.PartitionBrokerHealthMap[keyof Partition.PartitionBrokerHealthMap]
	}

	export interface PartitionBrokerRoleMap {
		LEADER: 0
		FOLLOWER: 1
		INACTIVE: 2
	}

	export const PartitionBrokerRole: PartitionBrokerRoleMap

	export interface PartitionBrokerHealthMap {
		HEALTHY: 0
		UNHEALTHY: 1
		DEAD: 2
	}

	export const PartitionBrokerHealth: PartitionBrokerHealthMap
}

export class UpdateJobRetriesRequest extends jspb.Message {
	getJobkey(): number
	setJobkey(value: number): void

	getRetries(): number
	setRetries(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): UpdateJobRetriesRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: UpdateJobRetriesRequest
	): UpdateJobRetriesRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: UpdateJobRetriesRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): UpdateJobRetriesRequest
	static deserializeBinaryFromReader(
		message: UpdateJobRetriesRequest,
		reader: jspb.BinaryReader
	): UpdateJobRetriesRequest
}

export namespace UpdateJobRetriesRequest {
	export type AsObject = {
		jobkey: number
		retries: number
	}
}

export class UpdateJobRetriesResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): UpdateJobRetriesResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: UpdateJobRetriesResponse
	): UpdateJobRetriesResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: UpdateJobRetriesResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): UpdateJobRetriesResponse
	static deserializeBinaryFromReader(
		message: UpdateJobRetriesResponse,
		reader: jspb.BinaryReader
	): UpdateJobRetriesResponse
}

export namespace UpdateJobRetriesResponse {
	export type AsObject = {}
}

export class UpdateJobTimeoutRequest extends jspb.Message {
	getJobkey(): number
	setJobkey(value: number): void

	getTimeout(): number
	setTimeout(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): UpdateJobTimeoutRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: UpdateJobTimeoutRequest
	): UpdateJobTimeoutRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: UpdateJobTimeoutRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): UpdateJobTimeoutRequest
	static deserializeBinaryFromReader(
		message: UpdateJobTimeoutRequest,
		reader: jspb.BinaryReader
	): UpdateJobTimeoutRequest
}

export namespace UpdateJobTimeoutRequest {
	export type AsObject = {
		jobkey: number
		timeout: number
	}
}

export class UpdateJobTimeoutResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): UpdateJobTimeoutResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: UpdateJobTimeoutResponse
	): UpdateJobTimeoutResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: UpdateJobTimeoutResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): UpdateJobTimeoutResponse
	static deserializeBinaryFromReader(
		message: UpdateJobTimeoutResponse,
		reader: jspb.BinaryReader
	): UpdateJobTimeoutResponse
}

export namespace UpdateJobTimeoutResponse {
	export type AsObject = {}
}

export class SetVariablesRequest extends jspb.Message {
	getElementinstancekey(): number
	setElementinstancekey(value: number): void

	getVariables(): string
	setVariables(value: string): void

	getLocal(): boolean
	setLocal(value: boolean): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): SetVariablesRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: SetVariablesRequest
	): SetVariablesRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: SetVariablesRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): SetVariablesRequest
	static deserializeBinaryFromReader(
		message: SetVariablesRequest,
		reader: jspb.BinaryReader
	): SetVariablesRequest
}

export namespace SetVariablesRequest {
	export type AsObject = {
		elementinstancekey: number
		variables: string
		local: boolean
	}
}

export class SetVariablesResponse extends jspb.Message {
	getKey(): number
	setKey(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): SetVariablesResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: SetVariablesResponse
	): SetVariablesResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: SetVariablesResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): SetVariablesResponse
	static deserializeBinaryFromReader(
		message: SetVariablesResponse,
		reader: jspb.BinaryReader
	): SetVariablesResponse
}

export namespace SetVariablesResponse {
	export type AsObject = {
		key: number
	}
}

export class ModifyProcessInstanceRequest extends jspb.Message {
	getProcessinstancekey(): number
	setProcessinstancekey(value: number): void

	clearActivateinstructionsList(): void
	getActivateinstructionsList(): Array<ModifyProcessInstanceRequest.ActivateInstruction>
	setActivateinstructionsList(
		value: Array<ModifyProcessInstanceRequest.ActivateInstruction>
	): void
	addActivateinstructions(
		value?: ModifyProcessInstanceRequest.ActivateInstruction,
		index?: number
	): ModifyProcessInstanceRequest.ActivateInstruction

	clearTerminateinstructionsList(): void
	getTerminateinstructionsList(): Array<ModifyProcessInstanceRequest.TerminateInstruction>
	setTerminateinstructionsList(
		value: Array<ModifyProcessInstanceRequest.TerminateInstruction>
	): void
	addTerminateinstructions(
		value?: ModifyProcessInstanceRequest.TerminateInstruction,
		index?: number
	): ModifyProcessInstanceRequest.TerminateInstruction

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ModifyProcessInstanceRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ModifyProcessInstanceRequest
	): ModifyProcessInstanceRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ModifyProcessInstanceRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ModifyProcessInstanceRequest
	static deserializeBinaryFromReader(
		message: ModifyProcessInstanceRequest,
		reader: jspb.BinaryReader
	): ModifyProcessInstanceRequest
}

export namespace ModifyProcessInstanceRequest {
	export type AsObject = {
		processinstancekey: number
		activateinstructionsList: Array<ModifyProcessInstanceRequest.ActivateInstruction.AsObject>
		terminateinstructionsList: Array<ModifyProcessInstanceRequest.TerminateInstruction.AsObject>
	}

	export class ActivateInstruction extends jspb.Message {
		getElementid(): string
		setElementid(value: string): void

		getAncestorelementinstancekey(): number
		setAncestorelementinstancekey(value: number): void

		clearVariableinstructionsList(): void
		getVariableinstructionsList(): Array<ModifyProcessInstanceRequest.VariableInstruction>
		setVariableinstructionsList(
			value: Array<ModifyProcessInstanceRequest.VariableInstruction>
		): void
		addVariableinstructions(
			value?: ModifyProcessInstanceRequest.VariableInstruction,
			index?: number
		): ModifyProcessInstanceRequest.VariableInstruction

		serializeBinary(): Uint8Array
		toObject(includeInstance?: boolean): ActivateInstruction.AsObject
		static toObject(
			includeInstance: boolean,
			msg: ActivateInstruction
		): ActivateInstruction.AsObject
		static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
		static extensionsBinary: {
			[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
		}
		static serializeBinaryToWriter(
			message: ActivateInstruction,
			writer: jspb.BinaryWriter
		): void
		static deserializeBinary(bytes: Uint8Array): ActivateInstruction
		static deserializeBinaryFromReader(
			message: ActivateInstruction,
			reader: jspb.BinaryReader
		): ActivateInstruction
	}

	export namespace ActivateInstruction {
		export type AsObject = {
			elementid: string
			ancestorelementinstancekey: number
			variableinstructionsList: Array<ModifyProcessInstanceRequest.VariableInstruction.AsObject>
		}
	}

	export class VariableInstruction extends jspb.Message {
		getVariables(): string
		setVariables(value: string): void

		getScopeid(): string
		setScopeid(value: string): void

		serializeBinary(): Uint8Array
		toObject(includeInstance?: boolean): VariableInstruction.AsObject
		static toObject(
			includeInstance: boolean,
			msg: VariableInstruction
		): VariableInstruction.AsObject
		static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
		static extensionsBinary: {
			[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
		}
		static serializeBinaryToWriter(
			message: VariableInstruction,
			writer: jspb.BinaryWriter
		): void
		static deserializeBinary(bytes: Uint8Array): VariableInstruction
		static deserializeBinaryFromReader(
			message: VariableInstruction,
			reader: jspb.BinaryReader
		): VariableInstruction
	}

	export namespace VariableInstruction {
		export type AsObject = {
			variables: string
			scopeid: string
		}
	}

	export class TerminateInstruction extends jspb.Message {
		getElementinstancekey(): number
		setElementinstancekey(value: number): void

		serializeBinary(): Uint8Array
		toObject(includeInstance?: boolean): TerminateInstruction.AsObject
		static toObject(
			includeInstance: boolean,
			msg: TerminateInstruction
		): TerminateInstruction.AsObject
		static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
		static extensionsBinary: {
			[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
		}
		static serializeBinaryToWriter(
			message: TerminateInstruction,
			writer: jspb.BinaryWriter
		): void
		static deserializeBinary(bytes: Uint8Array): TerminateInstruction
		static deserializeBinaryFromReader(
			message: TerminateInstruction,
			reader: jspb.BinaryReader
		): TerminateInstruction
	}

	export namespace TerminateInstruction {
		export type AsObject = {
			elementinstancekey: number
		}
	}
}

export class ModifyProcessInstanceResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): ModifyProcessInstanceResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: ModifyProcessInstanceResponse
	): ModifyProcessInstanceResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: ModifyProcessInstanceResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): ModifyProcessInstanceResponse
	static deserializeBinaryFromReader(
		message: ModifyProcessInstanceResponse,
		reader: jspb.BinaryReader
	): ModifyProcessInstanceResponse
}

export namespace ModifyProcessInstanceResponse {
	export type AsObject = {}
}

export class MigrateProcessInstanceRequest extends jspb.Message {
	getProcessinstancekey(): number
	setProcessinstancekey(value: number): void

	hasMigrationplan(): boolean
	clearMigrationplan(): void
	getMigrationplan(): MigrateProcessInstanceRequest.MigrationPlan | undefined
	setMigrationplan(value?: MigrateProcessInstanceRequest.MigrationPlan): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): MigrateProcessInstanceRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: MigrateProcessInstanceRequest
	): MigrateProcessInstanceRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: MigrateProcessInstanceRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): MigrateProcessInstanceRequest
	static deserializeBinaryFromReader(
		message: MigrateProcessInstanceRequest,
		reader: jspb.BinaryReader
	): MigrateProcessInstanceRequest
}

export namespace MigrateProcessInstanceRequest {
	export type AsObject = {
		processinstancekey: number
		migrationplan?: MigrateProcessInstanceRequest.MigrationPlan.AsObject
	}

	export class MigrationPlan extends jspb.Message {
		getTargetprocessdefinitionkey(): number
		setTargetprocessdefinitionkey(value: number): void

		clearMappinginstructionsList(): void
		getMappinginstructionsList(): Array<MigrateProcessInstanceRequest.MappingInstruction>
		setMappinginstructionsList(
			value: Array<MigrateProcessInstanceRequest.MappingInstruction>
		): void
		addMappinginstructions(
			value?: MigrateProcessInstanceRequest.MappingInstruction,
			index?: number
		): MigrateProcessInstanceRequest.MappingInstruction

		serializeBinary(): Uint8Array
		toObject(includeInstance?: boolean): MigrationPlan.AsObject
		static toObject(
			includeInstance: boolean,
			msg: MigrationPlan
		): MigrationPlan.AsObject
		static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
		static extensionsBinary: {
			[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
		}
		static serializeBinaryToWriter(
			message: MigrationPlan,
			writer: jspb.BinaryWriter
		): void
		static deserializeBinary(bytes: Uint8Array): MigrationPlan
		static deserializeBinaryFromReader(
			message: MigrationPlan,
			reader: jspb.BinaryReader
		): MigrationPlan
	}

	export namespace MigrationPlan {
		export type AsObject = {
			targetprocessdefinitionkey: number
			mappinginstructionsList: Array<MigrateProcessInstanceRequest.MappingInstruction.AsObject>
		}
	}

	export class MappingInstruction extends jspb.Message {
		getSourceelementid(): string
		setSourceelementid(value: string): void

		getTargetelementid(): string
		setTargetelementid(value: string): void

		serializeBinary(): Uint8Array
		toObject(includeInstance?: boolean): MappingInstruction.AsObject
		static toObject(
			includeInstance: boolean,
			msg: MappingInstruction
		): MappingInstruction.AsObject
		static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
		static extensionsBinary: {
			[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
		}
		static serializeBinaryToWriter(
			message: MappingInstruction,
			writer: jspb.BinaryWriter
		): void
		static deserializeBinary(bytes: Uint8Array): MappingInstruction
		static deserializeBinaryFromReader(
			message: MappingInstruction,
			reader: jspb.BinaryReader
		): MappingInstruction
	}

	export namespace MappingInstruction {
		export type AsObject = {
			sourceelementid: string
			targetelementid: string
		}
	}
}

export class MigrateProcessInstanceResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): MigrateProcessInstanceResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: MigrateProcessInstanceResponse
	): MigrateProcessInstanceResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: MigrateProcessInstanceResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): MigrateProcessInstanceResponse
	static deserializeBinaryFromReader(
		message: MigrateProcessInstanceResponse,
		reader: jspb.BinaryReader
	): MigrateProcessInstanceResponse
}

export namespace MigrateProcessInstanceResponse {
	export type AsObject = {}
}

export class DeleteResourceRequest extends jspb.Message {
	getResourcekey(): number
	setResourcekey(value: number): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DeleteResourceRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DeleteResourceRequest
	): DeleteResourceRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DeleteResourceRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DeleteResourceRequest
	static deserializeBinaryFromReader(
		message: DeleteResourceRequest,
		reader: jspb.BinaryReader
	): DeleteResourceRequest
}

export namespace DeleteResourceRequest {
	export type AsObject = {
		resourcekey: number
	}
}

export class DeleteResourceResponse extends jspb.Message {
	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): DeleteResourceResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: DeleteResourceResponse
	): DeleteResourceResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: DeleteResourceResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): DeleteResourceResponse
	static deserializeBinaryFromReader(
		message: DeleteResourceResponse,
		reader: jspb.BinaryReader
	): DeleteResourceResponse
}

export namespace DeleteResourceResponse {
	export type AsObject = {}
}

export class BroadcastSignalRequest extends jspb.Message {
	getSignalname(): string
	setSignalname(value: string): void

	getVariables(): string
	setVariables(value: string): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): BroadcastSignalRequest.AsObject
	static toObject(
		includeInstance: boolean,
		msg: BroadcastSignalRequest
	): BroadcastSignalRequest.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: BroadcastSignalRequest,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): BroadcastSignalRequest
	static deserializeBinaryFromReader(
		message: BroadcastSignalRequest,
		reader: jspb.BinaryReader
	): BroadcastSignalRequest
}

export namespace BroadcastSignalRequest {
	export type AsObject = {
		signalname: string
		variables: string
		tenantid: string
	}
}

export class BroadcastSignalResponse extends jspb.Message {
	getKey(): number
	setKey(value: number): void

	getTenantid(): string
	setTenantid(value: string): void

	serializeBinary(): Uint8Array
	toObject(includeInstance?: boolean): BroadcastSignalResponse.AsObject
	static toObject(
		includeInstance: boolean,
		msg: BroadcastSignalResponse
	): BroadcastSignalResponse.AsObject
	static extensions: { [key: number]: jspb.ExtensionFieldInfo<jspb.Message> }
	static extensionsBinary: {
		[key: number]: jspb.ExtensionFieldBinaryInfo<jspb.Message>
	}
	static serializeBinaryToWriter(
		message: BroadcastSignalResponse,
		writer: jspb.BinaryWriter
	): void
	static deserializeBinary(bytes: Uint8Array): BroadcastSignalResponse
	static deserializeBinaryFromReader(
		message: BroadcastSignalResponse,
		reader: jspb.BinaryReader
	): BroadcastSignalResponse
}

export namespace BroadcastSignalResponse {
	export type AsObject = {
		key: number
		tenantid: string
	}
}
