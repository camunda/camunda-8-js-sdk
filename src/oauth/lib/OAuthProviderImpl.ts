import * as fs from 'fs'
import 'isomorphic-fetch'
import * as os from 'os'

import { debug } from 'debug'

import { OAuthProviderConfig, Token, TokenError } from '../index'

const trace = debug('camunda:token')

const homedir = os.homedir()
const BACKOFF_TOKEN_ENDPOINT_FAILURE = 1000

type TokenGrantAudiences =
	| 'OPERATE'
	| 'ZEEBE'
	| 'OPTIMIZE'
	| 'TASKLIST'
	| 'CONSOLE'

export class OAuthProviderImpl {
	private static readonly defaultTokenCache = `${homedir}/.camunda`
	public static readonly getTokenCacheDirFromEnv = () =>
		process.env.CAMUNDA_TOKEN_CACHE_DIR || OAuthProviderImpl.defaultTokenCache
	private cacheDir: string
	private zeebeAudience: string
	private authServerUrl: string
	private clientId: string
	private clientSecret: string
	private useFileCache: boolean
	public tokenCache: { [key: string]: Token } = {}
	private failed = false
	private failureCount = 0
	private userAgentString: string
	private audience: string
	private scope: string | undefined

	constructor({
		/** OAuth Endpoint URL */
		authServerUrl,
		/** OAuth Audience */
		audience,
		scope,
		clientId,
		clientSecret,
		userAgentString,
	}: OAuthProviderConfig) {
		this.authServerUrl = authServerUrl
		this.zeebeAudience = audience
		this.audience = audience
		this.clientId = clientId
		this.clientSecret = clientSecret
		this.scope = scope ?? process.env.CAMUNDA_TOKEN_SCOPE
		this.useFileCache = process.env.CAMUNDA_TOKEN_CACHE !== 'memory-only'
		this.cacheDir = OAuthProviderImpl.getTokenCacheDirFromEnv()

		this.userAgentString = userAgentString // e.g.: `zeebe-client-nodejs/${pkg.version} ${CUSTOM_AGENT_STRING}`

		if (this.useFileCache) {
			try {
				if (!fs.existsSync(this.cacheDir)) {
					fs.mkdirSync(this.cacheDir)
				}
				fs.accessSync(this.cacheDir, fs.constants.W_OK)
			} catch (e) {
				throw new Error(
					`FATAL: Cannot write to OAuth cache dir ${this.cacheDir}\n` +
						'If you are running on AWS Lambda, set the HOME environment variable of your lambda function to /tmp'
				)
			}
		}
	}

	public async getToken(audience: TokenGrantAudiences): Promise<string> {
		const key = this.getCacheKey(audience)

		if (this.tokenCache[key]) {
			// console.log('Memory cache hit', this.tokenCache[key])
			// console.log('isExpired', this.isExpired(this.tokenCache[key]))
			const token = this.tokenCache[key]
			// check expiry and evict in-memory and file cache if expired
			if (this.isExpired(token)) {
				this.evictFromMemoryCache(audience)
			} else {
				return this.tokenCache[key].access_token
			}
		}
		if (this.useFileCache) {
			const cachedToken = this.retrieveFromFileCache(this.clientId, audience)
			if (cachedToken) {
				// check expiry and evict in-memory and file cache if expired
				if (this.isExpired(cachedToken)) {
					this.evictFromFileCache(audience)
				} else {
					return cachedToken.access_token
				}
			}
		}

		return new Promise((resolve, reject) => {
			setTimeout(
				() => {
					this.makeDebouncedTokenRequest(audience)
						.then((res) => {
							this.failed = false
							this.failureCount = 0
							resolve(res)
						})
						.catch((e) => {
							this.failureCount++
							this.failed = true
							reject(e)
						})
				},
				this.failed ? BACKOFF_TOKEN_ENDPOINT_FAILURE * this.failureCount : 0
			)
		})
	}

	public flushMemoryCache() {
		this.tokenCache = {}
	}

	public flushFileCache() {
		if (this.useFileCache) {
			fs.readdirSync(this.cacheDir).forEach((file) => {
				if (fs.existsSync(file)) {
					fs.unlinkSync(file)
				}
			})
		}
	}

	private makeDebouncedTokenRequest(audience: TokenGrantAudiences) {
		const body = `audience=${this.getAudience(audience)}&client_id=${
			this.clientId
		}&client_secret=${this.clientSecret}&grant_type=client_credentials`
		const bodyWithScope = this.scope ? `${body}&scope=${this.scope}` : body
		return fetch(this.authServerUrl, {
			method: 'POST',
			body: bodyWithScope,
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'user-agent': this.userAgentString,
			},
		})
			.then((res) =>
				res.json().catch(() => {
					trace(
						`Failed to parse response from token endpoint. Status ${res.status}: ${res.statusText}`
					)
					throw new Error(
						`Failed to parse response from token endpoint. Status ${res.status}: ${res.statusText}`
					)
				})
			)
			.then((t) => {
				trace(
					`Got token for Client Id ${this.clientId}: ${JSON.stringify(
						t,
						null,
						2
					)}`
				)
				const isTokenError = (t: unknown): t is TokenError =>
					!!(t as TokenError).error
				if (isTokenError(t)) {
					throw new Error(
						`Failed to get token: ${t.error} - ${t.error_description}`
					)
				}
				const token = { ...(t as Token), audience }
				if (this.useFileCache) {
					this.sendToFileCache({ audience, token })
				}
				this.sendToMemoryCache({ audience, token })
				trace(`Got token from endpoint: \n${token.access_token}`)
				trace(`Token expires in ${token.expires_in} seconds`)
				return token.access_token
			})
	}

	private sendToMemoryCache({
		audience,
		token,
	}: {
		audience: TokenGrantAudiences
		token: Token
	}) {
		const key = this.getCacheKey(audience)
		const d = new Date()
		token.expiry = d.setSeconds(d.getSeconds()) + token.expires_in * 1000
		this.tokenCache[key] = token
	}

	private retrieveFromFileCache(
		clientId: string,
		audience: TokenGrantAudiences
	) {
		let token: Token
		const tokenCachedInFile = fs.existsSync(
			this.getCachedTokenFileName(clientId, audience)
		)
		if (!tokenCachedInFile) {
			return null
		}
		try {
			token = JSON.parse(
				fs.readFileSync(this.getCachedTokenFileName(clientId, audience), 'utf8')
			)

			if (this.isExpired(token)) {
				return null
			}
			this.sendToMemoryCache({ audience, token })
			return token
		} catch (_) {
			return null
		}
	}

	private sendToFileCache({
		audience,
		token,
	}: {
		audience: TokenGrantAudiences
		token: Token
	}) {
		const d = new Date()
		const file = this.getCachedTokenFileName(this.clientId, audience)

		fs.writeFile(
			file,
			JSON.stringify({
				...token,
				expiry: d.setSeconds(d.getSeconds() + token.expires_in),
			}),
			(e) => {
				if (!e) {
					return
				}
				// tslint:disable-next-line
				console.error('Error writing OAuth token to file' + file)
				// tslint:disable-next-line
				console.error(e)
			}
		)
	}

	private isExpired(token: Token) {
		const d = new Date()
		return token.expiry <= d.setSeconds(d.getSeconds())
	}

	private evictFromMemoryCache(audience: TokenGrantAudiences) {
		const key = this.getCacheKey(audience)
		delete this.tokenCache[key]
	}

	private evictFromFileCache(audience: TokenGrantAudiences) {
		const filename = this.getCachedTokenFileName(this.clientId, audience)
		if (this.useFileCache && fs.existsSync(filename)) {
			fs.unlinkSync(filename)
		}
	}

	private getCacheKey = (audience: TokenGrantAudiences) =>
		`${this.clientId}-${audience}`
	private getCachedTokenFileName = (
		clientId: string,
		audience: TokenGrantAudiences
	) => `${this.cacheDir}/oauth-token-${clientId}-${audience}.json`

	private getAudience(audience: TokenGrantAudiences) {
		const audiences: { [key: string]: string } = {
			OPERATE: 'operate.camunda.io',
			ZEEBE: this.zeebeAudience,
			OPTIMIZE: 'optimize.camunda.io',
			TASKLIST: 'tasklist.camunda.io',
			CONSOLE: this.audience || 'api.cloud.camunda.io',
		}
		return audiences[audience]
	}
}
