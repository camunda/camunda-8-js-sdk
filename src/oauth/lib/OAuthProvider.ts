import { randomUUID } from 'crypto'
import * as fs from 'fs'
import * as os from 'os'
import path from 'path'

import { debug } from 'debug'
import got from 'got'
import { jwtDecode } from 'jwt-decode'

import { getLogger, Logger } from '../../c8/lib/C8Logger'
import {
	beforeCallHook,
	CamundaEnvironmentConfigurator,
	CamundaPlatform8Configuration,
	createUserAgentString,
	DeepPartial,
	GetCustomCertificateBuffer,
	gotBeforeErrorHook,
	GotRetryConfig,
	RequireConfiguration,
} from '../../lib'
import { IHeadersProvider, Token, TokenError } from '../index'

import { HeadersPromise, TokenGrantAudienceType } from './IHeadersProvider'

const trace = debug('camunda:oauth')

const homedir = os.homedir()
const BACKOFF_TOKEN_ENDPOINT_FAILURE = 1000
const TOKEN_ENDPOINT_REQUEST_TIMEOUT_MS = 30000

/**
 * The `OAuthProvider` class is an implementation of the {@link IHeadersProvider}
 * interface that uses the OAuth 2.0 client credentials grant to authenticate
 * with the Camunda Platform 8 Identity service. It handles token expiration
 * and renewal, and caches tokens in memory and on disk.
 *
 * It is used by the SDK to authenticate with the Camunda Platform 8. You will
 * rarely need to use this class directly, as it is used internally by the SDK.
 *
 * @example
 * ```typescript
 * const authProvider = new OAuthProvider({
 *   config: {
 *     CAMUNDA_OAUTH_URL: 'https://login.cloud.camunda.io/oauth/token',
 *     ZEEBE_CLIENT_ID: 'your-client-id',
 *     ZEEBE_CLIENT_SECRET: 'your-client-secret',
 *   },
 * })
 *
 * const token = await authProvider.getToken('ZEEBE')
 * ```
 */
export class OAuthProvider implements IHeadersProvider {
	private static readonly defaultTokenCache = `${homedir}/.camunda`
	private cacheDir: string
	private authServerUrl: string
	private mTLSPrivateKey: string | undefined
	private mTLSCertChain: string | undefined
	private clientId: string | undefined
	private clientSecret: string | undefined
	private useFileCache: boolean
	public tokenCache: { [key: string]: Token } = {}
	private failed = false
	private failureCount = 0
	private inflightTokenRequests = new Map<string, HeadersPromise>()
	public userAgentString: string
	private scope: string | undefined
	private audienceMap: { [K in TokenGrantAudienceType]: string }
	private consoleClientId: string | undefined
	private consoleClientSecret: string | undefined
	private isCamundaSaaS: boolean
	private camundaModelerOAuthAudience: string | undefined
	private refreshWindow: number
	private rest: Promise<typeof got>
	private log: Logger

	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.log = getLogger(config)
		this.authServerUrl = RequireConfiguration(
			config.CAMUNDA_OAUTH_URL,
			'CAMUNDA_OAUTH_URL'
		)

		this.clientId = config.ZEEBE_CLIENT_ID
		this.clientSecret = config.ZEEBE_CLIENT_SECRET
		this.mTLSPrivateKey = config.CAMUNDA_CUSTOM_PRIVATE_KEY_PATH
			? fs.readFileSync(config.CAMUNDA_CUSTOM_PRIVATE_KEY_PATH).toString()
			: undefined
		this.mTLSCertChain = config.CAMUNDA_CUSTOM_CERT_CHAIN_PATH
			? fs.readFileSync(config.CAMUNDA_CUSTOM_CERT_CHAIN_PATH).toString()
			: undefined

		this.consoleClientId = config.CAMUNDA_CONSOLE_CLIENT_ID
		this.consoleClientSecret = config.CAMUNDA_CONSOLE_CLIENT_SECRET

		this.refreshWindow = config.CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS

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
		this.rest = GetCustomCertificateBuffer(config).then(
			(certificateAuthority) =>
				got.extend({
					retry: GotRetryConfig,
					timeout: {
						request: TOKEN_ENDPOINT_REQUEST_TIMEOUT_MS,
					},
					https: {
						certificateAuthority,
					},
					handlers: [beforeCallHook],
					hooks: {
						beforeError: [gotBeforeErrorHook(config)],
					},
				})
		)

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
			ZEEBE: config.CAMUNDA_ZEEBE_OAUTH_AUDIENCE ?? config.ZEEBE_TOKEN_AUDIENCE,
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
				// Try to write a temporary file to the directory
				const tempfilename = path.join(this.cacheDir, `${randomUUID()}.tmp`)
				if (fs.existsSync(tempfilename)) {
					fs.unlinkSync(tempfilename) // Remove the temporary file
				}
				fs.writeFileSync(tempfilename, 'test')
				fs.unlinkSync(tempfilename) // Remove the temporary file
			} catch (e) {
				throw new Error(
					`FATAL: Cannot write to OAuth cache dir ${this.cacheDir}\n` +
						'If you are running on AWS Lambda, set the HOME environment variable of your lambda function to /tmp\n'
				)
			}
		}

		this.isCamundaSaaS = this.authServerUrl.includes(
			'https://login.cloud.camunda.io/oauth/token'
		)
	}

	public async getHeaders(audienceType: TokenGrantAudienceType) {
		trace(`Token request for ${audienceType}`)
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

		const key = this.getCacheKey(clientIdToUse, audienceType)

		if (this.tokenCache[key]) {
			const token = this.tokenCache[key]
			// check expiry and evict in-memory and file cache if expired
			if (this.isExpired(token)) {
				this.evictFromMemoryCache(audienceType, clientIdToUse)
				trace(`In-memory token ${token.audience} is expired`)
			} else {
				trace(`Using in-memory cached token ${token.audience}`)
				return this.addBearer(this.tokenCache[key].access_token)
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
					return this.addBearer(cachedToken.access_token)
				}
			}
		}

		if (!this.inflightTokenRequests.get(key)) {
			const inflightTokenRequest: HeadersPromise = new Promise(
				(resolve, reject) => {
					const failureBackoff = Math.min(
						BACKOFF_TOKEN_ENDPOINT_FAILURE * this.failureCount,
						15000
					)
					if (this.failed) {
						this.log.warn(
							`Backing off token endpoint due to previous failure. Requesting token in ${failureBackoff}ms...`
						)
					}
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
									resolve(res)
								})
								.catch((e) => {
									this.failureCount++
									this.failed = true
									reject(e)
								})
								.finally(() => {
									this.inflightTokenRequests.delete(key)
								})
						},
						this.failed ? failureBackoff : 0
					)
				}
			)
			this.inflightTokenRequests.set(key, inflightTokenRequest)
		}
		return this.inflightTokenRequests.get(key) as HeadersPromise
	}

	public flushMemoryCache() {
		this.tokenCache = {}
	}

	public flushFileCache() {
		if (!this.useFileCache) {
			return
		}
		try {
			fs.readdirSync(this.cacheDir)
				.filter(
					(file) => file.startsWith('oauth-token-') && file.endsWith('.json')
				)
				.forEach((file) => {
					const filePath = path.join(this.cacheDir, file)
					try {
						fs.unlinkSync(filePath)
					} catch (e) {
						const err = e as NodeJS.ErrnoException
						if (err.code !== 'ENOENT') {
							this.log.warn(`Failed to delete token cache file ${filePath}`)
							this.log.warn(err.message, err)
						}
					}
				})
		} catch (e) {
			const err = e as NodeJS.ErrnoException
			if (err.code !== 'ENOENT') {
				this.log.warn(`Failed to list OAuth token cache dir ${this.cacheDir}`)
				this.log.warn(err.message, err)
			}
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
		)}client_id=${encodeURIComponent(
			clientIdToUse
		)}&client_secret=${encodeURIComponent(
			clientSecretToUse
		)}&grant_type=client_credentials`
		/* Add a scope to the token request, if one is set */
		const bodyWithScope = this.scope ? `${body}&scope=${this.scope}` : body

		const options = {
			body: bodyWithScope,
			headers: {
				'content-type': 'application/x-www-form-urlencoded',
				'user-agent': this.userAgentString,
				accept: '*/*',
			},
			https: {
				key: this.mTLSPrivateKey,
				cert: this.mTLSCertChain,
			},
		}

		trace(`Making token request to the token endpoint: `)
		trace(`  ${this.authServerUrl}`)
		trace({
			...options,
			body: this.redactClientSecret(bodyWithScope),
		})
		return this.rest.then((rest) =>
			rest
				.post(this.authServerUrl, options)
				.catch((e) => {
					const err = e as {
						message: string
						code?: string
						response?: {
							statusCode?: number
							statusMessage?: string
						}
					}
					e.message = `Error requesting token for Client Id ${clientIdToUse}: ${e.message}`
					this.log.error(
						`Error requesting token for Client Id ${clientIdToUse}`
					)
					this.log.error('OAuth token request failed', {
						message: err.message,
						code: err.code,
						statusCode: err.response?.statusCode,
						statusMessage: err.response?.statusMessage,
					})
					throw e
				})
				.then((res) => JSON.parse(res.body))
				.then((t) => {
					trace(
						`Got token for Client Id ${clientIdToUse}: ${JSON.stringify(
							{ ...t, access_token: '[REDACTED]' },
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
					if (t.access_token === undefined) {
						this.log.error(
							`Failed to get token: no access_token in response for audience ${audienceType}`
						)
						this.log.error(JSON.stringify(t))
						throw new Error('Failed to get token: no access_token in response')
					}
					const token = { ...(t as Token), audience: audienceType }
					if (this.useFileCache) {
						this.sendToFileCache({
							audience: audienceType,
							token,
							clientId: clientIdToUse,
						})
					}
					this.sendToMemoryCache({
						audience: audienceType,
						token,
						clientId: clientIdToUse,
					})
					return this.addBearer(token.access_token)
				})
		)
	}

	private sendToMemoryCache({
		audience,
		token,
		clientId,
	}: {
		audience: TokenGrantAudienceType
		token: Token
		clientId: string
	}) {
		const key = this.getCacheKey(clientId, audience)
		try {
			const decoded = jwtDecode(token.access_token)
			// Keeping this in the code base to help with debugging
			// trace(`Caching token in memory: ${JSON.stringify(decoded, null, 2)}`)
			trace(`Caching token for ${audience} in memory. Expiry: ${decoded.exp}`)
			this.tokenCache[key] = { ...token, expiry: decoded.exp ?? 0 }
		} catch (e) {
			const err = e as Error
			this.log.error(`Failed to cache token in memory for audience ${audience}`)
			this.log.error(err.message, err)
			throw e
		}
	}

	private retrieveFromFileCache(
		clientId: string,
		audience: TokenGrantAudienceType
	) {
		let token: Token
		const tokenFileName = this.getCachedTokenFileName(clientId, audience)
		const tokenCachedInFile = fs.existsSync(tokenFileName)
		if (!tokenCachedInFile) {
			trace(`No file cached token for ${audience} found`)
			return null
		}
		try {
			trace(`Reading file cached token for ${audience}`)
			token = JSON.parse(fs.readFileSync(tokenFileName, 'utf8'))
			trace(`Retrieved token from file cache`)
			if (this.isExpired(token)) {
				trace(`File cached token is expired`)
				return null
			}
			this.sendToMemoryCache({ audience, token, clientId })
			return token
		} catch (e) {
			const err = e as Error
			trace(
				`Failed to read token from file cache for audience ${audience}: ${err.message}`
			)
			this.log.warn(
				`Failed to read token from file cache for audience ${audience}. Ignoring cache entry.`
			)
			this.log.warn(err.message, err)
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
		const file = this.getCachedTokenFileName(clientId, audience)
		let decoded: { exp?: number }
		try {
			decoded = jwtDecode(token.access_token)
		} catch (e) {
			const err = e as Error
			this.log.warn(
				`Failed to decode OAuth token before writing to file cache for audience ${audience}`
			)
			this.log.warn(err.message, err)
			return
		}

		fs.writeFile(
			file,
			JSON.stringify({
				...token,
				expiry: decoded.exp ?? 0,
			}),
			(e) => {
				if (!e) {
					trace(`Wrote OAuth token to file ${file}`)
					return
				}
				this.log.error(`Error writing OAuth token to file ${file}`)
				this.log.error(e.message, e)
			}
		)
	}

	private isExpired(token: Token) {
		const currentTime = Date.now()

		// token.expiry is seconds since Unix Epoch
		// The Date constructor expects milliseconds since Unix Epoch
		const tokenExpiryMs = token.expiry * 1000

		trace(`Checking token expiry for ${token.audience}`)
		trace(`  Current time: ${currentTime}`)
		trace(`  Token expiry: ${tokenExpiryMs}`)

		// If the token has 10 seconds (by default) or less left, renew it.
		// The Identity server token cache is cleared 30 seconds before the token expires, allowing us to renew it
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/125
		const tokenIsExpired = currentTime >= tokenExpiryMs - this.refreshWindow
		return tokenIsExpired
	}

	private evictFromMemoryCache(
		audience: TokenGrantAudienceType,
		clientId: string
	) {
		const key = this.getCacheKey(clientId, audience)
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

	private getCacheKey = (clientId: string, audience: TokenGrantAudienceType) =>
		`${clientId}-${audience}`
	private getCachedTokenFileName = (
		clientId: string,
		audience: TokenGrantAudienceType
	) => path.join(this.cacheDir, `oauth-token-${clientId}-${audience}.json`)

	private getAudience(audience: TokenGrantAudienceType) {
		return this.audienceMap[audience]
	}

	private addBearer(token: string) {
		return { authorization: `Bearer ${token}` }
	}

	private redactClientSecret(body: string) {
		return body.replace(/(client_secret=)[^&]*/g, '$1[REDACTED]')
	}
}
