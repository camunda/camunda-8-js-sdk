/**
 * Consumer code that type-checked against SDK versions built on got 11.
 * Compiled by got11-type-compat.unit.spec.ts: it must keep type-checking
 * against the undici-based HttpClient so the migration is non-breaking.
 * `got11` is a dev-only alias of got@11 (the SDK's former dependency).
 */
import type {
	BeforeRequestHook as GotBeforeRequestHook,
	RequiredRetryOptions as GotRequiredRetryOptions,
} from 'got11'
import * as Got from 'got11'

import { Camunda8, CamundaRestClient, HTTPError } from '../../..'
import { RestError } from '../../../lib'

// 1. middleware typed with got's BeforeRequestHook (passed via a variable;
//    `middleware` is not part of the literal-checked config type)
const gotHook: GotBeforeRequestHook = (options) => {
	options.headers['x-trace'] = '1'
}
const cfg = { CAMUNDA_OAUTH_DISABLED: true, middleware: [gotHook] }
new Camunda8(cfg)
new CamundaRestClient({ config: cfg })

// 2. retry typed with got's RequiredRetryOptions
const gotRetry: Partial<GotRequiredRetryOptions> = {
	limit: 3,
	methods: ['GET', 'POST'],
	statusCodes: [429, 503],
	errorCodes: ['ECONNRESET'],
	calculateDelay: ({ attemptCount, computedValue }) =>
		attemptCount > 2 ? 0 : computedValue,
}
new CamundaRestClient({ retry: gotRetry })
// inline retry, contextually typed by the SDK
new CamundaRestClient({
	retry: {
		limit: 2,
		methods: ['get', 'POST'],
		calculateDelay: ({ error, computedValue, attemptCount }) =>
			error.code === 'ETIMEDOUT' || attemptCount > 2 ? 0 : computedValue,
	},
})

// 3. error handling on the RestError union
function handle(e: RestError): string | number {
	if (e instanceof HTTPError) return e.response.statusCode
	if (e instanceof Got.TimeoutError) return e.event
	return `${e.name}: ${e.message} ${e.code}`
}
const status = (e: HTTPError): number => e.response.statusCode
const body = (e: HTTPError): unknown => e.response.body
void handle
void status
void body
