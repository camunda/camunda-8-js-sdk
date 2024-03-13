import * as fs from 'fs'
import https from 'https'
import * as os from 'os'

import { debug } from 'debug'
import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	RequireConfiguration,
	packageVersion,
} from 'lib'
import fetch from 'node-fetch'

import { IOAuthProvider, Token, TokenError } from '../index'

import { TokenGrantAudienceType } from './IOAuthProvider'

const trace = debug('camunda:token')

const homedir = os.homedir()
const BACKOFF_TOKEN_ENDPOINT_FAILURE = 1000

export class OAuthProvider implements IOAuthProvider {
	private static readonly defaultTokenCache = `${homedir}/.camunda`
	public static readonly getTokenCacheDirFromEnv = () =>
		process.env.CAMUNDA_TOKEN_CACHE_DIR || OAuthProvider.defaultTokenCache
	private cacheDir: string
	private zeebeAudience: string
	private authServerUrl: string
	private clientId: string
	private clientSecret: string
	private customRootCert?: Buffer
	private useFileCache: boolean
	public tokenCache: { [key: string]: Token } = {}
	private failed = false
	private failureCount = 0
	private inflightTokenRequest?: Promise<string>
	public userAgentString: string
	private scope: string | undefined
	private audienceMap: { [K in TokenGrantAudienceType]: string }
	private consoleClientId: string | undefined
	private consoleClientSecret: string | undefined

	constructor(options?: {
		config?: CamundaPlatform8Configuration
		userAgentString?: string
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.authServerUrl = RequireConfiguration(
			config.CAMUNDA_OAUTH_URL,
			'CAMUNDA_OAUTH_URL'
		)
		this.zeebeAudience = RequireConfiguration(
			config.ZEEBE_TOKEN_AUDIENCE,
			'ZEEBE_TOKEN_AUDIENCE'
		)
		this.clientId = RequireConfiguration(
			config.ZEEBE_CLIENT_ID,
			'ZEEBE_CLIENT_ID'
		)
		this.clientSecret = RequireConfiguration(
			config.ZEEBE_CLIENT_SECRET,
			'ZEEBE_CLIENT_SECRET'
		)
		this.consoleClientId = config.CAMUNDA_CONSOLE_CLIENT_ID
		this.consoleClientSecret = config.CAMUNDA_CONSOLE_CLIENT_SECRET
		const customRootCertPath = config.CAMUNDA_CUSTOM_ROOT_CERT_PATH
		this.customRootCert = customRootCertPath
			? fs.readFileSync(customRootCertPath)
			: undefined
		this.scope = config.CAMUNDA_TOKEN_SCOPE
		this.useFileCache = config.CAMUNDA_TOKEN_CACHE !== 'memory-only'
		this.cacheDir =
			config.CAMUNDA_TOKEN_CACHE_DIR ?? OAuthProvider.defaultTokenCache

		this.userAgentString = `camunda-8-sdk-nodejs/${packageVersion}${
			options?.userAgentString ? ' ' + options?.userAgentString : ''
		}` // e.g.: `zeebe-client-nodejs/${pkg.version} ${CUSTOM_AGENT_STRING}`

		this.audienceMap = {
			OPERATE: config.CAMUNDA_OPERATE_OAUTH_AUDIENCE || 'operate.camunda.io',
			ZEEBE: config.CAMUNDA_ZEEBE_OAUTH_AUDIENCE || this.zeebeAudience,
			OPTIMIZE: config.CAMUNDA_OPTIMIZE_OAUTH_AUDIENCE || 'optimize.camunda.io',
			TASKLIST: config.CAMUNDA_TASKLIST_OAUTH_AUDIENCE || 'tasklist.camunda.io',
			CONSOLE: config.CAMUNDA_CONSOLE_OAUTH_AUDIENCE || 'api.cloud.camunda.io',
			MODELER: config.CAMUNDA_MODELER_OAUTH_AUDIENCE || 'modeler.camunda.io',
		}

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

	public async getToken(audience: TokenGrantAudienceType): Promise<string> {
		const key = this.getCacheKey(audience)

		if (this.tokenCache[key]) {
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

		if (!this.inflightTokenRequest) {
			this.inflightTokenRequest = new Promise((resolve, reject) => {
				setTimeout(
					() => {
						this.makeDebouncedTokenRequest(audience)
							.then((res) => {
								this.failed = false
								this.failureCount = 0
								this.inflightTokenRequest = undefined
								resolve(res)
							})
							.catch((e) => {
								this.failureCount++
								this.failed = true
								this.inflightTokenRequest = undefined
								reject(e)
							})
					},
					this.failed ? BACKOFF_TOKEN_ENDPOINT_FAILURE * this.failureCount : 0
				)
			})
		}
		return this.inflightTokenRequest
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

	/** @TODO Validate that modeler also uses the Console Credentials in Self-Managed */
	private makeDebouncedTokenRequest(audience: TokenGrantAudienceType) {
		const clientId =
			audience === 'CONSOLE' || audience === 'MODELER'
				? RequireConfiguration(
						this.consoleClientId,
						'CAMUNDA_CONSOLE_CLIENT_ID'
					)
				: this.clientId
		const clientSecret =
			audience === 'CONSOLE'
				? RequireConfiguration(
						this.consoleClientSecret,
						'CAMUNDA_CONSOLE_CLIENT_SECRET'
					)
				: this.clientSecret
		const body = `audience=${this.getAudience(
			audience
		)}&client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
		const bodyWithScope = this.scope ? `${body}&scope=${this.scope}` : body
		if (this.customRootCert) {
			trace('Using custom root certificate')
		}
		const customAgent = this.customRootCert
			? new https.Agent({ ca: this.customRootCert })
			: undefined
		const options = {
			agent: customAgent,
			method: 'POST',
			body: bodyWithScope,
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'user-agent': this.userAgentString,
			},
		}
		const optionsWithAgent = this.customRootCert
			? { ...options, agent: customAgent }
			: options
		return fetch(this.authServerUrl, optionsWithAgent)
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
		audience: TokenGrantAudienceType
		token: Token
	}) {
		const key = this.getCacheKey(audience)
		const d = new Date()
		token.expiry = d.setSeconds(d.getSeconds()) + token.expires_in * 1000
		this.tokenCache[key] = token
	}

	private retrieveFromFileCache(
		clientId: string,
		audience: TokenGrantAudienceType
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
		audience: TokenGrantAudienceType
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

	private evictFromMemoryCache(audience: TokenGrantAudienceType) {
		const key = this.getCacheKey(audience)
		delete this.tokenCache[key]
	}

	private evictFromFileCache(audience: TokenGrantAudienceType) {
		const filename = this.getCachedTokenFileName(this.clientId, audience)
		if (this.useFileCache && fs.existsSync(filename)) {
			fs.unlinkSync(filename)
		}
	}

	private getCacheKey = (audience: TokenGrantAudienceType) =>
		`${this.clientId}-${audience}`
	private getCachedTokenFileName = (
		clientId: string,
		audience: TokenGrantAudienceType
	) => `${this.cacheDir}/oauth-token-${clientId}-${audience}.json`

	private getAudience(audience: TokenGrantAudienceType) {
		return this.audienceMap[audience]
	}
}
