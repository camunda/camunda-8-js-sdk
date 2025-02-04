export const ConnectionStatusEvent = {
	close: 'close' as const,
	/** This is a latched error event. It will fire once to signal the start of a error state. */
	connectionError: 'connectionError' as const,
	ready: 'ready' as const,
	unknown: 'unknown' as const,
	/** The worker is applying a backoff. The duration of the backoff in ms is passed as a parameter to any listener */
	backoff: 'backoff' as const,
	/** This is an unlatched error event. It will fire multiple times when an error state is encountered. */
	streamError: 'streamError' as const,
}

export type ConnectionStatusEventMap = {
	close: void
	[ConnectionStatusEvent.connectionError]: void
	[ConnectionStatusEvent.ready]: void
	[ConnectionStatusEvent.unknown]: void
	[ConnectionStatusEvent.backoff]: number
	[ConnectionStatusEvent.streamError]: Error
}
