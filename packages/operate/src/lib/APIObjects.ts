export interface ProcessDefinition {
  key: number;
  name: string;
  version: number;
  bpmnProcessId: string;
}

export interface ProcessInstance {
  key: number;
  processVersion: number;
  bpmnProcessId: string;
  parentKey?: number;
  /* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
  startDate: string;
  /* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
  endDate: string;
  state: 'ACTIVE' | 'COMPLETED' | 'CANCELED';
  processDefinitionKey: number;
}

export interface Incident {
  key: number;
  processDefinitionKey: number;
  processInstanceKey: number;
  type: 'UNSPECIFIED' | 'UNKNOWN' | 'IO_MAPPING_ERROR' | 'JOB_NO_RETRIES' | 'CONDITION_ERROR' | 'EXTRACT_VALUE_ERROR' | 'CALLED_ELEMENT_ERROR' | 'UNHANDLED_ERROR_EVENT' | 'MESSAGE_SIZE_EXCEEDED' | 'CALLED_DECISION_ERROR' | 'DECISION_EVALUATION_ERROR'
  message: string;
  /* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
  creationTime: string; //
  state: 'ACTIVE' | 'RESOLVED';
}

export interface FlownodeInstance {
  key: number;
  processInstanceKey: number;
  /* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
  startDate: string;
  /* yyyy-MM-dd'T'HH:mm:ss.SSSZZ */
  endDate: string;
  incidentKey: number;
  type:  'UNSPECIFIED' |
  'PROCESS' |
  'SUB_PROCESS' |
  'EVENT_SUB_PROCESS' |
  'START_EVENT' |
  'INTERMEDIATE_CATCH_EVENT' |
  'INTERMEDIATE_THROW_EVENT' |
  'BOUNDARY_EVENT' |
  'END_EVENT' |
  'SERVICE_TASK' |
  'RECEIVE_TASK' |
  'USER_TASK' |
  'MANUAL_TASK' |
  'TASK' |
  'EXCLUSIVE_GATEWAY' |
  'INCLUSIVE_GATEWAY' |
  'PARALLEL_GATEWAY' |
  'EVENT_BASED_GATEWAY' |
  'SEQUENCE_FLOW' |
  'MULTI_INSTANCE_BODY' |
  'CALL_ACTIVITY' |
  'BUSINESS_RULE_TASK' |
  'SCRIPT_TASK' |
  'SEND_TASK' |
  'UNKNOWN';
  state: 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
  incident: boolean;
}

export interface Variable {
  key: number;
  processInstanceKey: number;
  scopeKey: number;
  name: string;
  /* Always truncated if value is too big in "search" results. In "get object" result it is not truncated. */
  value: string;
  /* if true 'value' is truncated. */
  truncated: boolean;
}

export interface ChangeStatus {
  /* What was changed */
  message: string;
  /* How many items were deleted */
  deleted: number;
}

export interface Query<T> {
  filter?: Partial<T>;
  size?: number;
  sort?: [{ field: keyof T; order: "ASC" | "DESC" }];
  searchAfter?: any[];
}

export interface SearchResults<T> {
  items: T[]
  sortValues: any[]
  total: number
}