import * as Got from 'got'

export class HTTPError extends Got.HTTPError {
	statusCode: number
	constructor(response: Got.Response<unknown>) {
		super(response)
		try {
			const details = JSON.parse((response?.body as string) || '{}')
			this.statusCode = details.status
		} catch (e) {
			this.statusCode = 0
			// Sometimes APIs return errors data in plain text (not JSON)
			// and sometimes we get back an HTML error page (for example: 502 Bad Gateway)
			// We want to extract and surface plain text errors
			// and ignore the HTML strings
			if (!((response.body as string) ?? '<').startsWith('<')) {
				this.message += ` - ${response.body}`
			}
		}
	}
}

export type RestError =
	| HTTPError
	| Got.RequestError
	| Got.ReadError
	| Got.ParseError
	| Got.TimeoutError
	| Got.CancelError
	| Got.CacheError
	| Got.MaxRedirectsError
	| Got.UnsupportedProtocolError
