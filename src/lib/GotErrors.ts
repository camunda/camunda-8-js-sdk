import * as Got from 'got'

export class HTTPError extends Got.HTTPError {
	statusCode: number
	constructor(response: Got.Response<unknown>) {
		super(response)
		const details = JSON.parse((response?.body as string) || '{}')
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.statusCode = details.status
	}
}

export type RESTError =
	| HTTPError
	| Got.RequestError
	| Got.ReadError
	| Got.ParseError
	| Got.TimeoutError
	| Got.CancelError
	| Got.CacheError
	| Got.MaxRedirectsError
	| Got.UnsupportedProtocolError
