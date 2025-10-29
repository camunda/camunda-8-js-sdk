import * as Got from 'got'

import { CamundaRestError } from '../c8/lib/C8Dto'

const Defaults: CamundaRestError = {
	status: 0,
	title: '',
	detail: '',
	instance: '',
	type: 'about:blank' as const,
}
export class HTTPError extends Got.HTTPError implements CamundaRestError {
	statusCode: number
	title: string
	detail: string
	instance: string
	type = 'about:blank' as const
	status: number
	constructor(response: Got.Response<unknown>) {
		super(response)
		let details = Defaults
		try {
			details = JSON.parse((response?.body as string) || '{}')
		} catch {
			// ignore JSON parse errors
		}
		this.statusCode = details.status
		this.title = details.title
		this.detail = details.detail
		this.instance = details.instance
		this.status = details.status
		// Sometimes APIs return errors data in plain text (not JSON)
		// and sometimes we get back an HTML error page (for example: 502 Bad Gateway)
		// We want to extract and surface plain text errors
		// and ignore the HTML strings
		if (!((response.body as string) ?? '<').startsWith('<')) {
			this.message += ` - ${response.body}`
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
