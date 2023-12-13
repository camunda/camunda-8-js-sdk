import { getTasklistToken, getTasklistCredentials } from '@jwulf/oauth'
import gotQl from 'gotql'
import { Form, GraphQLTasksQuery, Task, TaskFields, TaskQuery, TaskWithVariables, User, Variable } from './Types'
import { getResponseDataOrThrow, decodeTaskVariablesFromGraphQL, encodeTaskVariablesForAPIRequest, JSONDoc } from './utils'

const pkg = require('../../package.json')

const defaultFields: TaskFields = [
    'assignee',
    'candidateGroups',
    'completionTime',
    'creationTime',
    'formKey',
    'id',
    'isFirst',
    'name',
    'processDefinitionId',
    'processInstanceId',
    'processName',
    'sortValues',
    'taskDefinitionId',
    'taskState',
    { variables: { fields: ['name', 'value'] } },
] as any

/**
 * @description The high-level client for the Tasklist GraphQL API
 * @example
 * ```
 *
 * ```
 */
export class TasklistApiClient {
    private userAgentString: string
    graphqlUrl: string

    /**
     * @example
     * ```
     *
     * ```
     * @description
     *
     */
    constructor() {
        this.userAgentString = `tasklist-graphql-client-nodejs/${pkg.version}`
        const creds = getTasklistCredentials()
        this.graphqlUrl = `${creds.CAMUNDA_TASKLIST_BASE_URL}/graphql`
    }

    private async getHeaders() {
        return {
            'content-type': 'application/json',
            authorization: `Bearer ${await getTasklistToken(this.userAgentString)}`,
            'user-agent': this.userAgentString,
            accept: '*/*',
        }
    }
    /**
     * @description Query Tasklist for a list of tasks. See the [API documentation](https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/tasks/).
     * @example
     * ```
     * const tasklist = new TasklistApiClient()
     *
     * async function getTasks() {
     *   const res = await tasklist.getTasks({
     *     state: TaskState.CREATED
     *   }, ['id', 'name', 'processName'])
     *   console.log(res ? 'Nothing' : JSON.stringify(res.tasks, null, 2))
     *   return res
     * }
     * ```
     * @param query
     * @param fields - a list of fields to return in the query results
     *
     */
    public async getTasks<T = { [key: string]: any }>(
        query: Partial<TaskQuery>,
        fields: TaskFields = defaultFields
    ): Promise<{ tasks: TaskWithVariables<T>[] }> {
        const headers = await this.getHeaders()
        const q: GraphQLTasksQuery = {
            operation: {
                name: 'tasks',
                args: {
                    query,
                },
                fields,
            },
        }
        return gotQl
            .query(this.graphqlUrl, q, { headers })
            .then((res) => ({ tasks: getResponseDataOrThrow<{ tasks: Task[] }>(res).tasks.map(decodeTaskVariablesFromGraphQL<T>) }))
    }

    public async getAllTasks<T = { [key: string]: any }>(fields: TaskFields = defaultFields): Promise<{ tasks: TaskWithVariables<T>[] }> {
        return this.getTasks<T>({}, fields)
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/task/
     * @param id
     * @param fields
     * @returns
     */
    public async getTask<T = { [key: string]: any }>(id: string, fields = defaultFields): Promise<{ task: TaskWithVariables<T> }> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'task',
                args: {
                    id,
                },
                fields,
            },
        }
        return gotQl
            .query(this.graphqlUrl, query, { headers })
            .then((res) => ({ task: decodeTaskVariablesFromGraphQL<T>(getResponseDataOrThrow<{ task: Task }>(res).task) }))
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/form/
     * @param id
     * @param processDefinitionId
     */
    public async getForm(id: string, processDefinitionId: string): Promise<{ form: Form }> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'form',
                args: {
                    id,
                    processDefinitionId,
                },
                fields: ['id', 'processDefinitionId', 'schema'],
            },
        }
        return gotQl.query(this.graphqlUrl, query, { headers }).then((res) => getResponseDataOrThrow(res))
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/current-user/
     */
    public async getCurrentUser(): Promise<User> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'user',
                fields: ['userId', 'displayName', 'permissions', 'roles', 'salesPlanType'],
            },
        }
        return gotQl.query(this.graphqlUrl, query, { headers }).then((res) => getResponseDataOrThrow(res))
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/variables/
     * @param taskId
     * @param variableNames
     */
    public async getVariables(taskId: string, variableNames: string[]) {
        throw new Error(`Not implemented yet ${taskId} ${variableNames}`)
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/queries/variable/
     * @param id
     */
    public async getVariable(id: string): Promise<Variable> {
        throw new Error(`Not implemented yet ${id}`)
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/mutations/claim-task/
     * @param taskId
     * @param assignee
     * @param allowOverrideAssignment
     */
    public async claimTask(taskId: string, assignee: string, allowOverrideAssignment: boolean = true): Promise<{ claimTask: Task }> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'claimTask',
                args: {
                    taskId,
                    assignee,
                    allowOverrideAssignment,
                },
                fields: defaultFields,
            },
        }
        return gotQl
            .mutation(
                this.graphqlUrl,
                query as any, // the typing seems to have an error
                { headers }
            )
            .then((res) => getResponseDataOrThrow(res))
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/mutations/complete-task/
     * @param taskId
     * @param variables
     */
    public async completeTask(taskId: string, variables: JSONDoc): Promise<{ completeTask: Task }> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'completeTask',
                args: {
                    taskId,
                    variables: '$completionVariables',
                },
                fields: defaultFields,
            },
            variables: {
                completionVariables: {
                    type: '[VariableInput!]!',
                    value: encodeTaskVariablesForAPIRequest(variables),
                },
            },
        }
        return gotQl.mutation(this.graphqlUrl, query as any, { headers }).then((res) => getResponseDataOrThrow(res))
    }

    /**
     * @description Delete process instance data from the Tasklist ES by id. Returns true if the process instance is found and canceled, false if the process instance could not be found.
     * [Documentation](https://docs.camunda.io/docs/apis-clients/tasklist-api/mutations/delete-process-instance/).
     * @param processInstanceId
     */
    public async deleteProcessInstance(processInstanceId: string): Promise<{ deleteProcessInstance: boolean }> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'deleteProcessInstance',
                args: {
                    processInstanceId,
                },
                fields: [],
            },
        }
        return gotQl.mutation(this.graphqlUrl, query, { headers }).then((res) => getResponseDataOrThrow(res))
    }

    /**
     * @description https://docs.camunda.io/docs/apis-clients/tasklist-api/mutations/unclaim-task/
     * @param taskId
     */
    public async unclaimTask(taskId: string): Promise<Task> {
        const headers = await this.getHeaders()
        const query = {
            operation: {
                name: 'unclaimTask',
                args: {
                    taskId,
                },
                fields: defaultFields,
            },
        }
        return gotQl.mutation(this.graphqlUrl, query, { headers }).then((res) => getResponseDataOrThrow(res))
    }
}
