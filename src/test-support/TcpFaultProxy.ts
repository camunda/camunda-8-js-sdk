import net from 'node:net'

/**
 * A minimal in-process TCP proxy for fault injection in tests.
 *
 * Put it between an SDK client and a broker (or any TCP server) and use it to
 * cut the connection the way a network or a gateway restart would: `sever()`
 * destroys every open connection, `pause()` also refuses new ones until
 * `resume()`. It does not parse the protocol, so it works for gRPC (HTTP/2)
 * over plaintext. It needs no external tooling, which keeps it portable to
 * every CI job.
 */
export class TcpFaultProxy {
	private readonly server: net.Server
	private readonly sockets = new Set<net.Socket>()
	private paused = false
	/** Connections accepted since the proxy started, including refused ones. */
	acceptedConnections = 0

	private constructor(
		private readonly target: { host: string; port: number },
		server: net.Server
	) {
		this.server = server
		this.server.on('connection', (client) => this.onConnection(client))
	}

	/** Start a proxy on an ephemeral port on the loopback interface. */
	static async start(target: {
		host: string
		port: number
	}): Promise<TcpFaultProxy> {
		const server = net.createServer({ pauseOnConnect: true })
		const proxy = new TcpFaultProxy(target, server)
		await new Promise<void>((resolve, reject) => {
			server.once('error', reject)
			server.listen(0, '127.0.0.1', () => {
				server.off('error', reject)
				resolve()
			})
		})
		return proxy
	}

	get port(): number {
		return (this.server.address() as net.AddressInfo).port
	}

	/** The address to give an SDK client, in `grpc://host:port` form. */
	get grpcAddress(): string {
		return `grpc://127.0.0.1:${this.port}`
	}

	/** Number of open proxied connections (client side). */
	get openConnections(): number {
		return this.sockets.size / 2
	}

	/** Destroy every open connection. New connections are still accepted. */
	sever(): number {
		const count = this.openConnections
		this.sockets.forEach((socket) => socket.destroy())
		this.sockets.clear()
		return count
	}

	/** Sever, and refuse (immediately close) new connections until `resume()`. */
	pause(): void {
		this.paused = true
		this.sever()
	}

	resume(): void {
		this.paused = false
	}

	async close(): Promise<void> {
		this.sever()
		await new Promise<void>((resolve) => this.server.close(() => resolve()))
	}

	private onConnection(client: net.Socket) {
		this.acceptedConnections++
		if (this.paused) {
			client.destroy()
			return
		}
		const upstream = net.connect(this.target.port, this.target.host)
		this.sockets.add(client)
		this.sockets.add(upstream)
		const teardown = () => {
			client.destroy()
			upstream.destroy()
			this.sockets.delete(client)
			this.sockets.delete(upstream)
		}
		// Errors are expected when a side is cut; they end the pair.
		client.on('error', teardown)
		upstream.on('error', teardown)
		client.on('close', teardown)
		upstream.on('close', teardown)
		client.pipe(upstream)
		upstream.pipe(client)
		client.resume()
	}
}
