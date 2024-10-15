import {type HTTPError} from 'ky'

export const beforeErrorHook = async (error: HTTPError) => {
	const contentType = error.response.headers.get('content-type');
	if (contentType?.includes('application/problem+json')) {
		const content = await error.response.json()
		error.message += ` || "${(content as any).detail}".`
	}

	return error
}
