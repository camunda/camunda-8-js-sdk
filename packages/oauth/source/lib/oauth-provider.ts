import debug from 'debug'
import {jwtDecode} from 'jwt-decode'
import ky from 'ky'
import {createUserAgentString} from './create-user-agent-string.js'
import {
	EnvironmentConfigurator,
	type OAuthConfiguration,
	requireConfiguration,
} from './get-environment.js'
import {
	type Token,
	type TokenError,
	type TokenGrantAudienceType,
} from './oauth-types.js'
import {type IPersistentCacheProvider, type IOAuthProvider} from './interfaces.js'

const trace = debug('camunda:oauth')

const backoffTokenEndpointFailure = 1000

// eslint-disable-next-line @typescript-eslint/naming-convention
type OAuthClientOptions = {
	configuration?: Partial<OAuthConfiguration>;
	persistentCache?: IPersistentCacheProvider;
	rest?: typeof ky;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export class OAuthProvider implements IOAuthProvider {
	public static isTokenExpired(token: Token, refreshWindow: number) {
		const d = new Date()
		const currentTime = d.setSeconds(d.getSeconds())

		// Token.expiry is seconds since Unix Epoch
		// The Date constructor expects milliseconds since Unix Epoch
		const tokenExpiryMs = token.expiry * 1000

		trace(`Checking token expiry for ${token.audience}`)
		trace(`  Current time: ${currentTime}`)
		trace(`  Token expiry: ${tokenExpiryMs}`)

		// If the token has 10 seconds (by default) or less left, renew it.
		// The Identity server token cache is cleared 30 seconds before the token expires, allowing us to renew it
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/125
		const tokenIsExpired = currentTime >= tokenExpiryMs - refreshWindow
		return tokenIsExpired
	}

	public tokenCache: Map<string, Token> = new Map<string, Token>()
	public userAgentString: string
	private readonly authServerUrl: string
	private readonly mTlsPrivateKey: string | undefined
	private readonly mTlsCertChain: string | undefined
	private readonly clientId: string | undefined
	private readonly clientSecret: string | undefined
	private failed = false
	private failureCount = 0
	private inflightTokenRequest?: Promise<string>
	private readonly scope: string | undefined
	private readonly audienceMap: Record<TokenGrantAudienceType, string>
	private readonly consoleClientId: string | undefined
	private readonly consoleClientSecret: string | undefined
	private readonly isCamundaSaaS: boolean
	private readonly camundaModelerOauthAudience: string | undefined
	private readonly refreshWindow: number
	private readonly rest: typeof ky
	private readonly persistentCache: IPersistentCacheProvider | undefined

	constructor({
		configuration = {},
		persistentCache,
		rest = ky,
	}: OAuthClientOptions = {}) {
		const config = EnvironmentConfigurator.mergeConfigWithEnvironment(
			configuration ?? {},
		)

		this.authServerUrl = requireConfiguration(
			config.CAMUNDA_OAUTH_URL,
			'CAMUNDA_OAUTH_URL',
		)

		this.clientId = config.ZEEBE_CLIENT_ID
		this.clientSecret = config.ZEEBE_CLIENT_SECRET
		this.mTlsPrivateKey = config.CAMUNDA_CUSTOM_PRIVATE_KEY_STRING
		this.mTlsCertChain = config.CAMUNDA_CUSTOM_CERT_CHAIN_STRING

		this.consoleClientId = config.CAMUNDA_CONSOLE_CLIENT_ID
		this.consoleClientSecret = config.CAMUNDA_CONSOLE_CLIENT_SECRET

		this.refreshWindow = config.CAMUNDA_OAUTH_TOKEN_REFRESH_THRESHOLD_MS

		if (!this.clientId && !this.consoleClientId) {
			throw new Error(
				'You need to supply a value for at at least one of ZEEBE_CLIENT_ID or CAMUNDA_CONSOLE_CLIENT_ID',
			)
		}

		if (!this.clientSecret && !this.consoleClientSecret) {
			throw new Error(
				'You need to supply a value for at least one of ZEEBE_CLIENT_SECRET or CAMUNDA_CONSOLE_CLIENT_SECRET',
			)
		}

		if (
			!(
				(Boolean(this.clientId) && Boolean(this.clientSecret))
				|| (Boolean(this.consoleClientId) && Boolean(this.consoleClientSecret))
			)
		) {
			throw new Error('You need to supply both a client ID and a client secret')
		}

		this.rest = rest.create({
			// Retry: GotRetryConfig,
			/* handled in sdk via ky-universal injection */
			// https: {
			// 	certificateAuthority: config.CAMUNDA_CUSTOM_CERT_STRING,
			// },
			// handlers: [gotErrorHandler],
			hooks: {
				// BeforeError: [gotBeforeErrorHook],
			},
		})

		this.scope = config.CAMUNDA_TOKEN_SCOPE

		// We will make this the responsibility of the Node SDK.
		// Basically, if it is disabled, we will not pass in a persistent
		// cache provider.
		// this.useFileCache = !config.CAMUNDA_TOKEN_DISK_CACHE_DISABLE
		this.persistentCache = persistentCache

		this.userAgentString = createUserAgentString(config)

		/**
		 * CAMUNDA_MODELER_OAUTH_AUDIENCE is optional, and only needed if the Modeler is running on Self-Managed
		 * and needs an audience. If it is not set, we will not include an audience in the token request.
		 */
		this.audienceMap = {
			/* eslint-disable @typescript-eslint/naming-convention */
			OPERATE: config.CAMUNDA_OPERATE_OAUTH_AUDIENCE,
			ZEEBE: config.CAMUNDA_ZEEBE_OAUTH_AUDIENCE,
			OPTIMIZE: config.CAMUNDA_OPTIMIZE_OAUTH_AUDIENCE,
			TASKLIST: config.CAMUNDA_TASKLIST_OAUTH_AUDIENCE,
			CONSOLE: config.CAMUNDA_CONSOLE_OAUTH_AUDIENCE,
			MODELER: config.CAMUNDA_MODELER_OAUTH_AUDIENCE!,
			/* eslint-enable @typescript-eslint/naming-convention */
		}

		this.camundaModelerOauthAudience = config.CAMUNDA_MODELER_OAUTH_AUDIENCE

		this.isCamundaSaaS = this.authServerUrl.includes(
			'https://login.cloud.camunda.io/oauth/token',
		)
	}

	public async getToken(audienceType: TokenGrantAudienceType): Promise<string> {
		debug(`Token request for ${audienceType}`)
		// We use the Console credential set if it we are requesting from
		// the SaaS OAuth endpoint, and it is a Modeler or Admin Console token.
		// Otherwise we use the application credential set, unless a Console credential set exists.
		// See: https://github.com/camunda/camunda-8-js-sdk/issues/60
		const requestingFromSaasConsole
			= this.isCamundaSaaS
			&& (audienceType === 'CONSOLE' || audienceType === 'MODELER')

		const clientIdToUse = requestingFromSaasConsole
			? requireConfiguration(this.consoleClientId, 'CAMUNDA_CONSOLE_CLIENT_ID')
			: requireConfiguration(this.clientId, 'ZEEBE_CLIENT_ID')

		const clientSecretToUse = requestingFromSaasConsole
			? requireConfiguration(
				this.consoleClientSecret,
				'CAMUNDA_CONSOLE_CLIENT_SECRET',
			)
			: requireConfiguration(this.clientSecret, 'ZEEBE_CLIENT_SECRET')

		const key = this.getCacheKey(audienceType)
		const token = this.tokenCache.get(key)
		// Check expiry and evict in-memory and file cache if expired
		if (token && OAuthProvider.isTokenExpired(token, this.refreshWindow)) {
			this.tokenCache.delete(key)
			trace(`In-memory token ${token.audience} is expired`)
		} else if (token) {
			trace(`Using in-memory cached token ${token.audience}`)
			return token.access_token
		}

		if (this.persistentCache) {
			const key = `${clientIdToUse}-${audienceType}`
			const cachedToken = this.persistentCache.get(key)

			if (cachedToken) {
				// Check expiry and evict in-memory and file cache if expired
				if (OAuthProvider.isTokenExpired(cachedToken, this.refreshWindow)) {
					this.persistentCache.delete(key)
					trace(`File cached token ${cachedToken.audience} is expired`)
				} else {
					trace(`Using file cached token ${cachedToken.audience}`)
					return cachedToken.access_token
				}
			}
		}

		this.inflightTokenRequest ||= new Promise((resolve, reject) => {
			setTimeout(
				() => {
					this.makeDebouncedTokenRequest({
						audienceType,
						clientIdToUse,
						clientSecretToUse,
					})
						.then(response => {
							this.failed = false
							this.failureCount = 0
							this.inflightTokenRequest = undefined
							resolve(response)
						})
						.catch((error: unknown) => {
							this.failureCount++
							this.failed = true
							this.inflightTokenRequest = undefined
							reject(error as Error)
						})
				},
				this.failed ? backoffTokenEndpointFailure * this.failureCount : 0,
			)
		});

		return this.inflightTokenRequest
	}

	public flushMemoryCache() {
		this.tokenCache.clear()
	}

	public flushFileCache() {
		if (this.persistentCache) {
			this.persistentCache.flush()
		}
	}

	/** Camunda SaaS needs an audience for a Modeler token request, and Self-Managed does not. */
	private addAudienceIfNeeded(audienceType: TokenGrantAudienceType) {
		/** If we are running on Self-Managed (ie: not Camunda SaaS), and no explicit audience was set,
		 * we should not include an audience in the token request.
		 * See: https://github.com/camunda/camunda-8-js-sdk/issues/60
		 */
		if (
			audienceType === 'MODELER'
			&& !this.isCamundaSaaS // Self-Managed
			&& !this.camundaModelerOauthAudience // User didn't set an audience
		) {
			return '' // No audience in token request
		}

		if (audienceType === 'MODELER' && this.isCamundaSaaS) {
			return 'audience=api.cloud.camunda.io&'
		}

		return `audience=${this.getAudience(audienceType)}&`
	}

	private async makeDebouncedTokenRequest({
		audienceType,
		clientIdToUse,
		clientSecretToUse,
	}: {
		audienceType: TokenGrantAudienceType;
		clientIdToUse: string;
		clientSecretToUse: string;
	}) {
		const body = `${this.addAudienceIfNeeded(
			audienceType,
		)}client_id=${encodeURIComponent(
			clientIdToUse,
		)}&client_secret=${encodeURIComponent(
			clientSecretToUse,
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
				key: this.mTlsPrivateKey,
				cert: this.mTlsCertChain,
			},
		}

		trace('Making token request to the token endpoint: ')
		trace(`  ${this.authServerUrl}`)
		trace(options)
		return this.rest
			.post(this.authServerUrl, options)
			.json<{access_token: string}>()
			.then(t => {
				trace(
					`Got token for Client Id ${clientIdToUse}: ${JSON.stringify(
						t,
						null,
						2,
					)}`,
				)
				const isTokenError = (t: unknown): t is TokenError =>
					Boolean((t as TokenError).error)
				if (isTokenError(t)) {
					throw new Error(
						`Failed to get token: ${t.error} - ${t.error_description}`,
					)
				}

				if (t.access_token === undefined) {
					console.error(audienceType, t)
					throw new Error('Failed to get token: no access_token in response')
				}

				const token = {...(t as Token), audience: audienceType}
				if (this.persistentCache) {
					this.persistentCache.set(
						`${clientIdToUse}-${audienceType}`,
						token,
						jwtDecode(token.access_token),
					)
				}

				this.sendToMemoryCache({audience: audienceType, token})
				return token.access_token
			})
			.catch((error: unknown) => {
				console.log(`Erroring requesting token for Client Id ${clientIdToUse}`)
				console.log(error)
				throw error
			})
	}

	private sendToMemoryCache({
		audience,
		token,
	}: {
		audience: TokenGrantAudienceType;
		token: Token;
	}) {
		const key = this.getCacheKey(audience)
		try {
			const decoded = jwtDecode(token.access_token)
			trace(`Caching token: ${JSON.stringify(decoded, null, 2)}`)
			trace(`Caching token for ${audience} in memory. Expiry: ${decoded.exp}`)
			token.expiry = decoded.exp ?? 0
			this.tokenCache[key] = token
		} catch (error) {
			console.error('audience', audience)
			console.error('token', token.access_token)
			throw error
		}
	}

	private readonly getCacheKey = (audience: TokenGrantAudienceType) =>
		`${this.clientId}-${audience}`

	private getAudience(audience: TokenGrantAudienceType) {
		return this.audienceMap[audience]
	}
}
