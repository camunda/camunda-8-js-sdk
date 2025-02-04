import { EventEmitter } from 'events'

type EventMap = Record<string, unknown>

type EventKey<T extends EventMap> = string & keyof T
type EventReceiver<T> = (params: T) => void

interface Emitter<T extends EventMap> {
	on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
	off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void
	emit<K extends EventKey<T>>(eventName: K, params?: T[K]): void
}

export class TypedEmitter<T extends EventMap> implements Emitter<T> {
	private emitter = new EventEmitter()
	public on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
		this.emitter.on(eventName, fn)
		return this
	}

	public off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>) {
		this.emitter.off(eventName, fn)
	}

	public emit<K extends EventKey<T>>(eventName: K, params?: T[K]) {
		this.emitter.emit(eventName, params)
	}

	public removeAllListeners() {
		this.emitter.removeAllListeners()
	}
}
