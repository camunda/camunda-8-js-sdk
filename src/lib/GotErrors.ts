import * as Got from 'got'

export type RESTError =
	| Got.HTTPError
	| Got.RequestError
	| Got.ReadError
	| Got.ParseError
	| Got.HTTPError
	| Got.TimeoutError
	| Got.CancelError
	| Got.CacheError
	| Got.MaxRedirectsError
	| Got.UnsupportedProtocolError
