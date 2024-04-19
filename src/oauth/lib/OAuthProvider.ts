import * as fs from 'fs'
import https from 'https'
import * as os from 'os'

import { debug } from 'debug'
import fetch from 'node-fetch'

import {
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	DeepPartial,
	GetCertificateAuthority,
	RequireConfiguration,
	createUserAgentString,
} from '../../lib'
import { IOAuthProvider, Token, TokenError } from '../index'

import { TokenGrantAudienceType } from './IOAuthProvider'

const trace = debug('camunda:oauth')

const homedir = os.homedir()
const BACKOFF_TOKEN_ENDPOINT_FAILURE = 1000

export class OAuthProvider implements IOAuthProvider {
	private static readonly defaultTokenCache = `${homedir}/.camunda`
	private cacheDir: string
	private authServerUrl: string
	private clientId: string | undefined
	private clientSecret: string | undefined
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
	private isCamundaSaaS: boolean
	private camundaModelerOAuthAudience: string | undefined

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)

		this.authServerUrl = RequireConfiguration(
			config.CAMUNDA_OAUTH_URL,
			'CAMUNDA_OAUTH_URL'
		)

		this.clientId = config.ZEEBE_CLIENT_ID
		this.clientSecret = config.ZEEBE_CLIENT_SECRET

		this.consoleClientId = config.CAMUNDA_CONSOLE_CLIENT_ID
		this.consoleClientSecret = config.CAMUNDA_CONSOLE_CLIENT_SECRET

		if (!this.clientId && !this.consoleClientId) {
			throw new Error(
				`You need to supply a value for at at least one of ZEEBE_CLIENT_ID or CAMUNDA_CONSOLE_CLIENT_ID`
			)
		}
		if (!this.clientSecret && !this.consoleClientSecret) {
			throw new Error(
				`You need to supply a value for at least one of ZEEBE_CLIENT_SECRET or CAMUNDA_CONSOLE_CLIENT_SECRET`
			)
		}

		if (
			!(
				(!!this.clientId && !!this.clientSecret) ||
				(!!this.consoleClientId && !!this.consoleClientSecret)
			)
		) {
			throw new Error('You need to supply both a client ID and a client secret')
		}

		const customRootCert = GetCertificateAuthority(config)
		this.customRootCert = customRootCert
			? Buffer.from(customRootCert)
			: undefined

		this.scope = config.CAMUNDA_TOKEN_SCOPE
		this.useFileCache = !config.CAMUNDA_TOKEN_DISK_CACHE_DISABLE
		this.cacheDir =
			config.CAMUNDA_TOKEN_CACHE_DIR ?? OAuthProvider.defaultTokenCache

		this.userAgentString = createUserAgentString(config)

		/**
		 * CAMUNDA_MODELER_OAUTH_AUDIENCE is optional, and only needed if the Modeler is running on Self-Managed
		 * and needs an audience. If it is not set, we will not include an audience in the token request.
		 */
		this.audienceMap = {
			OPERATE: config.CAMUNDA_OPERATE_OAUTH_AUDIENCE,
			ZEEBE: config.CAMUNDA_ZEEBE_OAUTH_AUDIENCE,
			OPTIMIZE: config.CAMUNDA_OPTIMIZE_OAUTH_AUDIENCE,
			TASKLIST: config.CAMUNDA_TASKLIST_OAUTH_AUDIENCE,
			CONSOLE: config.CAMUNDA_CONSOLE_OAUTH_AUDIENCE,
			MODELER: config.CAMUNDA_MODELER_OAUTH_AUDIENCE!,
		}

		this.camundaModelerOAuthAudience = config.CAMUNDA_MODELER_OAUTH_AUDIENCE

		if (this.useFileCache) {
			try {
				if (!fs.existsSync(this.cacheDir)) {
					fs.mkdirSync(this.cacheDir, {
						recursive: true,
					})
				}
				fs.accessSync(this.cacheDir, fs.constants.W_OK)
			} catch (e) {
				throw new Error(
					`FATAL: Cannot write to OAuth cache dir ${this.cacheDir}\n` +
						'If you are running on AWS Lambda, set the HOME environment variable of your lambda function to /tmp'
				)
			}
		}

		this.isCamundaSaaS = this.authServerUrl.includes(
			'https://login.cloud.camunda.io/oauth/token'
		)
	}

	public async getToken(audienceType: TokenGrantAudienceType): Promise<string> {
		debug(`Token request for ${audienceType}`)
		// tslint:disable-next-line: no-console
		// We use the Console credential set if it we are requesting from
		// the SaaS OAuth endpoint, and it is a Modeler or Admin Console token.
		// Otherwise we use the application credential set, unless a Console credential set exists.
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
		const requestingFromSaaSConsole =
			this.isCamundaSaaS &&
			(audienceType === 'CONSOLE' || audienceType === 'MODELER')

		const clientIdToUse = requestingFromSaaSConsole
			? RequireConfiguration(this.consoleClientId, 'CAMUNDA_CONSOLE_CLIENT_ID')
			: RequireConfiguration(this.clientId, 'ZEEBE_CLIENT_ID')

		const clientSecretToUse = requestingFromSaaSConsole
			? RequireConfiguration(
					this.consoleClientSecret,
					'CAMUNDA_CONSOLE_CLIENT_SECRET'
				)
			: RequireConfiguration(this.clientSecret, 'ZEEBE_CLIENT_SECRET')

		const key = this.getCacheKey(audienceType)

		if (this.tokenCache[key]) {
			const token = this.tokenCache[key]
			// check expiry and evict in-memory and file cache if expired
			if (this.isExpired(token)) {
				this.evictFromMemoryCache(audienceType)
				trace(`In-memory token ${token.audience} is expired`)
			} else {
				trace(`Using in-memory cached token ${token.audience}`)
				return this.tokenCache[key].access_token
			}
		}
		if (this.useFileCache) {
			const cachedToken = this.retrieveFromFileCache(
				clientIdToUse,
				audienceType
			)
			if (cachedToken) {
				// check expiry and evict in-memory and file cache if expired
				if (this.isExpired(cachedToken)) {
					this.evictFromFileCache({ audienceType, clientId: clientIdToUse })
					trace(`File cached token ${cachedToken.audience} is expired`)
				} else {
					trace(`Using file cached token ${cachedToken.audience}`)
					return cachedToken.access_token
				}
			}
		}

		if (!this.inflightTokenRequest) {
			this.inflightTokenRequest = new Promise((resolve, reject) => {
				setTimeout(
					() => {
						this.makeDebouncedTokenRequest({
							audienceType,
							clientIdToUse,
							clientSecretToUse,
						})
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

	/** Camunda SaaS needs an audience for a Modeler token request, and Self-Managed does not. */
	private addAudienceIfNeeded(audienceType: TokenGrantAudienceType) {
		/** If we are running on Self-Managed (ie: not Camunda SaaS), and no explicit audience was set,
		 * we should not include an audience in the token request.
		 * See: https://github.com/camunda/camunda-8-js-sdk/issues/60
		 */
		if (
			audienceType === 'MODELER' &&
			!this.isCamundaSaaS && // Self-Managed
			!this.camundaModelerOAuthAudience // User didn't set an audience
		) {
			return '' // No audience in token request
		}
		if (audienceType === 'MODELER' && this.isCamundaSaaS) {
			return 'audience=api.cloud.camunda.io&'
		}
		return `audience=${this.getAudience(audienceType)}&`
	}

	private makeDebouncedTokenRequest({
		audienceType,
		clientIdToUse,
		clientSecretToUse,
	}: {
		audienceType: TokenGrantAudienceType
		clientIdToUse: string
		clientSecretToUse: string
	}) {
		const body = `${this.addAudienceIfNeeded(
			audienceType
		)}client_id=${clientIdToUse}&client_secret=${clientSecretToUse}&grant_type=client_credentials`
		/* Add a scope to the token request, if one is set */
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
		trace(`Making token request to the token endpoint: `)
		trace(`  ${this.authServerUrl}`)
		trace(optionsWithAgent)
		return fetch(this.authServerUrl, optionsWithAgent)
			.catch((e) => {
				console.log(`Erroring requesting token for Client Id ${clientIdToUse}`)
				console.log(e)
				throw e
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
					`Got token for Client Id ${clientIdToUse}: ${JSON.stringify(
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
				const token = { ...(t as Token), audience: audienceType }
				if (this.useFileCache) {
					this.sendToFileCache({
						audience: audienceType,
						token,
						clientId: clientIdToUse,
					})
				}
				this.sendToMemoryCache({ audience: audienceType, token })
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
		const tokenFileName = this.getCachedTokenFileName(clientId, audience)
		const tokenCachedInFile = fs.existsSync(tokenFileName)
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
		clientId,
	}: {
		audience: TokenGrantAudienceType
		token: Token
		clientId: string
	}) {
		const d = new Date()
		const file = this.getCachedTokenFileName(clientId, audience)

		fs.writeFile(
			file,
			JSON.stringify({
				...token,
				expiry: d.setSeconds(d.getSeconds() + token.expires_in),
			}),
			(e) => {
				if (!e) {
					trace(`Wrote OAuth token to file ${file}`)
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
		const currentTime = d.setSeconds(d.getSeconds())
		const tokenIsExpired = currentTime >= token.expiry
		return tokenIsExpired
	}

	private evictFromMemoryCache(audience: TokenGrantAudienceType) {
		const key = this.getCacheKey(audience)
		delete this.tokenCache[key]
	}

	private evictFromFileCache({
		audienceType,
		clientId,
	}: {
		audienceType: TokenGrantAudienceType
		clientId: string
	}) {
		const filename = this.getCachedTokenFileName(clientId, audienceType)
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
