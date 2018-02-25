import { Socket } from 'net';

/** */
export enum SocketConnectionEvent {
  // CONNECTED = 'eventsocketconnectionconnected',
  // DISCONNECTED = 'eventsocketconnectiondisconnected',
  // DISPOSED = 'eventsocketconnectiondisposed',
  // TIMEOUT = 'eventsocketconnectiontimeout',
  // ALIVE = 'eventsocketconnectionalive',
  // REGISTER = 'eventsocketconnectionregister',
  // UNREGISTER = 'eventsocketconnectionunregister'
}

/** */
export enum SocketServerEvent {
  // LISTENING = 'eventsocketserverlistening',
  // DISPOSED = 'eventsocketserverdisposed',
  // ALIVE = 'eventsocketserveralive',
  CLIENT_CONNECTED = 'eventsocketserverclientconnected'
}

/** */
export type ConnectionType = IncomingConnectionType | OutgoingConnectionType
export type IncomingConnectionType = 'upper' | 'query'
export type OutgoingConnectionType = 'lower'

/** */
export type SocketDescription = {
  socket: Socket,
  portDescription: ConnectionType
}