import pino from 'pino'
import Transport from 'winston-transport'

import { Camunda8 } from '../../c8/index'
import { createLogger } from '../../c8/lib/C8Logger'

const logger = pino({ level: 'trace' })
logger.info('Pino console logger created')

// Manually verified - it works
xtest('It can use pino as a logging library', async () => {
	const c8 = new Camunda8({
		logger,
	})
	const rest = c8.getCamundaRestClient()
	const topology = await rest.getTopology()
	c8.log.info(JSON.stringify(topology))
})

test('It can use a custom winston logging transport', () => {
	class MemoryTransport extends Transport {
		logs: { message: string; level: string; timestamp: string }[]
		errors: Error[]
		constructor(opts?: Transport.TransportStreamOptions | undefined) {
			super(opts)
			this.logs = []
			this.errors = []
		}
		log(
			info: Error | { message: string; level: string; timestamp: string },
			callback: () => void
		) {
			// Immediately emit the logged event (this is required for Winston)
			setImmediate(() => {
				this.emit('logged', info)
			})
			if (info instanceof Error) {
				this.errors.push(info)
			} else {
				this.logs.push(info)
			}
			callback()
		}
	}
	const transport = new MemoryTransport()
	const logger = createLogger({
		level: 'debug', // You have to set the level when you create the logger
		transports: [transport],
	})
	const c8 = new Camunda8({
		logger,
	})
	c8.log.info('This is a test')
	expect(transport.logs.length).toBeGreaterThanOrEqual(3)
})
