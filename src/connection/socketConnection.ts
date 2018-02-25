import {Socket} from 'net'

/** */
export class SocketConnection {

	socket: Socket

	constructor (socket: Socket) {
		this.socket = socket
	}
}

/** */
export enum SocketConnectionEvent {
  CONNECTED = 'eventsocketconnectionconnected',
  DISCONNECTED = 'eventsocketconnectiondisconnected',
  DISPOSED = 'eventsocketconnectiondisposed',
  TIMEOUT = 'eventsocketconnectiontimeout',
  ALIVE = 'eventsocketconnectionalive',
  REGISTER = 'eventsocketconnectionregister',
  UNREGISTER = 'eventsocketconnectionunregister'
}

/** */
export enum SocketServerEvent {
  LISTENING = 'eventsocketserverlistening',
  DISPOSED = 'eventsocketserverdisposed',
  ALIVE = 'eventsocketserveralive'
}

/** */
export type SocketType = 'Lower' | 'Upper' | 'Query'
