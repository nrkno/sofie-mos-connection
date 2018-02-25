import {Socket} from 'net'

/** */
export class SocketConnection {

	socket: Socket

	constructor (socket: Socket) {
		this.socket = socket
	}
}

/** */
export enum SocketConnectionStatus {
  CONNECTED = 'socketconnectionstatusconnected',
  DISCONNECTED = 'socketconnectionstatusdisconnected',
  DISPOSED = 'socketconnectionstatusdestroyed',
  TIMEOUT = 'socketconnectionstatustimeout',
  ALIVE= 'socketconnectionstatusalive'
}

/** */
export enum SocketServerConnectionStatus {
  LISTENING = 'socketserverconnectionstatuslistening',
  DISPOSED = 'socketserverconnectionstatusdestroyed',
  ALIVE= 'socketserverconnectionstatusalive'
}

/** */
export type SocketType = 'Lower' | 'Upper' | 'Query'
