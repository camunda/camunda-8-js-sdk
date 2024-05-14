import EventEmitter from 'events'

export class Subscription<T> extends EventEmitter {
	private _cancelled = false
	dataGenerator: (interval: number) => AsyncGenerator<T, void, unknown>

	constructor(restCall: () => Promise<T>) {
		super()
		// Define a function generator that fetches data at regular intervals
		this.dataGenerator = async function* (
			interval: number
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		): AsyncGenerator<T, void, unknown> {
			while (true) {
				try {
					const data = await restCall()
					if (data) {
						// or 404
						// If data is available, yield it
						yield data
						// Break the loop if data is available
						break
					}
				} catch (error) {
					console.error('Error fetching data:', error)
				}
				// Wait for the specified interval before trying again
				await new Promise((resolve) => setTimeout(resolve, interval))
			}
		}
		this.start()
	}

	public cancel() {
		this._cancelled = true
		this.emit('cancelled')
	}

	public get cancelled() {
		return this._cancelled
	}

	private async start() {
		const generator = this.dataGenerator(5000) // Fetch data every 5 seconds
		for await (const data of generator) {
			this.emit('data', data)
		}
	}
}
