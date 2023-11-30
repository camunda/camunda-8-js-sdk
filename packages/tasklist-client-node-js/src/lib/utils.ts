import { Task, TaskWithVariables } from "./Types"

type JSON = string | number | boolean | JSON[] | JSONDoc[]
export interface JSONDoc {
    [key: string]: JSON
}
/**
 * Shallow escape
 * @param variable 
 * @returns 
 */
export const escape = (variable: JSON) => {
    if (typeof variable === "object") {
        return `${JSON.stringify(variable)}`
    } 
    if (typeof variable === "string") {
        return `"${variable}"`
    }
    return variable
}

export const encodeTaskVariablesForAPIRequest = (variables: JSONDoc) => 
    Object.keys(variables).map(key => 
        ({ name: `${key}`, value: escape(variables[key]) })
    )

/**
 * @description GraphQL returns variables as an array of {name: string, value: string} object.
 * This function turns this into a plain JS object.
 * @param task 
 * @returns 
 */
export const decodeTaskVariablesFromGraphQL = <T>(task: Task): TaskWithVariables<T> => {
    // console.log("decodeTaskVariablesFromGraphQL", task)
    return ({
        ...task,
        variables: (task.variables || []).reduce((prev, curr) => ({...prev, [curr.name]: safeJSONparse(curr.value)}), {} as {[key:string]: any}) as T
    })
}

const safeJSONparse = (obj: any) => {
    try {
        return JSON.parse(obj)
    } catch {
        console.log('Error parsing JSON')
        return obj
    }
}

/**
 * @description Helper method to throw if the GraphQL endpoint returns an error, or destructure the 
 * response data if the GraphQL returned data.
 * @param res 
 * @throws
 */
export const getResponseDataOrThrow = <T>(res: {data: T} | { errors: any }) => {
        const isError = (res: any): res is { errors: any } => !!res.errors
        if (isError(res)) {
            throw new Error(JSON.stringify(res.errors, null, 2))
        }
        return res.data
    }