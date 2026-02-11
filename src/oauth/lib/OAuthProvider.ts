import { pbkdf2Sync, randomUUID } from 'crypto'
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
	gotBeforeRetryHook,
	GotRetryConfig,
	RequireConfiguration,
} from '../../lib'
import { IHeadersProvider, Token, TokenError } from '../index'

import { HeadersPromise, TokenGrantAudienceType } from './IHeadersProvider'

const trace = debug('camunda:oauth')

const homedir = os.homedir()
const BACKOFF_TOKEN_ENDPOINT_FAILURE = 1000

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
	// Track live instances for best-effort in-memory tarpit clearing
	private static instances: OAuthProvider[] = []
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
	private inflightTokenRequests: { [key: string]: HeadersPromise } = {}
	/** Memoized 401 responses for SaaS cooldown buffering */
	private memoized401: {
		[key: string]: { timestamp: number; error: Error }
	} = {}
	/** Persistent tarpit flag files for SaaS 401 (keyed by clientId+secret+audience) */
	private tarpit401: Set<string> = new Set()
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
	private failOnError: boolean

	/**
	 *
	 * @param dir Optional directory to clear the cache from. If not provided, the default cache directory is used.
	 * @description Clears the OAuth token cache directory. This will remove all cached tokens from the specified directory.
	 */
	public static clearCacheDir(dir?: string) {
		const cacheDir = dir ?? OAuthProvider.defaultTokenCache
		if (fs.existsSync(cacheDir)) {
			fs.rmSync(cacheDir, {
				recursive: true,
				force: true,
			})
		}
	}
	constructor(options?: {
		config?: DeepPartial<CamundaPlatform8Configuration>
	}) {
		const config = CamundaEnvironmentConfigurator.mergeConfigWithEnvironment(
			options?.config ?? {}
		)
		this.log = getLogger(config)

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

		// https://github.com/camunda/camunda-8-js-sdk/issues/605
		// The SaaS token endpoint returns successive 401 responses after a 30s cooldown now. So we turn off token endpoint backoff when
		// running against SaaS unless the user explicitly turns it on. Otherwise, the token endpoint backoff is enabled by default for Self-Managed
		// to prevent DDOS of the endpoint by misconfigured workers.
		this.failOnError =
			config.CAMUNDA_OAUTH_FAIL_ON_ERROR ??
			OAuthProvider.isSaaSUrl(config.CAMUNDA_OAUTH_URL)

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
					https: {
						certificateAuthority,
					},
					handlers: [beforeCallHook],
					hooks: {
						beforeError: [gotBeforeErrorHook(config)],
						beforeRetry: [gotBeforeRetryHook],
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

		this.isCamundaSaaS = OAuthProvider.isSaaSUrl(this.authServerUrl)

		// Load any existing tarpit files (persistent 401 memoization)
		if (this.useFileCache) {
			try {
				const files = fs.readdirSync(this.cacheDir)
				for (const f of files) {
					if (f.startsWith('oauth-401-tarpit-')) {
						this.tarpit401.add(path.join(this.cacheDir, f))
					}
				}
			} catch (_) {
				/* ignore */
			}
		}
		// Register instance for static clear401Tarpit cleanup
		OAuthProvider.instances.push(this)
	}

	public async getHeaders(audienceType: TokenGrantAudienceType) {
		debug(`Token request for ${audienceType}`)
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

		// Persistent tarpit check (SaaS 401 permanent memoization)
		const tarpitFile = this.getTarpitFilePath({
			clientId: clientIdToUse,
			clientSecret: clientSecretToUse,
			audienceType,
		})
		if (this.isCamundaSaaS && this.isTarpitted(tarpitFile)) {
			throw new Error(
				`401 Unauthorized (tarpit) for clientId ${clientIdToUse}. Persistent memoization in effect. Clear with OAuthProvider.clear401Tarpit().`
			)
		}

		// Legacy in-memory cooldown memoization (will be deprecated by tarpit behaviour)
		const credentialKey = this.getCredentialAudienceKey({
			clientId: clientIdToUse,
			audienceType,
		})
		const memo = this.memoized401[credentialKey]
		if (memo) {
			const now = Date.now()
			if (now - memo.timestamp < OAuthProvider.SAAS_401_COOLDOWN_MS) {
				// Within cooldown window: surface cached error without hitting endpoint
				throw memo.error
			} else {
				// Expired memoization; remove and continue to request
				delete this.memoized401[credentialKey]
			}
		}

		if (!this.inflightTokenRequests[credentialKey]) {
			this.inflightTokenRequests[credentialKey] = new Promise(
				(resolve, reject) => {
					const failureBackoff = Math.min(
						BACKOFF_TOKEN_ENDPOINT_FAILURE * this.failureCount,
						15000
					)
					const delay = this.failOnError ? 0 : this.failed ? failureBackoff : 0

					if (this.failed) {
						this.log.warn(
							`Backing off token endpoint due to previous failure. Requesting token in ${failureBackoff}ms...`
						)
					}
					setTimeout(() => {
						this.makeDebouncedTokenRequest({
							audienceType,
							clientIdToUse,
							clientSecretToUse,
						})
							.then((res) => {
								// Successful token acquisition clears any memoized 401 for this credential/audience
								delete this.memoized401[credentialKey]
								this.failed = false
								this.failureCount = 0
								delete this.inflightTokenRequests[credentialKey]
								resolve(res)
							})
							.catch((e) => {
								// Permanent tarpit SaaS 401 responses; create persistent file & suppress backoff
								if (this.isCamundaSaaS && this.is401Error(e)) {
									try {
										this.createTarpitFile({
											clientId: clientIdToUse,
											clientSecret: clientSecretToUse,
											audienceType,
											reason: e.message,
										})
									} catch (_) {
										/* ignore file write errors */
									}
									this.memoized401[credentialKey] = {
										timestamp: Date.now(),
										error: e,
									}
									// Suppress token endpoint backoff/failure counters for permanent SaaS 401 responses.
									// This ensures we do not apply retry delays for credentials that are permanently invalid.
									this.failed = false
									delete this.inflightTokenRequests[credentialKey]
									return reject(e)
								}
								if (!this.failOnError) {
									this.failureCount++
									this.failed = true
								}
								delete this.inflightTokenRequests[credentialKey]
								reject(e)
							})
					}, delay)
				}
			)
		}
		return this.inflightTokenRequests[credentialKey]
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
		trace(options)
		return this.rest.then((rest) =>
			rest
				.post(this.authServerUrl, options)
				.then((res) => {
					// If status 401 from SaaS, throw to trigger memoization upstream
					if (this.isCamundaSaaS && res.statusCode === 401) {
						const err = new Error(
							`401 Unauthorized requesting token for Client Id ${clientIdToUse}`
						)
						throw err
					}
					return JSON.parse(res.body)
				})
				.catch((e) => {
					e.message = `Error requesting token for Client Id ${clientIdToUse}: ${e.message}`
					this.log.error(
						`Error requesting token for Client Id ${clientIdToUse}`
					)
					this.log.error(e)
					throw e
				})
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
					if ((t as Token).access_token === undefined) {
						console.error(audienceType, t)
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
					this.sendToMemoryCache({ audience: audienceType, token })
					return this.addBearer(token.access_token)
				})
		)
	}

	private sendToMemoryCache({
		audience,
		token,
	}: {
		audience: TokenGrantAudienceType
		token: Token
	}) {
		const key = this.getCacheKey(audience)
		try {
			const decoded = jwtDecode(token.access_token)
			// Keeping this in the code base to help with debugging
			// trace(`Caching token in memory: ${JSON.stringify(decoded, null, 2)}`)
			trace(`Caching token for ${audience} in memory. Expiry: ${decoded.exp}`)
			token.expiry = decoded.exp ?? 0
			this.tokenCache[key] = token
		} catch (e) {
			console.error('audience', audience)
			console.error('token', token.access_token)
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
			token = JSON.parse(
				fs.readFileSync(this.getCachedTokenFileName(clientId, audience), 'utf8')
			)
			trace(`Retrieved token from file cache`)
			if (this.isExpired(token)) {
				trace(`File cached token is expired`)
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
		const file = this.getCachedTokenFileName(clientId, audience)
		const decoded = jwtDecode(token.access_token)

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

	private addBearer(token: string) {
		return { authorization: `Bearer ${token}` }
	}

	// Mutable for test overrides; legacy cooldown window (no longer used for tarpit persistence, retained for backward compatibility of tests)
	public static SAAS_401_COOLDOWN_MS = 30000

	/**
	 * Known Camunda SaaS OAuth hosts. Used for centralised SaaS detection.
	 */
	private static readonly SAAS_OAUTH_HOSTS = [
		'login.cloud.camunda.io',
		'login.cloud.dev.ultrawombat.com',
	]

	/**
	 * Determines whether the given OAuth URL belongs to a Camunda SaaS environment.
	 * Normalises the URL by stripping trailing slashes, query params, and fragments
	 * so that logically equivalent URLs are detected consistently.
	 */
	private static isSaaSUrl(oauthUrl: string | undefined): boolean {
		try {
			const parsed = new URL(oauthUrl ?? '')
			const normalizedPath = parsed.pathname.replace(/\/+$/, '')
			return (
				OAuthProvider.SAAS_OAUTH_HOSTS.includes(parsed.host) &&
				normalizedPath === '/oauth/token'
			)
		} catch {
			return false
		}
	}

	private getCredentialAudienceKey({
		clientId,
		audienceType,
	}: {
		clientId: string
		audienceType: TokenGrantAudienceType
	}) {
		return `${clientId}::${audienceType}`
	}

	private is401Error(e: unknown): e is Error {
		if (!e || typeof e !== 'object') {
			return false
		}
		const obj = e as {
			statusCode?: number
			response?: { statusCode?: number }
			message?: string
		}
		const statusCode = obj.statusCode ?? obj.response?.statusCode
		const msg = obj.message ?? ''
		return (
			statusCode === 401 || /\b401\b/.test(msg) || /Unauthorized/i.test(msg)
		)
	}

	/** Persistent 401 tarpit helpers */
	private getTarpitFilePath({
		clientId,
		clientSecret,
		audienceType,
	}: {
		clientId: string
		clientSecret: string
		audienceType: TokenGrantAudienceType
	}) {
		const hash = this.hashSecret(clientSecret)
		return path.join(
			this.cacheDir,
			`oauth-401-tarpit-${clientId}-${audienceType}-${hash}.json`
		)
	}

	private isTarpitted(file: string) {
		return this.tarpit401.has(file) && fs.existsSync(file)
	}

	private hashSecret(secret: string) {
		// Deterministic, computationally expensive derivation using PBKDF2.
		// We use a constant salt for filename determinism while increasing cost via iterations.
		// Output truncated to 16 hex chars (same length as previous SHA-256 truncation) to keep filename compact.
		// NOTE: This is not for security storage of the secret (never store raw secret); just obfuscation + cost hardening.
		const SALT = 'camunda-oauth-tarpit-filename-salt-v1'
		try {
			const derived = pbkdf2Sync(secret, SALT, 100_000, 32, 'sha256')
			return derived.toString('hex').slice(0, 16)
		} catch (err) {
			// Fail if PBKDF2 is unavailable; do not fall back to insecure hash.
			throw new Error(
				'PBKDF2 algorithm is unavailable for hashing secret: ' +
					(err instanceof Error ? err.message : String(err))
			)
		}
	}

	private createTarpitFile({
		clientId,
		clientSecret,
		audienceType,
		reason,
	}: {
		clientId: string
		clientSecret: string
		audienceType: TokenGrantAudienceType
		reason: string
	}) {
		if (!this.useFileCache) return
		const file = this.getTarpitFilePath({
			clientId,
			clientSecret,
			audienceType,
		})
		if (fs.existsSync(file)) {
			this.tarpit401.add(file)
			return
		}
		const payload = {
			createdAt: new Date().toISOString(),
			clientId,
			audienceType,
			reason,
			message: 'Persistent 401 tarpit – clear manually to retry',
		}
		try {
			fs.writeFileSync(file, JSON.stringify(payload, null, 2))
			this.tarpit401.add(file)
			trace(`Created persistent 401 tarpit file ${file}`)
		} catch (e) {
			trace(`Failed to write tarpit file ${file}: ${(e as Error).message}`)
		}
	}

	/** Public static helper to clear a specific persistent 401 tarpit */
	public static clear401Tarpit({
		cacheDir = OAuthProvider.defaultTokenCache,
		clientId,
		clientSecret,
		audienceType,
	}: {
		cacheDir?: string
		clientId: string
		clientSecret: string
		audienceType: TokenGrantAudienceType
	}) {
		try {
			// Reuse instance hashing logic deterministically (without needing an instance): replicate PBKDF2 parameters.
			const SALT = 'camunda-oauth-tarpit-filename-salt-v1'
			const hash = pbkdf2Sync(clientSecret, SALT, 100_000, 32, 'sha256')
				.toString('hex')
				.slice(0, 16)

			const file = path.join(
				cacheDir,
				`oauth-401-tarpit-${clientId}-${audienceType}-${hash}.json`
			)
			if (fs.existsSync(file)) {
				fs.unlinkSync(file)
			}
			// Best-effort in-memory cleanup for existing instances
			for (const inst of Array.from(OAuthProvider.instances)) {
				try {
					inst.tarpit401.delete(file)
					const credentialKey = inst.getCredentialAudienceKey({
						clientId,
						audienceType,
					})
					delete inst.memoized401[credentialKey]
				} catch (_) {
					/* ignore */
				}
			}
		} catch (_) {
			/* ignore */
		}
	}
}
