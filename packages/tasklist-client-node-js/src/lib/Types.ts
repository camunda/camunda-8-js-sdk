import { literal } from "gotql";
import { LiteralObject } from "gotql/dist/types/Literal";

class TTaskState {
    COMPLETED = literal`COMPLETED` 
    CREATED = literal`CREATED`
    CANCELED = literal`CANCELED`
}

export const TaskState = new TTaskState()


export interface Variable {
    id: string
    name: string
    value: string
    previewValue: string
    isValueTruncated: boolean
}

export interface TaskQuery {
    state: LiteralObject
    assigned: boolean
    assignee: string
    candidateGroup: string
    pageSize: number
    taskDefinitionId: string
    searchAfter: string[]
    searchAfterOrEqual: string[]
    searchBefore: string[]
    searchBeforeOrEqual: string[]
  }

interface TaskBase {
    id: string
    name: string
    taskDefinitionId: string
    processName: string
    creationTime: string
    completionTime: string
    assignee: string
    taskState: 'COMPLETED' | 'CREATED' | 'CANCELED'
    sortValues: [string]
    isFirst: boolean
    formKey: string
    processDefinitionId: string
    processInstanceId: string
    candidateGroups: string[]
}

export interface Task extends TaskBase {
    variables: Variable[]
}

export interface TaskWithVariables<T = {[key: string]: any}> extends TaskBase {
    variables: T
}

export type TaskFields = Partial<keyof Task>[]

export interface GraphQLTasksQuery {
    operation: {
        name: 'tasks',
        args: {
            query: Partial<TaskQuery>
        },
        fields: TaskFields
    } 
}

export interface GraphQLTaskQuery {
    operation: {
        name: 'task',
        args: {
            query: { id: string }
        },
        fields: TaskFields
    } 
}

export interface GraphQLFormQuery {
    operation: {
        name: 'form',
        args: {
            query: { 
                id: string,
                processDefinitionId: string
             },
        },
        fields: string[]
    } 
}

export interface VariableInput {
    name: string
    value: string
}

export interface User {
    userId: string
    displayName: string
    permissions: string[]
    roles: string[]
    salesPlanType: string
}

export interface Form {
    id: string
    processDefinitionId: string
    schema: string
  }