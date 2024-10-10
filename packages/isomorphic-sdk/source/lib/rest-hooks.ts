import {type HTTPError} from 'ky'

export const beforeErrorHook = (error: HTTPError) => {
	const {request} = error
	error.message += ` (request to ${request.url}).`
	return error
}
