import net from 'node:net'

import { allowAny } from '../../test-support/testTags'
import { TcpFaultProxy } from '../support/TcpFaultProxy'

const echoServer = async () => {
	const server = net.createServer((socket) => {
		socket.on('error', () => undefined)
		socket.pipe(socket)
	})
	await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
	return {
		port: (server.address() as net.AddressInfo).port,
		close: () => new Promise<void>((resolve) => server.close(() => resolve())),
	}
}

const connect = (port: number) =>
	new Promise<net.Socket>((resolve, reject) => {
		const socket = net.connect(port, '127.0.0.1', () => resolve(socket))
		socket.once('error', reject)
	})

const roundTrip = (socket: net.Socket, text: string) =>
	new Promise<string>((resolve, reject) => {
		socket.once('data', (data) => resolve(data.toString()))
		socket.once('error', reject)
		socket.write(text)
	})

const closed = (socket: net.Socket) =>
	new Promise<void>((resolve) => {
		socket.on('error', () => undefined)
		if (socket.destroyed) return resolve()
		socket.once('close', () => resolve())
	})

describe.runIf(allowAny([{ deployment: 'unit-test' }]))('TcpFaultProxy', () => {
	test('forwards traffic, severs connections, refuses while paused, and resumes', async () => {
		const upstream = await echoServer()
		const proxy = await TcpFaultProxy.start({
			host: '127.0.0.1',
			port: upstream.port,
		})
		try {
			const first = await connect(proxy.port)
			expect(await roundTrip(first, 'hello')).toBe('hello')
			expect(proxy.openConnections).toBe(1)

			// sever(): the open connection dies; new ones are accepted.
			expect(proxy.sever()).toBe(1)
			await closed(first)
			const second = await connect(proxy.port)
			expect(await roundTrip(second, 'again')).toBe('again')

			// pause(): the open connection dies and new ones are refused.
			proxy.pause()
			await closed(second)
			const refused = await connect(proxy.port)
			await closed(refused)
			expect(proxy.openConnections).toBe(0)

			// resume(): traffic flows again.
			proxy.resume()
			const third = await connect(proxy.port)
			expect(await roundTrip(third, 'back')).toBe('back')
			expect(proxy.acceptedConnections).toBe(4)
			third.destroy()
		} finally {
			await proxy.close()
			await upstream.close()
		}
	})

	test('closing the upstream closes the client side', async () => {
		const upstream = await echoServer()
		const proxy = await TcpFaultProxy.start({
			host: '127.0.0.1',
			port: upstream.port,
		})
		try {
			const client = await connect(proxy.port)
			expect(await roundTrip(client, 'x')).toBe('x')
			proxy.sever()
			await closed(client)
			expect(proxy.openConnections).toBe(0)
		} finally {
			await proxy.close()
			await upstream.close()
		}
	})
})
