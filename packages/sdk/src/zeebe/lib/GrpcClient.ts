import { EventEmitter } from 'events'

import {
	Client,
	ClientReadableStream,
	InterceptingCall,
	Metadata,
	credentials,
	loadPackageDefinition,
	status,
} from '@grpc/grpc-js'
import { VerifyOptions } from '@grpc/grpc-js/build/src/channel-credentials'
import { Options, PackageDefinition, loadSync } from '@grpc/proto-loader'
import d from 'debug'
import { Duration, MaybeTimeDuration, TimeDuration } from 'typed-duration'

import { CamundaPlatform8Configuration, createUserAgentString } from '../../lib'
import { IOAuthProvider } from '../../oauth'

import { GrpcError } from './GrpcError'
import { Loglevel, ZBCustomLogger } from './interfaces-published-contract'

const debug = d('camunda:grpc')

export interface GrpcClientExtendedOptions {
	longPoll?: MaybeTimeDuration
	pollInterval?: MaybeTimeDuration
}
// tslint:disable: object-literal-sort-keys

function replaceTimeValuesWithMillisecondNumber<
	T extends { [key: string]: TimeDuration },
	V extends { [key: string]: number },
>(data: T): V {
	if (typeof data !== 'object') {
		return data
	}
	return Object.entries(data).reduce(
		(acc, [key, value]) => ({
			...acc,
			[key]: Duration.isTypedDuration(value)
				? Duration.milliseconds.from(value)
				: value,
		}),
		{} as V
	)
}

export const MiddlewareSignals = {
	Log: {
		Error: 'MIDDLEWARE_ERROR',
		Info: 'MIDDLEWARE_INFO',
		Debug: 'MIDDLEWARE_DEBUG',
	},
	Event: {
		Error: 'MIDDLEWARE_EVENT_ERROR',
		Ready: 'MIDDLEWARE_EVENT_READY',
		GrpcInterceptError: 'MIDDLEWARE_GRPC_INTERCEPT_ERROR',
	},
}

const InternalSignals = {
	Error: 'INTERNAL_ERROR',
	Ready: 'INTERNAL_READY',
}

const GrpcState = {
	/**
	 * The channel is trying to establish a connection and is waiting to make progress on one of the steps involved in name resolution,
	 * TCP connection establishment or TLS handshake.
	 */
	CONNECTING: 1 as const,
	/**
	 * This is the state where the channel is not even trying to create a connection because of a lack of new or pending RPCs.
	 */
	IDLE: 0 as const,
	/**
	 * The channel has successfully established a connection all the way through TLS handshake (or equivalent)
	 * and all subsequent attempt to communicate have succeeded (or are pending without any known failure ).
	 */
	READY: 2 as const,
	/**
	 * This channel has started shutting down.
	 */
	SHUTDOWN: 4 as const,
	/**
	 * There has been some transient failure (such as a TCP 3-way handshake timing out or a socket error).
	 */
	TRANSIENT_FAILURE: 3 as const,
}
const connectivityState = [
	'IDLE',
	'CONNECTING',
	'READY',
	'TRANSIENT_FAILURE',
	'SHUTDOWN',
]

export interface GrpcClientCtor {
	config: CamundaPlatform8Configuration
	connectionTolerance: MaybeTimeDuration
	host: string
	loglevel: Loglevel
	oAuth?: IOAuthProvider
	options: Options & GrpcClientExtendedOptions
	packageName: string
	protoPath: string
	service: string
	namespace: string
	tasktype?: string
	useTLS: boolean
	stdout: ZBCustomLogger
	customSSL?: CustomSSL
}

export interface CustomSSL {
	rootCerts?: Buffer
	privateKey?: Buffer
	certChain?: Buffer
	verifyOptions?: VerifyOptions
}

interface GrpcStreamError {
	code: number
	details: string
	metadata: { internalRepr: unknown; options: unknown }
	message: string
}

export class GrpcClient extends EventEmitter {
	public channelClosed = false
	public longPoll?: MaybeTimeDuration
	public connected: boolean = false
	public client: Client
	public host: string
	private closing = false
	private channelState: number = 0
	private packageDefinition: PackageDefinition
	private listNameMethods: string[]
	private gRPCRetryCount = 0
	private oAuth?: IOAuthProvider
	private readyTimer?: NodeJS.Timeout
	private failTimer?: NodeJS.Timeout
	private connectionTolerance: number
	private userAgentString: string
	private config: CamundaPlatform8Configuration

	constructor({
		config,
		connectionTolerance,
		host,
		oAuth,
		options = {},
		packageName,
		protoPath,
		service,
		useTLS,
		customSSL,
	}: GrpcClientCtor) {
		super()
		debug('Constructing gRPC client...')
		this.config = config
		this.userAgentString = createUserAgentString(config)
		this.host = host
		debug('Host:', host)
		this.oAuth = oAuth
		this.longPoll = options.longPoll
		this.connectionTolerance = Duration.milliseconds.from(connectionTolerance)
		this.emit(
			MiddlewareSignals.Log.Debug,
			`Connection Tolerance: ${Duration.milliseconds.from(
				connectionTolerance
			)}ms`
		)

		this.on(InternalSignals.Ready, () => this.setReady())
		this.on(InternalSignals.Error, () => this.setNotReady())

		this.packageDefinition = loadSync(protoPath, {
			defaults: options.defaults ?? true,
			enums: options.enums ?? String,
			keepCase: options.keepCase ?? true,
			longs: options.longs ?? String,
			oneofs: options.oneofs ?? true,
		})

		const proto = loadPackageDefinition(this.packageDefinition)[packageName]

		const listMethods = this.packageDefinition[`${packageName}.${service}`]
		const channelCredentials = useTLS
			? credentials.createSsl(
					customSSL?.rootCerts,
					customSSL?.privateKey,
					customSSL?.certChain,
					customSSL?.verifyOptions
				)
			: credentials.createInsecure()
		debug('useTLS:', useTLS)
		debug('channelCredentials:', channelCredentials)
		// Options documented here: https://github.com/grpc/grpc/blob/master/include/grpc/impl/codegen/grpc_types.h
		this.client = new proto[service](host, channelCredentials, {
			/**
			 * If set to zero, disables retry behavior.
			 * Otherwise, transparent retries are enabled for all RPCs,
			 * and configurable retries are enabled when they are configured
			 * via the service config. For details, see:
			 * https://github.com/grpc/proposal/blob/master/A6-client-retries.md
			 */
			'grpc.enable_retries': 1,
			/**
			 * The time between the first and second connection attempts,
			 * in ms
			 */
			'grpc.initial_reconnect_backoff_ms':
				this.config.zeebeGrpcSettings.GRPC_INITIAL_RECONNECT_BACKOFF_MS,
			/**
			 * The maximum time between subsequent connection attempts,
			 * in ms
			 */
			'grpc.max_reconnect_backoff_ms':
				this.config.zeebeGrpcSettings.GRPC_MAX_RECONNECT_BACKOFF_MS,
			/**
			 * The minimum time between subsequent connection attempts,
			 * in ms. Default is 1000ms, but this can cause an SSL Handshake failure.
			 * This causes an intermittent failure in the Worker-LongPoll test when run
			 * against Camunda Cloud.
			 * Raised to 5000ms.
			 * See: https://github.com/grpc/grpc/issues/8382#issuecomment-259482949
			 */
			'grpc.min_reconnect_backoff_ms':
				this.config.zeebeGrpcSettings.GRPC_INITIAL_RECONNECT_BACKOFF_MS,
			/**
			 * After a duration of this time the client/server
			 * pings its peer to see if the transport is still alive.
			 * Int valued, milliseconds.
			 */
			'grpc.keepalive_time_ms':
				this.config.zeebeGrpcSettings.GRPC_KEEPALIVE_TIME_MS,
			/**
			 * After waiting for a duration of this time,
			 * if the keepalive ping sender does
			 * not receive the ping ack, it will close the
			 * transport. Int valued, milliseconds.
			 */
			'grpc.keepalive_timeout_ms':
				this.config.zeebeGrpcSettings.GRPC_KEEPALIVE_TIMEOUT_MS,
			'grpc.http2.min_time_between_pings_ms':
				this.config.zeebeGrpcSettings.GRPC_HTTP2_MIN_TIME_BETWEEN_PINGS_MS,
			/**
			 * Minimum allowed time between a server receiving
			 * successive ping frames without sending any data
			 * frame. Int valued, milliseconds. Default: 90000
			 */
			'grpc.http2.min_ping_interval_without_data_ms':
				this.config.zeebeGrpcSettings
					.GRPC_HTTP2_MIN_PING_INTERVAL_WITHOUT_DATA_MS,
			/**
			 * This channel argument if set to 1
			 * (0 : false; 1 : true), allows keepalive pings
			 * to be sent even if there are no calls in flight.
			 * Default is 1.
			 */
			'grpc.keepalive_permit_without_calls':
				this.config.zeebeGrpcSettings.GRPC_KEEPALIVE_PERMIT_WITHOUT_CALLS,
			/**
			 * This channel argument controls the maximum number
			 * of pings that can be sent when there is no other
			 * data (data frame or header frame) to be sent.
			 * GRPC Core will not continue sending pings if we
			 * run over the limit. Setting it to 0 allows sending
			 * pings without sending data.
			 */
			'grpc.http2.max_pings_without_data':
				this.config.zeebeGrpcSettings.GRPC_HTTP2_MAX_PINGS_WITHOUT_DATA,
			/**
			 * Default compression algorithm for the channel, applies to sending messages.
			 *
			 * Possible values for this option are:
			 * - `0` - No compression
			 * - `1` - Compress with DEFLATE algorithm
			 * - `2` - Compress with GZIP algorithm
			 * - `3` - Stream compression with GZIP algorithm
			 */
			'grpc.default_compression_algorithm': 2,
			/**
			 * Default compression level for the channel, applies to receiving messages.
			 *
			 * Possible values for this option are:
			 * - `0` - None
			 * - `1` - Low level
			 * - `2` - Medium level
			 * - `3` - High level
			 */
			'grpc.default_compression_level': 2,
			interceptors: [this.interceptor],
		})
		this.listNameMethods = []

		// See https://github.com/camunda/camunda-8-js-sdk/issues/150
		this.client.waitForReady(new Date(Date.now() + 10000), (error) =>
			error
				? this.emit(MiddlewareSignals.Event.Error, error)
				: this.emit(MiddlewareSignals.Event.Ready)
		)

		for (const key in listMethods) {
			if (listMethods[key]) {
				const methodName = listMethods[key].originalName as string

				this.listNameMethods.push(methodName)

				this[`${methodName}Stream`] = async (data) => {
					debug(`Calling ${methodName}Stream...`, host)
					if (this.closing) {
						return
					}
					let stream: ClientReadableStream<unknown>
					const timeNormalisedRequest =
						replaceTimeValuesWithMillisecondNumber(data)
					debug('TimeNormalisedRequest', timeNormalisedRequest)
					try {
						const metadata = await this.getAuthToken()

						stream = this.client[methodName](timeNormalisedRequest, metadata)
						this.setReady()
					} catch (error: unknown) {
						const e = error as Error & { code: number }
						debug(`${methodName}Stream error: ${e.code}`, e.message)
						this.emit(MiddlewareSignals.Log.Error, e.message)
						this.emit(MiddlewareSignals.Event.Error)
						this.setNotReady()
						return { error }
					}
					if (!stream) {
						return {
							error: new Error(
								`No stream returned by call to ${methodName}Stream`
							),
						}
					}

					// This deals with the case where during a broker restart the call returns a stream
					// but that stream is not a legit Gateway activation. In that case, the Gateway will
					// never time out or close the stream. So we have to manage that case.
					const clientsideTimeoutDuration =
						Duration.milliseconds.from(this.longPoll!) + 1000
					const clientSideTimeout = setTimeout(() => {
						debug(
							`Triggered client-side timeout after ${clientsideTimeoutDuration}ms`
						)
						stream.emit('end')
					}, clientsideTimeoutDuration)

					/**
					 * Once this gets attached here, it is attached to *all* calls
					 * This is an issue if you do a sync call like cancelWorkflowSync
					 * The error will not propagate, and the channel will be closed.
					 * So we use a separate GRPCClient for the client, which never does
					 * streaming calls, and each worker, which only does streaming calls
					 */
					stream.on('error', (error: GrpcStreamError) => {
						clearTimeout(clientSideTimeout)
						debug(`${methodName}Stream error emitted by stream`, error)
						this.emit(MiddlewareSignals.Event.Error)
						if (error.message.includes('14 UNAVAILABLE')) {
							this.emit(
								MiddlewareSignals.Log.Error,
								`Grpc Stream Error: ${error.message} - ${host}`
							)
						} else {
							this.emit(
								MiddlewareSignals.Log.Error,
								`Grpc Stream Error: ${error.message}`
							)
						}
						// Do not handle stream errors the same way
						// this.handleGrpcError(stream)(error)
						this.setNotReady()
					})
					stream.on('data', () => (this.gRPCRetryCount = 0))
					stream.on('metadata', (md) =>
						this.emit(MiddlewareSignals.Log.Debug, JSON.stringify(md))
					)
					stream.on('status', (s) =>
						this.emit(
							MiddlewareSignals.Log.Debug,
							`gRPC Status event: ${JSON.stringify(s)}`
						)
					)
					stream.on('end', () => clearTimeout(clientSideTimeout))

					return stream
				}

				this[`${methodName}Sync`] = (data) => {
					debug(`Calling ${methodName}Sync...`, host)

					if (this.closing) {
						debug(`Aborting ${methodName}Sync due to client closing.`)
						return
					}
					const timeNormalisedRequest =
						replaceTimeValuesWithMillisecondNumber(data)
					const client = this.client
					// eslint-disable-next-line no-async-promise-executor
					return new Promise(async (resolve, reject) => {
						try {
							const metadata = (await this.getAuthToken()) || {}
							debug(methodName, 'timeNormalisedRequest', timeNormalisedRequest)

							client[methodName](
								timeNormalisedRequest,
								metadata,
								(err, dat) => {
									// This will error on network or business errors
									if (err) {
										debug(`${methodName}Sync error: ${err.code}`)
										debug(err.message)
										const isNetworkError =
											err.code === GrpcError.UNAVAILABLE &&
											!err.message.includes('partition')
										if (isNetworkError) {
											this.setNotReady()
										} else {
											this.setReady()
										}
										return reject(err)
									}
									this.emit(MiddlewareSignals.Event.Ready)
									this.setReady()
									debug(`${methodName}Sync completed`)
									resolve(dat)
								}
							)
						} catch (e: unknown) {
							reject(e)
						}
					})
				}
			}
		}
	}

	public runService(fnName, data, fnAnswer) {
		this.client[fnName](data, fnAnswer)
	}

	public listMethods() {
		return this.listNameMethods
	}

	public close(timeout = 5000): Promise<void> {
		const STATE_SHUTDOWN = 4
		const isClosed = (state) => state === STATE_SHUTDOWN

		this.closing = true
		let alreadyClosed = false
		return new Promise((resolve, reject) => {
			const gRPC = this.client
			gRPC.getChannel().close()
			gRPC.close()
			try {
				this.channelState = gRPC.getChannel().getConnectivityState(false)
			} catch (e: unknown) {
				const msg = (e as Error).toString()
				alreadyClosed =
					isClosed(this.channelState) ||
					msg.includes('Cannot call getConnectivityState on a closed Channel') // C-based library
			}

			const closed = isClosed(this.channelState)
			if (closed || alreadyClosed) {
				this.channelClosed = true
				this.emit(MiddlewareSignals.Log.Info, 'Grpc channel closed')
				return resolve() // setTimeout(() => resolve(), 2000)
			}

			this.emit(
				MiddlewareSignals.Log.Info,
				`Grpc Channel State: ${connectivityState[this.channelState]}`
			)
			const deadline = new Date().setSeconds(new Date().getSeconds() + 300)
			gRPC
				.getChannel()
				.watchConnectivityState(this.channelState, deadline, async () => {
					try {
						this.channelState = gRPC.getChannel().getConnectivityState(false)
						this.emit(
							MiddlewareSignals.Log.Info,
							`Grpc Channel State: ${connectivityState[this.channelState]}`
						)
						alreadyClosed = isClosed(this.channelState)
					} catch (e: unknown) {
						const msg = (e as Error).toString()
						alreadyClosed =
							msg.includes(
								'Cannot call getConnectivityState on a closed Channel'
							) || isClosed(this.channelState)
						this.emit(MiddlewareSignals.Log.Info, `Closed: ${alreadyClosed}`)
					}
					if (alreadyClosed) {
						return resolve()
					}
				})

			return setTimeout(() => {
				// tslint:disable-next-line: no-console
				console.log(`Channel timeout after ${timeout}`) // @DEBUG

				return isClosed(this.channelState)
					? null
					: reject(new Error(`Didn't close in time: ${this.channelState}`))
			}, timeout)
		})
	}

	private async getAuthToken() {
		const metadata = new Metadata({ waitForReady: false })
		metadata.add('user-agent', this.userAgentString)
		if (this.oAuth) {
			const token = await this.oAuth.getToken('ZEEBE')
			metadata.add('Authorization', `Bearer ${token}`)
		}
		return metadata
	}

	private waitForGrpcChannelReconnect(): Promise<number> {
		this.emit(MiddlewareSignals.Log.Debug, 'Start watching Grpc channel...')
		return new Promise((resolve) => {
			const tryToConnect = true
			const gRPC = this.client
			if (this.channelClosed) {
				return
			}
			const currentChannelState = gRPC
				.getChannel()
				.getConnectivityState(tryToConnect)
			this.emit(
				MiddlewareSignals.Log.Error,
				`Grpc Channel State: ${connectivityState[currentChannelState]}`
			)
			const delay = currentChannelState === GrpcState.TRANSIENT_FAILURE ? 5 : 30
			const deadline = new Date().setSeconds(new Date().getSeconds() + delay)
			if (
				currentChannelState === GrpcState.IDLE ||
				currentChannelState === GrpcState.READY
			) {
				this.gRPCRetryCount = 0
				return resolve(currentChannelState)
			}

			gRPC
				.getChannel()
				.watchConnectivityState(
					currentChannelState,
					deadline,
					async (error) => {
						if (this.channelClosed) {
							return
						}
						this.gRPCRetryCount++
						if (error) {
							this.emit(MiddlewareSignals.Log.Error, error)
						}
						const newState = gRPC
							.getChannel()
							.getConnectivityState(tryToConnect)
						this.emit(
							MiddlewareSignals.Log.Error,
							`Grpc Channel State: ${connectivityState[newState]}`
						)
						this.emit(
							MiddlewareSignals.Log.Error,
							`Grpc Retry count: ${this.gRPCRetryCount}`
						)
						if (newState === GrpcState.READY || newState === GrpcState.IDLE) {
							return resolve(newState)
						} else {
							this.emit(
								MiddlewareSignals.Log.Error,
								`Grpc Retry count: ${this.gRPCRetryCount}`
							)
							return resolve(await this.waitForGrpcChannelReconnect())
						}
					}
				)
		})
	}

	private setReady() {
		// debounce rapid connect / disconnect
		if (this.readyTimer) {
			this.emit(MiddlewareSignals.Log.Debug, 'Reset Grpc channel ready timer.')
			clearTimeout(this.readyTimer)
		}
		this.emit(
			MiddlewareSignals.Log.Debug,
			`Set Grpc channel ready timer for ${this.connectionTolerance}ms`
		)

		this.readyTimer = setTimeout(() => {
			if (this.failTimer) {
				clearTimeout(this.failTimer)
				this.failTimer = undefined
			}
			this.readyTimer = undefined
			this.connected = true
			this.emit(
				MiddlewareSignals.Log.Debug,
				`Set Grpc channel state ready after ${this.connectionTolerance}ms`
			)
			this.emit(MiddlewareSignals.Event.Ready)
		}, this.connectionTolerance)
	}

	private setNotReady() {
		if (this.readyTimer) {
			this.emit(MiddlewareSignals.Log.Debug, 'Cancelled channel ready timer')
			clearTimeout(this.readyTimer)
			this.readyTimer = undefined
		}
		this.connected = false
		if (!this.failTimer) {
			this.emit(
				MiddlewareSignals.Log.Debug,
				`Set Grpc channel failure timer for ${this.connectionTolerance}ms`
			)
			this.failTimer = setTimeout(() => {
				if (this.readyTimer) {
					this.failTimer = undefined
					this.emit(
						MiddlewareSignals.Log.Debug,
						'Grpc channel ready timer is running, not failing channel...'
					)
					return
				}
				this.emit(
					MiddlewareSignals.Log.Debug,
					`Set Grpc Channel state to failed after ${this.connectionTolerance}ms`
				)
				this.failTimer = undefined
				this.connected = false
				this.emit(MiddlewareSignals.Event.Error)
			}, this.connectionTolerance)
		}
	}

	// https://github.com/grpc/proposal/blob/master/L5-node-client-interceptors.md#proposal
	private interceptor = (options, nextCall) => {
		const requester = {
			start: (metadata, _, next) => {
				const newListener = {
					onReceiveStatus: (
						callStatus: { code: number; details: string },
						nxt: (...args) => unknown
					) => {
						const isError = callStatus.code !== status.OK
						if (isError) {
							if (
								callStatus.code === 1 &&
								callStatus.details.includes('503') // 'Service Unavailable'
							) {
								return this.emit(MiddlewareSignals.Event.GrpcInterceptError, {
									callStatus,
									options,
								})
							}
							if (callStatus.code === 1 && this.closing) {
								return this.emit(
									MiddlewareSignals.Log.Debug,
									'Closing, and error received from server'
								)
							}
						}
						return nxt(callStatus)
					},
				}
				next(metadata, newListener)
			},
		}
		return new InterceptingCall(nextCall(options), requester)
	}
}
